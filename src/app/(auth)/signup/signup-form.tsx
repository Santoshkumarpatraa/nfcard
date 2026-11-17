"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { site } from "@/lib/site";
import { useNextParam } from "@/lib/use-next-param";
import { useOnPageRestore } from "@/lib/use-page-restore";
import { normaliseUsername, usernameProblem } from "@/lib/username";

type Availability = "idle" | "checking" | "available" | "taken";

export function SignupForm() {
  const next = useNextParam();
  const [username, setUsername] = useState("");
  const [checked, setChecked] = useState<{ username: string; available: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useOnPageRestore(() => setPending(false));

  const normalised = normaliseUsername(username);
  const problem = username ? usernameProblem(normalised) : null;

  const availability: Availability =
    !normalised || problem
      ? "idle"
      : checked?.username !== normalised
        ? "checking"
        : checked.available
          ? "available"
          : "taken";

  useEffect(() => {
    if (!normalised || problem) return;
    const timer = setTimeout(async () => {
      const result = await authClient.isUsernameAvailable({ username: normalised });
      setChecked({ username: normalised, available: Boolean(result.data?.available) });
    }, 350);
    return () => clearTimeout(timer);
  }, [normalised, problem]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (problem || availability === "taken") return;
    const form = new FormData(event.currentTarget);

    setPending(true);
    setError(null);
    const result = await authClient.signUp.email({
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password: String(form.get("password") ?? ""),
      username: normalised,
    });

    if (result.error) {
      setPending(false);
      setError(authErrorMessage(result.error, "Could not create your account."));
      return;
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full page load so every page re-renders for the new session
    window.location.assign(`/verify?next=${encodeURIComponent(next)}`);
  }

  const usernameHint =
    availability === "checking"
      ? "Checking..."
      : availability === "available"
        ? `${site.url.replace(/^https?:\/\//, "")}/${normalised} is available`
        : "Lowercase letters, numbers, dots and underscores";

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Full name" htmlFor="name">
        <Input id="name" name="name" required maxLength={80} autoComplete="name" />
      </Field>
      <Field
        label="Username"
        htmlFor="username"
        error={problem ?? (availability === "taken" ? "This username is taken" : null)}
        hint={usernameHint}
      >
        <Input
          id="username"
          name="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoCapitalize="none"
          autoComplete="username"
          spellCheck={false}
        />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters">
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Button type="submit" disabled={pending || Boolean(problem) || availability === "taken"} className="py-3">
        {pending ? "Creating account..." : "Continue"}
      </Button>
      <p className="text-center text-xs text-ink-500">
        By continuing you agree to our{" "}
        <Link href="/legal/terms" className="underline">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-ink-950 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
