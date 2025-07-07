"use server";

import { getFileType, uuidv4 } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import path from "path"
import { mkdir, writeFile, readdir, readFile, rm, rename } from "fs/promises";
import { existsSync } from "fs";
import { pool } from "@/db";
import { UPLOAD_SIZE_LIMIT_BYTES } from "@/constants";
import { auth } from "@/auth";
import { testLog } from "@/lib/utils";


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

// #################################################################
// ################### DASHBOARD UTILS #############################
// #################################################################
export const getUsageSummary = async (user: User) => {
    const files = await getFiles({
        user: user,
    })
    if (!files.success) return [];
    const fileMeta = (files.data as FileMetadata[])
    try {
        let totalDocumentSize = 0;
        let totalImageSize = 0;
        let totalVideoSize = 0;
        let totalAudioSize = 0;
        let totalOtherSize = 0;

        fileMeta.forEach(file => {
            const size = Number(file.size) || 0;

            switch (file.type) {
                case "document":
                    totalDocumentSize += size;
                    break;
                case "image":
                    totalImageSize += size;
                    break;
                case "video":
                    totalVideoSize += size;
                    break;
                case "audio":
                    totalAudioSize += size;
                    break;
                case "other":
                    totalOtherSize += size;
                    break;
                default:
                    totalOtherSize += size;
                    break;
            }
        });

        const mediaSize = totalVideoSize + totalAudioSize;

        return [
            {
                title: "Documents",
                size: totalDocumentSize,
                icon: "/assets/icons/file-document-light.svg",
                url: "/documents",
            },
            {
                title: "Images",
                size: totalImageSize,
                icon: "/assets/icons/file-image-light.svg",
                url: "/images",
            },
            {
                title: "Media",
                size: mediaSize,
                icon: "/assets/icons/file-video-light.svg",
                url: "/media",
            },
            {
                title: "Others",
                size: totalOtherSize,
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
export async function createFileUrl(userId: string, fileID: string) {
    return path.join("/api", "uploads", userId, fileID);
}
const handleError = (error: unknown) => {
    console.error("❌ File.Actions:", error);
};


// #################################################################
// ######################## CRUD proccessess #######################
// #################################################################

// ################### CREATE
async function uploadFileMetaData(metadata: FileMetadata): Promise<FileResult> {
    try {

        // 1. get all files metadata of this owner
        // 2. check if this one'name already exists or not
        const allMeta = await getAllFilesMetadata(metadata.owner);
        if (!allMeta.success) return { success: false, error: `failed to upload ${metadata.name}` } as FileResult;

        const isAlreadyExists = (allMeta.data as FileMetadata[]).map(meta => meta.name).includes(metadata.name);

        if (isAlreadyExists) return { success: false, error: `file already exists!` } as FileResult;

        await pool.query(`INSERT INTO files_metadata ( 
            id,
            name,
            fType,
            url,
            size,
            lastEdit,
            owner,
            shareWith
            )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (id) DO NOTHING;`, [
            metadata.id,
            metadata.name,
            metadata.type,
            metadata.url,
            metadata.size,
            metadata.lastEdited,
            metadata.owner,
            metadata.shareWith
        ])

        return { success: true, data: metadata } as FileResult;

    } catch (err) {

        handleError(err);

        // Type guard for PostgreSQL errors
        if (err instanceof Error && 'code' in err) {
            const pgError = err as PostgresError;
            if (pgError.code === "23505") {
                return { success: false, error: `"${metadata.name}" already exists!` } as FileResult;
            }
        }


        return { success: false, error: "Failed to add metadata to database." } as FileResult;
    }

}
export const uploadFile = async ({
    file,
    userId
}: UploadFileProps): Promise<FileResult> => {
    try {
        const fileName = file.name.replaceAll(" ", "_")
        const dirPath = path.join(process.cwd(), `uploads/${userId}`)
        if (!existsSync(dirPath)) await mkdir(dirPath);
        const filePath = path.join(process.cwd(), `uploads/${userId}/${fileName}`)
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileSize = buffer.byteLength;

        // checking for size limit
        const remainingUploadSize = await getRemainingUploadSize(userId);
        if (!remainingUploadSize.success) return remainingUploadSize;
        if (fileSize > (remainingUploadSize.data as number)) return { success: false, error: `2GB size limit reached. Couldn't upload "${fileName}"` } as FileResult;

        // uploading file metadata first:
        const metaID = uuidv4();
        const metaData: FileMetadata = {
            id: metaID,
            name: fileName,
            type: getFileType(fileName).type as FileType,
            size: fileSize,
            url: await createFileUrl(userId, metaID),
            lastEdited: new Date(),
            owner: userId,
            shareWith: [""]
        }
        const metadata = await uploadFileMetaData(metaData);
        if (!metadata?.success) return metadata as FileResult;

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
export async function getFileMetadata(fileId: string): Promise<FileResult> {
    try {
        const query = await pool.query(`SELECT * FROM files_metadata WHERE id=$1;`, [fileId])
        const meta = query.rows[0];
        if (meta.length <= 0) return { success: false, error: "Couldn't find the file in server!" } as FileResult;
        const dtoMeta = {
            id: meta.id,
            name: meta.name,
            lastEdited: meta.lastedit,
            owner: meta.owner,
            size: meta.size,
            type: meta.ftype,
            url: meta.url,
            shareWith: meta.sharewith
        } as FileMetadata;
        return { success: true, data: dtoMeta } as FileResult;
    } catch (err) {
        handleError(err);
        return { success: false, error: "Uncaught Exeption while getting file metadata." } as FileResult;
    }
}
export async function getSharedMetadata(limit: number): Promise<FileResult> {
    try {
        const session = await auth();
        const userEmail = session?.user?.email;
        if (!userEmail) {
            return { success: false, error: "User not found." };
        }

        // Use parameterized query with LIKE
        // Note: The `%` must be added to the parameter, NOT to the placeholder
        const emailPattern = `%${userEmail}%`;

        const query = `
  SELECT id, name, size, url, fType, owner, lastEdit, shareWith
  FROM files_metadata
  WHERE EXISTS (
    SELECT 1
    FROM unnest(shareWith) AS email
    WHERE email ILIKE $1
  )
  LIMIT $2
`;

        const metaResult = await pool.query(query, [emailPattern, limit]);
        const dtoMeta: FileMetadata[] = metaResult.rows.map((meta) => ({
            id: meta.id,
            name: meta.name,
            size: meta.size,
            url: meta.url,
            type: meta.ftype, // be careful: Postgres field is likely `ftype` not `fType`
            owner: meta.owner,
            lastEdited: meta.lastedit, // be consistent with your DB column names
            shareWith: meta.sharewith,
        }));

        return { success: true, data: dtoMeta };
    } catch (err) {
        handleError(err);
        return { success: false, error: "Couldn't get shared files." };
    }
}
async function getAllFilesMetadata(userId: string): Promise<FileResult> {
    try {
        const query = await pool.query(`SELECT * FROM files_metadata WHERE owner=$1;`, [userId])
        const data = query.rows;
        if (data.length <= 0) return { success: true, data: [] } as FileResult;
        const dtoMeta = (data as DtofileMeataData[]).map((meta: DtofileMeataData) => {
            const dtoMeta = {
                id: meta.id,
                name: meta.name,
                lastEdited: meta.lastEdit,
                owner: meta.owner,
                size: meta.size,
                type: meta.fType,
                url: meta.url,
                shareWith: meta.shareWith
            } as FileMetadata;
            return dtoMeta;
        });

        return { success: true, data: dtoMeta } as FileResult;
    } catch (err) {
        handleError(err);
        return { success: false, error: "Uncaught Exeption while getting file metadata." } as FileResult;
    }
}
export async function getRemainingUploadSize(userId: string): Promise<FileResult> {

    try {
        const filesMeta = await getAllFilesMetadata(userId);
        if (!filesMeta.success) {
            return filesMeta;
        }

        const metaArray = filesMeta.data as FileMetadata[];
        if (metaArray.length === 0) return { success: true, data: UPLOAD_SIZE_LIMIT_BYTES } as FileResult;

        const totalFileSizes = metaArray
            .map(meta => Number(meta.size))
            .reduce((acc, size) => acc + size, 0);

        const remainingUploadSize = Math.max(0, UPLOAD_SIZE_LIMIT_BYTES - totalFileSizes);

        return { success: true, data: remainingUploadSize };
    } catch (err) {
        handleError(err);
        return { success: false, error: "Uncough exception. Please try again later." } as FileResult;
    }

}
const VALID_SORT_COLUMNS = ["lastedit", "name", "size"]; // adjust to your DB columns

export const getFiles = async ({
    user,
    types = [],
    searchText = "",
    sort = "lastedit DESC",
    limit,
}: GetFilesProps): Promise<FileResult> => {
    try {
        const dirPath = path.join(process.cwd(), `uploads/${user.id}/`);
        if (!existsSync(dirPath)) {
            return { success: true, data: [] };
        }

        // Validate and sanitize sort input
        let orderByClause = "ORDER BY lastedit DESC";
        if (sort) {
            const [column, direction = "ASC"] = sort.split(" ");
            if (
                VALID_SORT_COLUMNS.includes(column.toLowerCase()) &&
                ["ASC", "DESC"].includes(direction.toUpperCase())
            ) {
                orderByClause = `ORDER BY ${column} ${direction.toUpperCase()}`;
            }
        }

        // Build WHERE conditions
        const conditions: string[] = ["owner = $1"];
        const values: any[] = [user.id];
        let paramIndex = values.length + 1;

        if (types.length > 0) {
            conditions.push(`ftype = ANY($${paramIndex})`);
            values.push(types);
            paramIndex++;
        }

        if (searchText) {
            conditions.push(`name ILIKE $${paramIndex}`);
            values.push(`%${searchText}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        let limitClause = "";
        if (limit) {
            limitClause = `LIMIT $${paramIndex}`;
            values.push(limit);
        }

        const query = `
      SELECT id, name, ftype, url, size, owner, lastedit, sharewith
      FROM files_metadata
      ${whereClause}
      ${orderByClause}
      ${limitClause};
    `;

        const filesInDir = await pool.query(query, values);

        let dtoData: FileMetadata[] = filesInDir.rows.map(data => ({
            id: data.id,
            name: data.name,
            type: data.ftype,
            url: data.url,
            size: data.size,
            owner: data.owner,
            lastEdited: data.lastedit,
            shareWith: data.sharewith || [],
        }));

        return { success: true, data: dtoData };
    } catch (err) {
        handleError(err);
        return { success: false, error: "Can't read files from server!" };
    }
};

export async function getSharedFiles(userEmail: string, sort: string = "lastedit DESC", limit?: number): Promise<FileResult> {

    try {

        // Validate and sanitize sort input
        let orderByClause = "ORDER BY lastedit DESC";
        if (sort) {
            const [column, direction = "ASC"] = sort.split(" ");
            if (
                VALID_SORT_COLUMNS.includes(column.toLowerCase()) &&
                ["ASC", "DESC"].includes(direction.toUpperCase())
            ) {
                orderByClause = `ORDER BY ${column} ${direction.toUpperCase()}`;
            }
        }

        // Use parameterized query with LIKE
        // Note: The `%` must be added to the parameter, NOT to the placeholder
        const emailPattern = `%${userEmail}%`;
        const condition = limit ? [`
        EXISTS (
            SELECT 1
            FROM unnest(shareWith) AS email
            WHERE email ILIKE $1
        ) ${orderByClause}
             LIMIT $2`] : [`
        EXISTS (
            SELECT 1
            FROM unnest(shareWith) AS email
            WHERE email ILIKE $1
        ) ${orderByClause}`
        ];
        const values = limit ? [emailPattern, limit] : [emailPattern]



        const query = `
          SELECT * FROM files_metadata
            WHERE ${condition}`;

        const metaResult = await pool.query(query, values);
        const dtoMeta: FileMetadata[] = metaResult.rows.map((meta) => ({
            id: meta.id,
            name: meta.name,
            size: meta.size,
            url: meta.url,
            type: meta.ftype, // be careful: Postgres field is likely `ftype` not `fType`
            owner: meta.owner,
            lastEdited: meta.lastedit, // be consistent with your DB column names
            shareWith: meta.sharewith,
        }));

        return { success: true, data: dtoMeta };


    } catch (err) {
        handleError(err);
        return { success: false, error: "Failed to get files!" } as FileResult;
    }

}





// ################### UPDATE
async function updateFileMetadata(newMeta: FileMetadata): Promise<FileResult> {
    try {
        await pool.query(`UPDATE files_metadata 
            SET name=$1, fType=$2, url=$3, size=$4, lastEdit=$5, owner=$6, shareWith=$8 WHERE id=$7;`,
            [newMeta.name, newMeta.type, newMeta.url, newMeta.size, new Date(), newMeta.owner, newMeta.id, newMeta.shareWith]
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

        let meta = previousFile.data as FileMetadata;
        if (!meta.shareWith) {
            meta.shareWith = [];
        }

        //1. rename file in database first
        const newMeta = {
            name: name,
            id: meta.id,
            url: meta.url,
            type: getFileType(name).type,
            size: meta.size,
            lastEdited: new Date(),
            owner: meta.owner,
            shareWith: meta.shareWith
        } as FileMetadata;

        const newMetaResult = await updateFileMetadata(newMeta);
        if (!newMetaResult.success) return { success: false, error: `Uncough exeption. Couldn't update ${meta.name}!` } as FileResult;

        //1. rename file in disk then
        const oldPath = await getFilePath({ fileName: meta.name, userId: meta.owner })
        const newPath = await getFilePath({ fileName: name, userId: meta.owner })
        await rename(oldPath, newPath);

        revalidatePath("/")
        return { success: true, data: newMeta } as FileResult;

    } catch (err) {
        handleError(err);
        return { success: false, error: "Uncough exeption. Couldn't update file name!" } as FileResult;
    }
};
export const updateFileUsers = async ({
    fileMetadata,
    emails,
    path,
}: UpdateFileUsersProps) => {

    try {
        const newMeta = {
            ...fileMetadata,
            shareWith: [...emails],
        } as FileMetadata;
        const updateResult = await updateFileMetadata(newMeta);
        if (!updateResult.success) return updateResult;
        revalidatePath(path);
        return { success: true, data: newMeta } as FileResult;
    } catch (error) {
        handleError(error);
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
export async function deleteFile({ fileMeta, user }: { fileMeta: FileMetadata, user: User }): Promise<FileResult> {
    try {
        try {

            if (fileMeta.owner === user.id) {

                const filePath = await getFilePath({ fileName: fileMeta.name, userId: fileMeta.owner })
                await rm(filePath, {
                    force: true,
                    maxRetries: 2,
                    recursive: true,
                    retryDelay: 100,
                });

                // delete metadata after phisical one removed:
                const metaResult = await deleteFileMetadata(fileMeta.id);

                if (!metaResult.success) {
                    return metaResult;
                }


            } else {
                const newMeta = {
                    name: fileMeta.name,
                    id: fileMeta.id,
                    url: fileMeta.url,
                    type: getFileType(fileMeta.name).type,
                    size: fileMeta.size,
                    lastEdited: new Date(),
                    owner: fileMeta.owner,
                    shareWith: fileMeta.shareWith.filter(id => id !== user.email)
                } as FileMetadata;
                testLog("previousMeta : ", fileMeta);
                testLog("new Meta : ", newMeta);
                const updateResult = await updateFileMetadata(newMeta);
                if (!updateResult.success) return { success: false, error: `Couldn't delete ${fileMeta.name}` } as FileResult;
            }

        } catch (fsError) {
            console.error(`Failed to delete ${fileMeta.name}:`, fsError);
            return { success: false, error: "Physical file couldn't be removed." };
        }

        revalidatePath("/")
        return { success: true, data: null };

    } catch (err) {
        console.error('Unexpected error in deleteFile:', err);
        return { success: false, error: "Couldn't delete file!" };
    }
}