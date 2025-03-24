import type { NextAuthConfig, User } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt-ts';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
  throw new Error('AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set');
}

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        if (!email || !password) {
          return null;
        }

        try {
          // Connect to the database
          const client = postgres(`${process.env.DATABASE_URL}`);
          const db = drizzle(client);

          // Find the user by email
          const users = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .execute();

          // Close the database connection
          await client.end();

          if (users.length === 0) {
            return null;
          }

          const foundUser = users[0];

          // Check if the user has a password (might be a Google-only user)
          if (!foundUser.password) {
            return null;
          }

          // Verify the password
          const passwordMatch = await compare(password, foundUser.password);

          if (!passwordMatch) {
            return null;
          }

          // Return the user without the password
          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            image: foundUser.image,
            emailVerified: foundUser.emailVerified,
            tier: foundUser.tier,
            isAdmin: foundUser.isAdmin,
          } as User;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
