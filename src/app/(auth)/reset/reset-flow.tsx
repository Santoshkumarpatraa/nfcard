"use client";

import Link from "next/link";
import { useState } from "react";
import { OtpInput, useCooldown } from "@/components/otp-input";
import { Alert, Button, Field, Input } from "@/components/ui";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { formatPhone, isIndianMobile, toE164 } from "@/lib/phone";

type Target = { kind: "email" | "phone"; value: string };

export function ResetFlow() {
  const [target, setTarget] = useState<Target | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const cooldown = useCooldown(sentAt);

  async function request(next: Target) {
    setPending(true);
    setError(null);
    const result =
      next.kind === "email"
        ? await authClient.emailOtp.requestPasswordReset({ email: next.value })
        : await authClient.phoneNumber.requestPasswordReset({ phoneNumber: next.value });
    setPending(false);
    if (result.error) {
      setError(authErrorMessage(result.error, "Could not send the code"));
      return;
    }
    setTarget(next);
    setSentAt(Date.now());
  }

  async function onRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("identifier") ?? "").trim();
    if (raw.includes("@")) {
      await request({ kind: "email", value: raw.toLowerCase() });
      return;
    }
    const phone = toE164(raw);
    if (!phone || !isIndianMobile(phone)) {
      setError("Enter the email or mobile number on your account");
      return;
    }
    await request({ kind: "phone", value: phone });
  }

  async function onReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const form = new FormData(event.currentTarget);
    const otp = String(form.get("code") ?? "");
    const password = String(form.get("password") ?? "");

    setPending(true);
    setError(null);
    const result =
      target.kind === "email"
        ? await authClient.emailOtp.resetPassword({ email: target.value, otp, password })
        : await authClient.phoneNumber.resetPassword({ phoneNumber: target.value, otp, newPassword: password });
    setPending(false);
    if (result.error) {
      setError(authErrorMessage(result.error, "That code did not work"));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Password updated</h1>
        <p className="mt-2 text-sm text-ink-500">
          You have been signed out on every device. Log in with your new password.
        </p>
        <Link href="/login" className="mt-8 flex justify-center rounded-xl bg-ink-950 px-4 py-3 text-sm font-medium text-white">
          Go to log in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Reset your password</h1>
      <p className="mt-2 text-sm text-ink-500">
        {target
          ? `Enter the code sent to ${target.kind === "phone" ? formatPhone(target.value) : target.value}.`
          : "We will send a code to your verified email or phone."}
      </p>
      <div className="mt-8 flex flex-col gap-5">
        {error ? <Alert>{error}</Alert> : null}
        {!target ? (
          <form onSubmit={onRequest} className="flex flex-col gap-5">
            <Field label="Email or mobile number" htmlFor="identifier">
              <Input id="identifier" name="identifier" required autoComplete="username" autoCapitalize="none" />
            </Field>
            <Button type="submit" disabled={pending} className="py-3">
              {pending ? "Sending..." : "Send code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onReset} className="flex flex-col gap-5">
            <OtpInput />
            <Field label="New password" htmlFor="password" hint="At least 8 characters">
              <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            </Field>
            <Button type="submit" disabled={pending} className="py-3">
              {pending ? "Saving..." : "Set new password"}
            </Button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-ink-500 hover:text-ink-900" onClick={() => setTarget(null)}>
                Use a different account
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || pending}
                className="font-medium text-ink-900 disabled:text-ink-400"
                onClick={() => request(target)}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
        <Link href="/login" className="text-center text-sm text-ink-500 hover:text-ink-900">
          Back to log in
        </Link>
      </div>
    </>
  );
}
