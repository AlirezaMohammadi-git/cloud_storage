


import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";


export const enviroments = {
    githubClientId: process.env.AUTH_GITHUB_ID,
    githubSecret: process.env.AUTH_GITHUB_SECRET,
    googleClientId: process.env.AUTH_GOOGLE_ID,
    googleSecret: process.env.AUTH_GOOGLE_SECRET,
}

export const providers: Provider[] = [
    GitHub({
        clientId: enviroments.githubClientId,
        clientSecret: enviroments.githubSecret,
    }),
    Google({
        clientId: enviroments.googleClientId,
        clientSecret: enviroments.googleSecret,
        async profile(profile) {
            return { hospital: "hello", ...profile }
        }
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
    },
    providers: [...providers]
} satisfies NextAuthConfig

export default authConfig;