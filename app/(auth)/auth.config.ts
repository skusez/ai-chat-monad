import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
  throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set");
}

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
} satisfies NextAuthConfig;
