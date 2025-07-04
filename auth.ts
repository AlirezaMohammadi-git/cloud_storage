import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { object, string, ZodError } from "zod";
import { avatarPlaceholderUrl } from "./constants";
import { uuidv4 } from "./lib/utils";

export const signInSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(5, "Password must be more than 5 characters")
    .max(32, "Password must be less than 32 characters"),
  type: string(),
  fullname: string().min(2).max(50).optional(),
});
export const enviroments = {
  githubClientId: process.env.AUTH_GITHUB_ID,
  githubSecret: process.env.AUTH_GITHUB_SECRET,
  googleClientId: process.env.AUTH_GOOGLE_ID,
  googleSecret: process.env.AUTH_GOOGLE_SECRET,
};
class UserExistesError extends CredentialsSignin {
  code = "user_already_existes";
}
class CreateUserError extends CredentialsSignin {
  code = "create_user_error";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {

      if (user) {
        token.id = user.id;
        token.fullname = user.fullname;
        token.avatar = user.avatar;
        token.logInMethod = account?.provider === "credentials" ? "credential" : "OAuth";
      }

      return token;

    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.fullname = token.fullname as string;
        session.user.avatar = token.avatar as string;
        session.user.logInMethod = token.logInMethod as "OAuth" | "credential";
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        type: { label: "type", type: "hidden" },
        fullname: { label: "fullname", type: "text" },
      },
      authorize: async (c) => {
        try {
          const parsedCredentials = signInSchema.safeParse(c);
          if (parsedCredentials.success) {
            const { getUserFromDb, InsertNewUser, comparePasswords } =
              await import("./app/lib/actions/user.db.actions");
            const { email, password, type, fullname } = parsedCredentials.data;


            if (type === "sign-in") {
              const user = await getUserFromDb(email);
              if (!user) return null;
              const result = await comparePasswords(user.id, password);
              if (!result && result === false) return null;
              else return user;
            } else if (type === "sign-up") {
              const user = await getUserFromDb(email);
              if (user) {
                throw new UserExistesError(
                  "User already existes. Please log in instead.",
                );
              } else {
                const localUser: User = {
                  id: uuidv4(),
                  fullname: fullname || "",
                  email: email,
                  avatar: avatarPlaceholderUrl,
                  logInMethod: "credential",
                };

                const result = await InsertNewUser(localUser, password);
                if (result.success) {
                  return localUser;
                } else {
                  throw new CreateUserError(result.error);
                }
              }
            }
          }
          return null;
        } catch (err) {
          console.error("❌ Error during authorize:", err);

          if (err instanceof ZodError) {
            return null;
          }
          return null;
        }
      },
    }),
    // GitHub({
    //   clientId: enviroments.githubClientId,
    //   clientSecret: enviroments.githubSecret,
    // }),
    // Google({
    //   clientId: enviroments.googleClientId,
    //   clientSecret: enviroments.googleSecret,
    //   async profile(profile) {
    //     return { ...profile };
    //   },
    // }),
  ],
  pages: {
    signIn: "/sign-in",
  }
});
