import type { Metadata } from "next";
import { ResetFlow } from "./reset-flow";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPage() {
  return <ResetFlow />;
}
