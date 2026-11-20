"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { grantPremium, updatePremiumPrice } from "@/app/admin/actions";
import { Button, Input } from "@/components/ui";
import { runAction } from "@/lib/run-action";

type Message = { ok: boolean; text: string } | null;

function Result({ message }: { message: Message }) {
  if (!message) return null;
  return <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>;
}

export function PremiumPriceForm({ rupees }: { rupees: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  return (
    <form
      className="mt-4 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const value = Number(new FormData(event.currentTarget).get("rupees") || 0);
        startTransition(async () => {
          const result = await runAction(() => updatePremiumPrice({ rupees: value }));
          setMessage(result.ok ? { ok: true, text: result.message ?? "Saved" } : { ok: false, text: result.error });
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-500">Rs</span>
        <Input name="rupees" type="number" min={0} step={1} defaultValue={rupees || ""} placeholder="e.g. 999" className="w-36" aria-label="Price per year in rupees" />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
      <Result message={message} />
    </form>
  );
}

export function GrantPremiumForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  return (
    <form
      className="mt-4 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await runAction(() => grantPremium({ username: String(form.get("username") ?? ""), months: Number(form.get("months") || 0) }));
          setMessage(result.ok ? { ok: true, text: result.message ?? "Done" } : { ok: false, text: result.error });
        });
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input name="username" placeholder="username" required className="w-48" aria-label="Username" autoCapitalize="none" />
        <Input name="months" type="number" min={1} max={36} defaultValue={12} className="w-24" aria-label="Months" />
        <span className="text-sm text-ink-500">months</span>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving..." : "Give Premium"}
        </Button>
      </div>
      <Result message={message} />
    </form>
  );
}
