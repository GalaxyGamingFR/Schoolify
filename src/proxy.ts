import { clerkMiddleware } from "@clerk/nextjs/server";

// Path-based route protection here is deprecated by Clerk in favor of
// resource-based checks in each page/route that needs auth — path matching
// can drift from how Next.js actually routes requests. /dashboard guards
// itself via currentUser() + redirect; new protected routes should do the
// same rather than adding matchers here.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
