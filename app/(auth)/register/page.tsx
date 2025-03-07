"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleAuthForm } from "@/components/google-auth-form";

export default function Page() {
  const router = useRouter();
  const [isSuccessful, setIsSuccessful] = useState(false);

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your Google account
          </p>
        </div>
        <GoogleAuthForm>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </GoogleAuthForm>
      </div>
    </div>
  );
}
