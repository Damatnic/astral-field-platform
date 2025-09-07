import "server-only";
import { StackServerApp } from "@stackframe/stack";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  urls: {
    handler: "/handler",
    signIn: "/handler/sign-in",
    signUp: "/handler/sign-up",
    afterSignIn: "/",
    afterSignUp: "/",
    signOut: "/handler/sign-out",
    afterSignOut: "/",
  }
});

export default stackServerApp;