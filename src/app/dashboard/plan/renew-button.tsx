"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { loadRazorpay } from "@/lib/razorpay-client";
import { site } from "@/lib/site";

type RenewResponse =
  | { renewalId: string; testMode: true }
  | {
      renewalId: string;
      razorpayOrderId: string;
      amountPaise: number;
      keyId: string;
      prefill: { name: string; email: string; contact: string };
    };

export function RenewButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function renew() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/renew", { method: "POST" }).catch(() => null);
    const body: (RenewResponse & { error?: string }) | null = response ? await response.json().catch(() => null) : null;
    if (!response?.ok || !body) {
      setPending(false);
      setMessage({ ok: false, text: body?.error ?? "Could not start renewal. Please try again." });
      return;
    }
    if ("testMode" in body) {
      setPending(false);
      setMessage({ ok: true, text: "Renewed (test mode, no payment taken)." });
      router.refresh();
      return;
    }
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setPending(false);
      setMessage({ ok: false, text: "Could not load the payment window. Check your connection." });
      return;
    }
    new window.Razorpay({
      key: body.keyId,
      amount: body.amountPaise,
      currency: "INR",
      name: site.name,
      description: "Premium, 1 year",
      order_id: body.razorpayOrderId,
      prefill: body.prefill,
      theme: { color: "#111113" },
      modal: { ondismiss: () => setPending(false) },
      handler: async (payment) => {
        const verify = await fetch("/api/renew/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ renewalId: body.renewalId, ...payment }),
        }).catch(() => null);
        setPending(false);
        setMessage(
          verify?.ok
            ? { ok: true, text: "Thank you. Premium is renewed." }
            : { ok: false, text: "Payment received but not yet confirmed. It will update shortly, no need to pay again." },
        );
        router.refresh();
      },
    }).open();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={renew} disabled={pending} className="py-3">
        {pending ? "Processing..." : label}
      </Button>
      {message ? <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p> : null}
    </div>
  );
}
