import { NextResponse } from 'next/server';
import { hash } from 'bcrypt-ts';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      );
    }

    // Validate password strength (at least 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );
    }

    // Connect to the database
    const client = postgres(`${process.env.DATABASE_URL}`);
    const db = drizzle(client);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .execute();

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 },
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user
    const newUser = await db
      .insert(user)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning();

    // Close the database connection
    await client.end();

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 },
    );
  }
}
