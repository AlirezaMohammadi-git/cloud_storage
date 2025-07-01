"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getFileType, parseStringify, uuidv4 } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import path from "path"
import { mkdir, writeFile, readdir, readFile, rm, rename } from "fs/promises";
import { existsSync } from "fs";
import { pool } from "@/db";



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
        handleError(error);
    }
};


// #################################################################
// #################### TOTAL FILE SPACE USED ######################
// #################################################################
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
        handleError(err);
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
        handleError(err);
        return { success: false, error: "Couldn't get file size!" } as FileResult;
    }


}
export async function getAllFilesSizes({ userId, fileNames }: { userId: string, fileNames: FileMeataData[] }) {

    try {
        const totalSizes = await Promise.all(
            fileNames.map(async (metadata) => {
                const filePath = path.join(process.cwd(), `uploads/${userId}/${metadata.name}`);
                const buffer = await readFile(filePath);
                return buffer.byteLength;
            })
        );

        const totalSize = totalSizes.reduce((previous, current) => previous + current, 0)

        return { success: true, data: totalSize } as FileResult;

    } catch (err) {
        handleError(err);
        return { success: false, error: "Couldn't get sizes!" } as FileResult;
    }


}

// #################################################################
// ################### DASHBOARD UTILS #############################
// #################################################################
export const getUsageSummary = async (fileNames: FileMeataData[], userId: string) => {

    try {
        const images = fileNames.filter(fileName => fileName.type === "image")
        const videos = fileNames.filter(fileName => fileName.type === "video")
        const audios = fileNames.filter(fileName => (fileName).type === "audio")
        const documents = fileNames.filter(fileName => (fileName).type === "document")
        const other = fileNames.filter(fileName => (fileName).type === "other")

        const imageSize = await getAllFilesSizes({ userId: userId, fileNames: images })
        const videoSize = await getAllFilesSizes({ userId: userId, fileNames: videos })
        const audioSize = await getAllFilesSizes({ userId: userId, fileNames: audios })
        const documentSize = await getAllFilesSizes({ userId: userId, fileNames: documents })
        const otherSize = await getAllFilesSizes({ userId: userId, fileNames: other })

        const mediaSize = (videoSize.success ? videoSize.data as number : 0) + (audioSize.success ? audioSize.data as number : 0);

        return [
            {
                title: "Documents",
                size: documentSize.success ? documentSize.data as number : 0,
                icon: "/assets/icons/file-document-light.svg",
                url: "/documents",
            },
            {
                title: "Images",
                size: imageSize.success ? imageSize.data as number : 0,
                icon: "/assets/icons/file-image-light.svg",
                url: "/images",
            },
            {
                title: "Media",
                size: mediaSize as number,
                icon: "/assets/icons/file-video-light.svg",
                url: "/media",
            },
            {
                title: "Others",
                size: otherSize.success ? otherSize.data as number : 0,
                icon: "/assets/icons/file-other-light.svg",
                url: "/others",
            },
        ];
    } catch (err) {
        handleError(err);
        return [];
    }

};
export async function getFilePath({ fileName, userId }: { fileName: string, userId: string }) {
    return path.join(process.cwd(), "uploads", userId, fileName);
}
export async function createFileUrl(userId: string, fileName: string) {
    return path.join("api", "uploads", userId, fileName);
}
const handleError = (error: unknown) => {
    console.error("❌ File.Actions:", error);
};


// #################################################################
// ######################## CRUD proccessess #######################
// #################################################################

// ################### CREATE
async function uploadFileMetaData(metadata: FileMeataData): Promise<FileResult> {
    try {
        await pool.query(`INSERT INTO files_metadata ( id, name , fType, url, size, date_added,owners)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (id) DO NOTHING;`, [metadata.id, metadata.name, metadata.type, metadata.url, metadata.size, metadata.dateAdded, metadata.owners])

        return { success: true, data: metadata } as FileResult;

    } catch (err) {

        handleError(err);

        // Type guard for PostgreSQL errors
        if (err instanceof Error && 'code' in err) {
            const pgError = err as PostgresError;
            if (pgError.code === "23505") {
                return { success: false, error: "File already exists!" } as FileResult;
            }
        }


        return { success: false, error: "Failed to add metadata to database." } as FileResult;
    }

}
export const uploadFile = async ({
    file,
    userId
}: UploadFileProps) => {
    try {
        const fileName = file.name.replaceAll(" ", "_")
        const dirPath = path.join(process.cwd(), `uploads/${userId}`)
        if (!existsSync(dirPath)) await mkdir(dirPath);
        const filePath = path.join(process.cwd(), `uploads/${userId}/` + fileName)
        const buffer = Buffer.from(await file.arrayBuffer());
        const metaData: FileMeataData = {
            id: uuidv4(),
            name: fileName,
            type: getFileType(fileName).type as FileType,
            size: buffer.byteLength,
            url: await createFileUrl(userId, fileName),
            dateAdded: new Date(),
            owners: [userId]
        }

        const metaResult = await uploadFileMetaData(metaData);
        if (!metaResult?.success) return metaResult as FileResult;

        // ## save file (buffer) in given path (filePath);
        await writeFile(filePath, buffer);
        // ## save file metadata in database
        revalidatePath('/')
        const result: FileResult = { success: true, data: fileName }
        return result;
    } catch (err) {
        handleError(err);
        return { success: false, error: "Something went wrong. File didn't uploaded!" } as FileResult;
    }
};

