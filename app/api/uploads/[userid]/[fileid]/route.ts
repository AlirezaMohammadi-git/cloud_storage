// pages/api/uploads/[userId]/[fileName].ts
import path from "path";
import { auth } from "@/auth";
import { readFile } from "fs/promises";
import { getFileMetadata } from "@/app/lib/actions/file.actions";
import { handleError } from "@/lib/utils";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userid: string, fileid: string }> }
) {

    // now each meta URL contains fileID.
    const { userid, fileid } = await params;
    const session = await auth();
    if (!session?.user) return new Response("UnAuthorized user!", {
        status: 401,
    })

    const metaResult = await getFileMetadata(fileid);
    if (!metaResult.success) {
        handleError(metaResult.error, "route.ts")
        return new Response("File Not Found!", { status: 404 });
    }
    const meta = metaResult.data as FileMetadata;
    let isSharedFile = meta.shareWith.includes(session.user.email);

    if (session.user.id !== userid && !isSharedFile) return new Response("UnAuthorized user!", {
        status: 401,
    })

    const filePath = path.join(process.cwd(), "uploads", userid, meta.name)
    const file = await readFile(filePath);
    return new Response(file, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}
