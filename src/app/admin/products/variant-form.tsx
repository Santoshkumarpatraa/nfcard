"use client";

import { useState, useTransition } from "react";
import { updateVariant } from "@/app/admin/actions";
import { Button, Input } from "@/components/ui";

export function VariantForm({
  variantId,
  name,
  priceRupees,
  compareAtRupees,
  isActive,
}: {
  variantId: string;
  name: string;
  priceRupees: number;
  compareAtRupees: number;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-center gap-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await updateVariant({
            variantId,
            priceRupees: Number(form.get("price")),
            compareAtRupees: Number(form.get("compareAt") || 0),
            isActive: form.get("active") === "on",
          });
          setMessage(result.ok ? (result.message ?? "Saved") : result.error);
        });
      }}
    >
      <span className="w-40 text-sm font-medium">{name}</span>
      <label className="flex items-center gap-1.5 text-sm text-ink-500">
        Rs
        <Input name="price" type="number" min={1} defaultValue={priceRupees} className="w-28" aria-label="Price" />
      </label>
      <label className="flex items-center gap-1.5 text-sm text-ink-500">
        MRP
        <Input name="compareAt" type="number" min={0} defaultValue={compareAtRupees || ""} className="w-28" aria-label="Compare at price" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={isActive} className="size-4 accent-ink-950" /> Active
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      {message ? <span className="text-xs text-ink-500">{message}</span> : null}
    </form>
  );
}
