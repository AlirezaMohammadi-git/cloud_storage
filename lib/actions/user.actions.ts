"use server";


import postgres from "postgres"
import bcrypt from "bcryptjs"





const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" })

// use only for credential method:
export async function getUserFromDb(email: string, password: string) {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    // user not existes
    if (!user || user.length === 0) return null;

    // login method is wrong!
    if (user[0].logInMethod !== "credential") return null

    const match = await comparePasswords(user[0].id, password)

    return match ? user[0] : null;
  } catch (err) {
    console.log("Failed to load user from db.", err)
    throw new Error("Failed to load user from db.")
  }
}


export async function comparePasswords(userId: string, password: string) {
  try {

    const hash = await sql<Passwords[]>`SELECT * FROM passwords WHERE userId=${userId}`

    if (hash.length <= 0) return null;

    return await bcrypt.compare(password, hash[0].hash);

  } catch (err) {
    console.log("Failed to load password from db.(user not found)", err)
    throw new Error("Failed to load password from db.(user not found)")
  }
}

