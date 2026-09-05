import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/permissions";

function getAuthBaseURL() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [
    adminClient({
      ac,
      roles,
    }),
  ],
});

export type AuthSession = typeof authClient.$Infer.Session;
