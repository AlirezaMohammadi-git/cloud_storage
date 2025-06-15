


import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { object, string, ZodError } from "zod";


export const signInSchema = object({
    email: string({ required_error: "Email is required" })
        .min(1, "Email is required")
        .email("Invalid email"),
    password: string({ required_error: "Password is required" })
        .min(1, "Password is required")
        .min(5, "Password must be more than 5 characters")
        .max(32, "Password must be less than 32 characters"),
})


export const enviroments = {
    githubClientId: process.env.AUTH_GITHUB_ID,
    githubSecret: process.env.AUTH_GITHUB_SECRET,
    googleClientId: process.env.AUTH_GOOGLE_ID,
    googleSecret: process.env.AUTH_GOOGLE_SECRET,
}

const providers: Provider[] = [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    authorize: async (c) => {

        try {
            const parsedCredentials = signInSchema.safeParse(c)
            if (parsedCredentials.success) {
                const { email, password } = parsedCredentials.data;
                // using lazy import to prevent runtime errors:
                const { getUserFromDb } = await import("./lib/actions/user.actions");
                const user = await getUserFromDb(email, password);
                if (!user) {
                    throw new Error("Invalid credentials or user not exists.")
                }
                return user;
            }
            return null;

        } catch (err) {

            console.error("❌ Error during authorize:", err);

            if (err instanceof ZodError) {
                return null
            }
            return null;

        }


    }
}),
GitHub({
    clientId: enviroments.githubClientId,
    clientSecret: enviroments.githubSecret
}),
Google({
    clientId: enviroments.googleClientId,
    clientSecret: enviroments.googleSecret
})]


export const providerMap = providers
    .map((provider) => {
        if (typeof provider === "function") {
            const providerData = provider()
            return { id: providerData.id, name: providerData.name }
        } else {
            return { id: provider.id, name: provider.name }
        }
    })
    .filter((provider) => provider.id !== "credentials")


const authConfig = {
    pages: {
        signIn: "/sign-in",
        signOut: "/"
    },
    providers: [...providers]
} satisfies NextAuthConfig

export default authConfig;