"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { toE164 } from "@/lib/phone";
import { useNextParam } from "@/lib/use-next-param";
import { useOnPageRestore } from "@/lib/use-page-restore";

type Identifier = { kind: "email" | "phone" | "username"; value: string };

function classify(raw: string): Identifier | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.includes("@")) return { kind: "email", value: value.toLowerCase() };
  if (/^\+?[\d\s()-]{8,}$/.test(value)) {
    const phone = toE164(value);
    return phone ? { kind: "phone", value: phone } : null;
  }
  return { kind: "username", value: value.toLowerCase() };
}

export function LoginForm() {
  const next = useNextParam();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useOnPageRestore(() => setPending(false));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = classify(String(form.get("identifier") ?? ""));
    const password = String(form.get("password") ?? "");

    if (!identifier) {
      setError("Enter a valid username, email or phone number");
      return;
    }

    setPending(true);
    setError(null);

    const result =
      identifier.kind === "email"
        ? await authClient.signIn.email({ email: identifier.value, password })
        : identifier.kind === "phone"
          ? await authClient.signIn.phoneNumber({ phoneNumber: identifier.value, password })
          : await authClient.signIn.username({ username: identifier.value, password });

    if (result.error) {
      setPending(false);
      setError(authErrorMessage(result.error, "Incorrect details. Please try again."));
      return;
    }

    // Full page load: the router keeps visited pages (and this pending form) alive, and auth changes need fresh pages.
    window.location.assign(next);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Username, email or phone" htmlFor="identifier">
        <Input id="identifier" name="identifier" required autoComplete="username" autoCapitalize="none" />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        hint={
          <Link href="/reset" className="font-medium text-ink-900 underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        }
      >
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" disabled={pending} className="py-3">
        {pending ? "Logging in..." : "Log in"}
      </Button>
      <p className="text-center text-sm text-ink-500">
        New here?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-ink-950 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
