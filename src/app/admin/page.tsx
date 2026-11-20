import type { Metadata } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { Suspense } from "react";
import { Badge, Card, PageHeader, Skeleton } from "@/components/ui";
import { db } from "@/db";
import { orderItems, orders, user } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { ORDER_STATUS_LABEL, formatInr } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { requireAdmin } from "@/lib/session";
import { OrderStatusForm } from "./order-status-form";

export const metadata: Metadata = { title: "Admin orders" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AdminOrders />
    </Suspense>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

async function AdminOrders() {
  await requireAdmin();

  const rows = await db
    .select({ order: orders, buyerName: user.name, buyerEmail: user.email })
    .from(orders)
    .innerJoin(user, eq(user.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(200);
  const items = rows.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((row) => row.order.id)))
    : [];

  return (
    <>
      <PageHeader title="Orders" description="Newest first. Paid orders already have card codes linked to the buyer." />
      {rows.length === 0 ? (
        <Card className="px-6 py-14 text-center text-sm text-ink-500">No orders yet.</Card>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(({ order, buyerName, buyerEmail }) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    #{order.number} - {buyerName}
                  </p>
                  <p className="text-xs text-ink-500">
                    {buyerEmail} - {dateFormat.format(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={order.status === "pending" ? "amber" : order.status === "cancelled" ? "red" : "green"}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                  <span className="font-semibold">{formatInr(order.totalPaise)}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-6 border-t border-ink-100 pt-4 md:grid-cols-[1fr_1fr_1.2fr]">
                <ul className="flex flex-col gap-2 text-sm">
                  {items
                    .filter((item) => item.orderId === order.id)
                    .map((item) => (
                      <li key={item.id}>
                        {item.quantity} x {item.productName} ({item.variantName})
                        <span className="block text-xs text-ink-500">
                          Name: {item.customisation.nameOnCard}
                          {item.customisation.titleOnCard ? `, ${item.customisation.titleOnCard}` : ""}
                        </span>
                        {item.customisation.logoKey ? (
                          <a href={mediaUrl(item.customisation.logoKey)} download className="block text-xs font-medium text-ink-900 underline">
                            Download logo
                          </a>
                        ) : (
                          <span className="block text-xs text-ink-500">No logo</span>
                        )}
                        {item.customisation.notes ? (
                          <span className="block text-xs text-ink-600">Notes: {item.customisation.notes}</span>
                        ) : null}
                      </li>
                    ))}
                </ul>
                <address className="text-sm leading-relaxed text-ink-600 not-italic">
                  {order.shipping.name}, {formatPhone(order.shipping.phone)}
                  <br />
                  {order.shipping.line1}
                  {order.shipping.line2 ? `, ${order.shipping.line2}` : ""}
                  <br />
                  {order.shipping.city}, {order.shipping.state} {order.shipping.pincode}
                  {order.gstin ? <span className="block text-xs">GSTIN {order.gstin}</span> : null}
                </address>
                <div className="flex flex-col gap-3">
                  <OrderStatusForm
                    orderId={order.id}
                    status={order.status}
                    courier={order.courier ?? ""}
                    trackingNumber={order.trackingNumber ?? ""}
                  />
                  {order.status !== "pending" ? (
                    <a href={`/admin/cards/export?order=${order.id}`} className="text-sm font-medium text-ink-900 underline">
                      Download chip URLs (CSV)
                    </a>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
