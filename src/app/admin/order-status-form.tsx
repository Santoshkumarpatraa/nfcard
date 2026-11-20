"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { Button, Input, Select } from "@/components/ui";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS, type OrderStatus } from "@/lib/money";
import { runAction } from "@/lib/run-action";

export function OrderStatusForm({
  orderId,
  status,
  courier,
  trackingNumber,
}: {
  orderId: string;
  status: OrderStatus;
  courier: string;
  trackingNumber: string;
}) {
  const router = useRouter();
  const options = [status, ...ORDER_TRANSITIONS[status]];
  const [next, setNext] = useState<OrderStatus>(status);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const withTracking = next === "shipped" || next === "delivered";

  if (options.length === 1 && !withTracking) {
    return <p className="text-sm text-ink-500">{ORDER_STATUS_LABEL[status]}. No further changes.</p>;
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (next === "cancelled" && !window.confirm("Cancel this order? Paid orders need a refund in Razorpay.")) return;
        startTransition(async () => {
          const result = await runAction(() =>
            updateOrderStatus({
              orderId,
              status: next,
              courier: withTracking ? String(form.get("courier") ?? "") : undefined,
              trackingNumber: withTracking ? String(form.get("trackingNumber") ?? "") : undefined,
            }),
          );
          setMessage(result.ok ? (result.message ?? "Saved") : result.error);
          if (result.ok) router.refresh();
        });
      }}
    >
      <Select
        value={next}
        aria-label="Order status"
        onChange={(event) => {
          const value = options.find((option) => option === event.target.value);
          if (value) setNext(value);
        }}
      >
        {options.map((value) => (
          <option key={value} value={value}>
            {value === status ? `${ORDER_STATUS_LABEL[value]} (current)` : value === "paid" ? "Mark as paid (creates cards)" : ORDER_STATUS_LABEL[value]}
          </option>
        ))}
      </Select>
      {withTracking ? (
        <div className="grid grid-cols-2 gap-2">
          <Input name="courier" defaultValue={courier} placeholder="Courier" aria-label="Courier" />
          <Input name="trackingNumber" defaultValue={trackingNumber} placeholder="Tracking no." aria-label="Tracking number" />
        </div>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending || (next === status && !withTracking)}>
        {pending ? "Saving..." : next === status ? "Save tracking" : "Update status"}
      </Button>
      {message ? <p className="text-xs text-ink-500">{message}</p> : null}
    </form>
  );
}
