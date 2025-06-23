
"use server"

import { signIn } from "@/auth";
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth";
import { Pool } from "pg";



const pool = new Pool({
    connectionString: 'postgres://joe:helloKitty@localhost:5432/mylocaldatabase'
});

// use only for credential method:
export async function getUserFromDb(email: string) {
    const client = await pool.connect()
    try {
        const result = await client.query(`SELECT * FROM users WHERE email=$1`, [email]);
        const user = result.rows[0]
        // user not existes
        if (!user) return null;
        const dtoUser: User = {
            fullname: user.full_name,
            ...user
        }

        return dtoUser;
    } catch (err) {
        console.log("Failed to load user from db.", err)
        throw new Error("Failed to load user from db.")
    } finally {
        client.release();
    }
}
export async function comparePasswords(userId: string, password: string) {

    const client = await pool.connect()
    try {
        const result = await client.query<Passwords>(`SELECT * FROM user_passwords WHERE id=$1`, [userId])
        const hash = result.rows[0]

        if (!hash) return null;

        return await bcrypt.compare(password, hash.hash);

    } catch (err) {
        console.log("Database error in comparePasswords!", err)
        throw new Error("Database error in comparePasswords!")
    } finally {
        client.release()
    }
}
// this function will use in credential method signIn
export async function authenticate(prevState: string | undefined, formData: FormData) {
    const method = formData.get("method") as string;
    if (method === "credentials") {
        try {
            await signIn("credentials", formData)
        } catch (error) {
            if (error instanceof AuthError) {
                switch (error.type) {
                    case "CredentialsSignin":
                        return "Invalid credentials";
                    default:
                        return 'Something went wrong'
                }
            }
            throw error;
        }

    } else if (method === "OAuth") {
        try {

            const providerId = formData.get("providerId") as string;
            await signIn(providerId)
        } catch (error) {
            // Signin can fail for a number of reasons, such as the user
            // not existing, or the user not having the correct role.
            // In some cases, you may want to redirect to a custom error
            if (error instanceof AuthError) {
                // return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`)
                return;
            }

            // Otherwise if a redirects happens Next.js can handle it
            // so you can just re-thrown the error and let Next.js handle it.
            // Docs:
            // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
            throw error
        }


    }
}
export async function InsertNewUser(user: User, password: string | undefined) {
    const client = await pool.connect()
    try {
        if (!password) return { success: false, error: "Password is required for inserting new user..." };

        const localUser = await getUserFromDb(user.email);
        if (localUser) return { success: false, error: "User already exists! Please sign-in instead" };


        const hash = await bcrypt.hash(password, 10)
        await client
            .query(`INSERT INTO users (id, full_name, email, avatar,log_in_method)
         VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (id) DO NOTHING;`,
                [user.id, user.fullname, user.email, user.avatar, user.logInMethod])

        await client
            .query(`INSERT INTO user_passwords (id, hash)
        VALUES ($1,$2)
        ON CONFLICT (id) DO NOTHING;`, [user.id, hash]);

        return { success: true, user: user }

    } catch (err) {
        console.log(err)
        return { success: false, error: "failed to create user" }
    } finally {
        client.release();
    }
}