// ################### READ
async function getFileMetadata(fileId: string): Promise<FileResult> {
    try {
        const query = await pool.query(`SELECT * FROM files_metadata WHERE id=$1;`, [fileId])
        const meta = query.rows[0];
        if (meta.length <= 0) return { success: false, error: "Couldn't find the file in server!" } as FileResult;
        const dtoMeta = {
            id: meta.id,
            name: meta.name,
            dateAdded: meta.date_added,
            owners: meta.owners,
            size: meta.size,
            type: meta.fType,
            url: meta.url
        } as FileMeataData;
        return { success: true, data: dtoMeta } as FileResult;
    } catch (err) {
        handleError(err);
        return { success: false, error: "Uncaught Exeption while getting file metadata." } as FileResult;
    }
}
export const getFiles = async ({
    userId,
    types = [],
    searchText = "",
    sort = "",
    limit,
}: GetFilesProps): Promise<FileResult> => {

    const dirPath = path.join(process.cwd(), `uploads/${userId}/`)
    const userDir = existsSync(dirPath)

    // user doesn't have any file!
    if (!userDir) return { success: true, data: [] } as FileResult;

    try {

        const filesInDir = await pool.query(`SELECT * FROM files_metadata where owners=$1;`, [[userId]])
        const dtoData = filesInDir.rows.map(data => {
            return {
                type: data.ftype,
                dateAdded: data.date_added,
                ...data
            } as FileMeataData;
        });
        return { success: true, data: dtoData as FileMeataData[] } as FileResult;

    } catch (err) {
        handleError(err);
        return { success: false, error: "can't read files from server!" } as FileResult;
    }
};

// ################### UPDATE
async function updateFileMetadata(newMeta: FileMeataData): Promise<FileResult> {
    try {

        await pool.query(`UPDATE files_metadata 
            SET name=$1, fType=$2, url=$3, size=$4, date_added=$5, owners=$6 WHERE id=$7;`,
            [newMeta.name, newMeta.type, newMeta.url, newMeta.size, newMeta.dateAdded, newMeta.owners, newMeta.id]
        );
        return { success: true, data: newMeta } as FileResult;

    } catch (err) {
        handleError(err);
        return { success: false, error: "Uncough Exeption while updating in database" } as FileResult;
    }
}
export const renameFile = async ({
    fileId,
    name,
}: RenameFileProps): Promise<FileResult> => {
    try {

        const previousFile = await getFileMetadata(fileId);
        if (!previousFile.success) return previousFile as FileResult;

        const meta = previousFile.data as FileMeataData;

        //1. rename file in database first
        const newMeta = {
            name: name,
            id: meta.id,
            url: meta.url,
            type: getFileType(name).type,
            size: meta.size,
            dateAdded: meta.dateAdded,
            owners: meta.owners
        } as FileMeataData;

        const newMetaResult = await updateFileMetadata(newMeta);
        if (!newMetaResult.success) return { success: false, error: `Uncough exeption. Couldn't update ${meta.name}!` } as FileResult;

        //1. rename file in disk then
        const oldPath = await getFilePath({ fileName: meta.name, userId: meta.owners[0] })
        const newPath = await getFilePath({ fileName: name, userId: meta.owners[0] })
        await rename(oldPath, newPath);

        revalidatePath("/")
        return { success: true, data: newMeta } as FileResult;

    } catch (err) {
        handleError(err);
        return { success: false, error: "Uncough exeption. Couldn't update file name!" } as FileResult;
    }
};

// ################### DELETE
async function deleteFileMetadata(fileId: string): Promise<FileResult> {

    try {
        const data = await pool.query(`DELETE FROM files_metadata WHERE id=$1;`, [fileId]);
        return { success: true, data: data } as FileResult;
    } catch (err) {
        console.error(err);
        return { success: false, error: "Couldn't delete the file!" } as FileResult;
    }

}
export async function deleteFile({ filePath, fileId }: { filePath: string, fileId: string }): Promise<FileResult> {
    try {
        try {
            await rm(filePath, {
                force: true,
                maxRetries: 2,
                recursive: true,
                retryDelay: 100,
            });

            // delete metadata after phisical one removed:
            const metaResult = await deleteFileMetadata(fileId);
            if (!metaResult.success) {
                return metaResult;
            }



        } catch (fsError) {
            console.error(`Failed to delete file at ${filePath}:`, fsError);
            return { success: false, error: "Physical file couldn't be removed." };
        }

        revalidatePath("/")
        return { success: true, data: null };

    } catch (err) {
        console.error('Unexpected error in deleteFile:', err);
        return { success: false, error: "Couldn't delete file!" };
    }
}