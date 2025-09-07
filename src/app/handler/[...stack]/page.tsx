import { StackHandler } from "@stackframe/stack";
import stackServerApp from "../../../../stack.config";

export default function Handler(props: { params: any, searchParams: any }) {
  return (
    <StackHandler
      app={stackServerApp}
      routeProps={props}
      fullPage={true}
    />
  );
}