import { emailOTPClient, phoneNumberClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [usernameClient(), phoneNumberClient(), emailOTPClient()],
});

/** Better Auth errors carry a message; fall back to something readable when they do not. */
export function authErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  return error?.message || fallback;
}
