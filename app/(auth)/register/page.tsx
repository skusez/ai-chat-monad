"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoogleAuthForm } from "@/components/google-auth-form";
import { EmailRegisterForm } from "@/components/email-register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  const router = useRouter();
  const [isSuccessful, setIsSuccessful] = useState(false);

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-8 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Choose your preferred sign up method
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full px-4 sm:px-16">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="mt-4">
            <EmailRegisterForm />
          </TabsContent>
          <TabsContent value="google" className="mt-4">
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
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-gray-600 mb-4 dark:text-zinc-400 px-4 sm:px-16">
          {"Already have an account? "}
          <Link
            href="/login"
            className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
          >
            Sign in
          </Link>
          {" instead."}
        </p>
      </div>
    </div>
  );
}
