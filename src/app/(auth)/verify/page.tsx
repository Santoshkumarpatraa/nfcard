import type { Metadata } from "next";
import { VerifyFlow } from "./verify-flow";

export const metadata: Metadata = { title: "Verify your account", robots: { index: false } };

export default function VerifyPage() {
  return <VerifyFlow />;
}
