import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { authConfig } from "./auth.config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  user,
  account,
  authenticator,
  session,
  verificationToken,
  type User as DbUser,
} from "@/lib/db/schema";
declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {}

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends Omit<DbUser, "tier" | "isAdmin"> {
    tier?: "free" | "premium";
    isAdmin?: boolean;
  }

  interface JWT {
    id: string;
    isAdmin: boolean;
    tier: "free" | "premium";
  }
  /**
   * The shape of the account object returned in the OAuth providers' `account` callback,
   * Usually contains information about the provider being used, like OAuth tokens (`access_token`, etc).
   */

  /**
   * Returned by `useSession`, `auth`, contains information about the active session.
   */
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    accountsTable: account,
    usersTable: user,
    authenticatorsTable: authenticator,
    sessionsTable: session,
    verificationTokensTable: verificationToken,
  }),
  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.tier = user.tier;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.tier = token.tier as "free" | "premium";

      return session;
    },
  },
  ...authConfig,
});
