"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { activateCard } from "@/app/dashboard/actions";
import { Button, Input } from "@/components/ui";

export function ActivateCardForm({ defaultCode = "" }: { defaultCode?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="mt-4 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const code = String(new FormData(event.currentTarget).get("code") ?? "");
        startTransition(async () => {
          const result = await activateCard(code);
          setMessage(result.ok ? { ok: true, text: result.message ?? "Activated" } : { ok: false, text: result.error });
          if (result.ok) router.refresh();
        });
      }}
    >
      <div className="flex max-w-md gap-2">
        <Input
          name="code"
          required
          defaultValue={defaultCode}
          placeholder="e.g. K7MX2QRP"
          autoCapitalize="characters"
          className="font-mono tracking-wider uppercase"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Activating..." : "Activate"}
        </Button>
      </div>
      {message ? <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p> : null}
    </form>
  );
}
