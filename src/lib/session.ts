import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser(nextPath = "/dashboard") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return session;
}

/** Signed in and phone verified. Phone verification is mandatory before using the dashboard. */
export async function requireVerifiedUser(nextPath = "/dashboard") {
  const session = await requireUser(nextPath);
  if (!session.user.phoneNumberVerified) redirect(`/verify?next=${encodeURIComponent(nextPath)}`);
  return session;
}

export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (session.user.role !== "admin") notFound();
  return session;
}
