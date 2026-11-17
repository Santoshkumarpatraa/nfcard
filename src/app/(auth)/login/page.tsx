import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-500">Log in with your username, email or phone number.</p>
      <LoginForm />
    </>
  );
}
