"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import path from "path"
import { mkdir, writeFile, readdir } from "fs/promises";
import { existsSync } from "fs";

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

const createQueries = (
    currentUser: Models.Document,
    types: string[],
    searchText: string,
    sort: string,
    limit?: number,
) => {
    const queries = [
        Query.or([
            Query.equal("owner", [currentUser.$id]),
            Query.contains("users", [currentUser.email]),
        ]),
    ];

    if (types.length > 0) queries.push(Query.equal("type", types));
    if (searchText) queries.push(Query.contains("name", searchText));
    if (limit) queries.push(Query.limit(limit));

    if (sort) {
        const [sortBy, orderBy] = sort.split("-");

        queries.push(
            orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy),
        );
    }

    return queries;
};

export const renameFile = async ({
    fileId,
    name,
    extension,
    path,
}: RenameFileProps) => {
    const { databases } = await createAdminClient();

    try {
        const newName = `${name}.${extension}`;
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                name: newName,
            },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
};

export const updateFileUsers = async ({
    fileId,
    emails,
    path,
}: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();

    try {
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                users: emails,
            },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
};

export const deleteFile = async ({
    fileId,
    bucketFileId,
    path,
}: DeleteFileProps) => {
    const { databases, storage } = await createAdminClient();

    try {
        const deletedFile = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
        );

        if (deletedFile) {
            await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
        }

        revalidatePath(path);
        return parseStringify({ status: "success" });
    } catch (error) {
        handleError(error, "Failed to rename file");
    }
};

// ============================== TOTAL FILE SPACE USED
export async function getTotalSpaceUsed() {
    try {
        const { databases } = await createSessionClient();
        // const currentUser = await getCurrentUser();
        // if (!currentUser) throw new Error("User is not authenticated.");

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            [Query.equal("owner", ["user id"])],
        );

        const totalSpace = {
            image: { size: 0, latestDate: "" },
            document: { size: 0, latestDate: "" },
            video: { size: 0, latestDate: "" },
            audio: { size: 0, latestDate: "" },
            other: { size: 0, latestDate: "" },
            used: 0,
            all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
        };

        files.documents.forEach((file) => {
            const fileType = file.type as FileType;
            totalSpace[fileType].size += file.size;
            totalSpace.used += file.size;

            if (
                !totalSpace[fileType].latestDate ||
                new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
            ) {
                totalSpace[fileType].latestDate = file.$updatedAt;
            }
        });

        return parseStringify(totalSpace);
    } catch (error) {
        handleError(error, "Error calculating total space used:, ");
    }
}


//################## Uploading proccess #######################

export const uploadFile = async ({
    file,
    userId
}: UploadFileProps) => {
    try {
        const fileName = file.name.replaceAll(" ", "_")
        const dirPath = path.join(process.cwd(), `uploads/${userId}`)
        if (!existsSync(dirPath)) {
            await mkdir(dirPath);
        }
        const filePath = path.join(process.cwd(), `uploads/${userId}/` + fileName)
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        revalidatePath('/')
        const result: FileResult = { success: true, data: fileName }
        return result;
    } catch (err) {
        console.log(err)
        return { success: false, error: "Something went wrong. File didn't uploaded!" } as FileResult;
    }
};

//################## Get files proccess #######################
export const getFiles = async ({
    userId,
    types = [],
    searchText = "",
    sort = "$createdAt-desc",
    limit,
}: GetFilesProps) => {

    const dirPath = path.join(process.cwd(), `uploads/${userId}/`)
    const userDir = existsSync(dirPath)

    if (!userDir) return { success: true, data: [] } as FileResult;

    try {

        const filesInDir = await readdir(dirPath);
        return { success: true, data: filesInDir } as FileResult;

    } catch (err) {
        handleError(err, "can't read files from server!")
        return { success: false, error: "can't read files from server!" } as FileResult;
    }
    // try {
    //     const currentUser = await getCurrentUser();

    //     if (!currentUser) throw new Error("User not found");

    //     const queries = createQueries(currentUser, types, searchText, sort, limit);

    //     const files = await databases.listDocuments(
    //         appwriteConfig.databaseId,
    //         appwriteConfig.filesCollectionId,
    //         queries,
    //     );

    //     console.log({ files });
    //     return parseStringify(files);
    // } catch (error) {
    //     handleError(error, "Failed to get files");
    // }
};





// todo : ## extract the structure of file uploading system from this file.
// todo : ## define types needed for file system. 