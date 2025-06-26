"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Models, Query } from "node-appwrite";
import { convertFileSize, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import path from "path"
import { mkdir, writeFile, readdir, readFile } from "fs/promises";
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
export async function getTotalSpaceUsed({ userId }: { userId: string }) {
    const dirPath = path.join(process.cwd(), `uploads/${userId}/`);
    const userDirExists = existsSync(dirPath);

    if (!userDirExists) return { success: true, data: 0 } as FileResult;

    try {
        const filesInDir = await readdir(dirPath);

        const fileSizes = await Promise.all(
            filesInDir.map(async (fileName) => {
                const filePath = path.join(dirPath, fileName);
                const buffer = await readFile(filePath);
                return buffer.byteLength; // Use byteLength instead of converting to Blob + File
            })
        );

        const totalUsedSize = fileSizes.reduce((acc, size) => acc + size, 0);

        return { success: true, data: totalUsedSize } as FileResult;
    } catch (err) {
        console.error(err);
        return { success: false, error: "Couldn't get total files size!" } as FileResult;
    }
}
export async function getFileSize({ userId, fileName }: { userId: string, fileName: string }) {
    const filePath = path.join(process.cwd(), `uploads/${userId}/${fileName}`);
    const userFileExists = existsSync(filePath);

    if (!userFileExists) return { success: true, data: 0 } as FileResult;

    try {

        const buffer = await readFile(filePath);

        return { success: true, data: buffer.byteLength } as FileResult;

    } catch (err) {
        console.log(err);
        return { success: false, error: "Couldn't get file size!" } as FileResult;
    }


}
export async function getAllFilesSizes({ userId, fileNames }: { userId: string, fileNames: string[] }) {

    try {
        const totalSizes = await Promise.all(
            fileNames.map(async (filename) => {
                const filePath = path.join(process.cwd(), `uploads/${userId}/${filename}`);
                const buffer = await readFile(filePath);
                return buffer.byteLength;
            })
        );

        const totalSize = totalSizes.reduce((previous, current) => previous + current, 0)

        return { success: true, data: totalSize } as FileResult;

    } catch (err) {
        console.log(err);
        return { success: false, error: "Couldn't get sizes!" } as FileResult;
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