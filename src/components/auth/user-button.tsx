"use client";

import { useUser, UserButton } from "@stackframe/stack";

export default function AuthUserButton() {
  const user = useUser();

  if (!user) {
    return (
      <div className="flex gap-2">
        <a
          href="/handler/sign-in"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign In
        </a>
        <a
          href="/handler/sign-up"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Sign Up
        </a>
      </div>
    );
  }

  return <UserButton />;
}
