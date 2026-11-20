"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateCards } from "@/app/admin/actions";
import { Button, Input } from "@/components/ui";
import { runAction } from "@/lib/run-action";

export function GenerateCardsForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await runAction(() => generateCards(Number(form.get("count")), String(form.get("label") ?? "")));
          setMessage(result.ok ? (result.message ?? "Done") : result.error);
          if (result.ok) router.refresh();
        });
      }}
    >
      <Input name="count" type="number" min={1} max={500} defaultValue={10} className="w-28" aria-label="Number of cards" />
      <Input name="label" placeholder="Label, e.g. Event stock Nov" className="w-64" aria-label="Label" />
      <Button type="submit" disabled={pending}>
        {pending ? "Generating..." : "Generate"}
      </Button>
      {message ? <p className="w-full text-sm text-ink-600">{message}</p> : null}
    </form>
  );
}
