import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Create your account</h1>
      <p className="mt-2 text-sm text-ink-500">Your username becomes your profile link.</p>
      <SignupForm />
    </>
  );
}
