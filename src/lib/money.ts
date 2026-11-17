const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatInr(paise: number): string {
  return inr.format(paise / 100);
}

export const ORDER_STATUS_LABEL = {
  pending: "Awaiting payment",
  paid: "Paid",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABEL;

// Orders only move forward; "paid" is reached through markOrderPaid so cards are always created.
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["in_production", "shipped", "delivered", "cancelled"],
  in_production: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
