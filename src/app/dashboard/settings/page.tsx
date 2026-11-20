import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Badge, Card, PageHeader, Skeleton, buttonClass } from "@/components/ui";
import { formatPhone } from "@/lib/phone";
import { requireVerifiedUser } from "@/lib/session";
import { PasswordForm, UsernameForm } from "./forms";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const session = await requireVerifiedUser("/dashboard/settings");
  const { user } = session;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-2xl gap-6">
        <Card className="p-5">
          <h2 className="font-medium">Account</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <dt className="text-ink-500">Mobile</dt>
                <dd className="font-medium">{user.phoneNumber ? formatPhone(user.phoneNumber) : "Not added"}</dd>
              </div>
              <Badge tone={user.phoneNumberVerified ? "green" : "amber"}>
                {user.phoneNumberVerified ? "Verified" : "Not verified"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <dt className="text-ink-500">Email</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              {user.emailVerified ? (
                <Badge tone="green">Verified</Badge>
              ) : (
                <Link href="/verify?next=/dashboard/settings" className={buttonClass("secondary")}>
                  Verify email
                </Link>
              )}
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="font-medium">Username</h2>
          <p className="mt-1 text-sm text-ink-500">
            Changing it changes your profile link. Cards keep working because they use their own code.
          </p>
          <UsernameForm current={user.username ?? ""} />
        </Card>

        <Card className="p-5">
          <h2 className="font-medium">Password</h2>
          <PasswordForm />
        </Card>

        <Card className="flex items-center justify-between p-5">
          <span className="text-sm text-ink-600">Sign out of this device</span>
          <SignOutButton withLabel />
        </Card>
      </div>
    </>
  );
}
