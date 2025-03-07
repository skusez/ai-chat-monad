import NextAuth from "next-auth";

import { authConfig } from "@/app/(auth)/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/", "/:id", "/api/:path*", "/login", "/register"],
};
