"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui";

export function OtpInput({ name = "code", autoFocus = true }: { name?: string; autoFocus?: boolean }) {
  return (
    <Input
      name={name}
      required
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      placeholder="6-digit code"
      autoFocus={autoFocus}
      className="text-center font-mono text-xl tracking-[0.5em]"
    />
  );
}

/** Counts down from `seconds` each time `startedAt` changes; used for OTP resend cooldowns. */
export function useCooldown(startedAt: number | null, seconds = 60) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  if (startedAt === null) return 0;
  return Math.max(0, seconds - Math.floor((Math.max(now, startedAt) - startedAt) / 1000));
}
