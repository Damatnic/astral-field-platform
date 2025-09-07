"use client";

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";

const stackClientApp = new StackClientApp({
  tokenStore: "cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  urls: {
    handler: "/handler",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/",
    afterSignUp: "/",
    signOut: "/handler/sign-out",
    afterSignOut: "/",
  },
});

export default function StackAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
}
