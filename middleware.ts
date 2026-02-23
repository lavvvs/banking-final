// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/profile(.*)",
  "/loans(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // In Clerk v6, auth is NOT a function.
  // It exposes methods directly.
  if (isProtectedRoute(req)) {
    auth.protect(); // ✔ CORRECT FOR CLERK v6+
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/(api|trpc)(.*)"],
};
