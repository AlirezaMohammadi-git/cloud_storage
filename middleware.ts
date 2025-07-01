


import { absoluteUrl } from "./lib/utils"
import AuthConfig from "./auth.config"
import NextAuth from "next-auth"

const { auth } = NextAuth(AuthConfig)
export default auth(async function middleware(req) {
    // Your custom middleware logic goes here
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;
    const isPrivateRoute = privateRoutes.includes(nextUrl.pathname)
    const isAuthRoute = nextUrl.pathname.includes("/sign")
    const loginUrl = absoluteUrl("/sign-in")
    const dashboardUrl = absoluteUrl("/")


    // making sure don't block auth handlers:
    if (nextUrl.pathname.includes("/auth")) return;

    // redirecting user from login page to main page after they logged in :
    if (isLoggedIn && isAuthRoute) {
        return Response.redirect(dashboardUrl)
    }

    // user wants to login:
    if (isAuthRoute && !isLoggedIn) {
        return;
    }

    // redirect unathorized user to signUp page.
    if (!isLoggedIn && isPrivateRoute) {
        return Response.redirect(loginUrl)
    }

    return;
})

export const privateRoutes = [
    "/",
    "/seed",
];
export const config = {
    matchers: privateRoutes
}