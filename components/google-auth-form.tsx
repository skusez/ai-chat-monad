"use client";

import { GoogleAuthButton } from "./google-auth-button";

export function GoogleAuthForm({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-4 sm:px-16">
      <GoogleAuthButton />
      {children}
    </div>
  );
}
