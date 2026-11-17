import Link from "next/link";
import { Suspense } from "react";
import { Badge, Card, PageHeader, Skeleton, buttonClass } from "@/components/ui";
import { getUserOrders } from "@/data/owner";
import { ORDER_STATUS_LABEL, formatInr } from "@/lib/money";
import { requireVerifiedUser } from "@/lib/session";

export default function OrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Orders />
    </Suspense>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

async function Orders() {
  const session = await requireVerifiedUser("/dashboard/orders");
  const orders = await getUserOrders(session.user.id);

  return (
    <>
      <PageHeader title="Orders" description="Track your card orders." />
      {orders.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <p className="font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-ink-500">Premium metal cards, made to order and shipped across India.</p>
          <Link href="/shop" className={buttonClass("primary", "mt-6")}>
            Browse cards
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Order #{order.number}</p>
                  <p className="text-xs text-ink-500">{dateFormat.format(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={order.status === "cancelled" ? "red" : order.status === "pending" ? "amber" : "green"}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                  <span className="font-semibold">{formatInr(order.totalPaise)}</span>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-ink-100 border-t border-ink-100 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-2.5">
                    <span>
                      {item.productName} - {item.variantName}
                      <span className="text-ink-500"> x {item.quantity}</span>
                      <span className="block text-xs text-ink-500">Printed name: {item.customisation.nameOnCard}</span>
                    </span>
                    <span>{formatInr(item.unitPricePaise * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              {order.trackingNumber ? (
                <p className="mt-3 text-sm text-ink-600">
                  Shipped via {order.courier ?? "courier"}, tracking <span className="font-mono">{order.trackingNumber}</span>
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
