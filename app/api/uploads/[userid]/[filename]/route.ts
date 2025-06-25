// pages/api/uploads/[userId]/[fileName].ts
import path from "path";
import { auth } from "@/auth";
import { readFile } from "fs/promises";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userid: string, filename: string }> }
) {

    const { userid, filename } = await params;
    const session = await auth();
    if (!session?.user) return new Response("UnAuthorized user!", {
        status: 401,
    })

    if (session.user.id !== userid) return new Response("UnAuthorized user!", {
        status: 401,
    })

    const filePath = path.join(process.cwd(), "uploads", userid, filename)
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
