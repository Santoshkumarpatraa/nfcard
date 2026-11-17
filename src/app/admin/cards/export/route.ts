import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cards, orderItems, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { absoluteUrl } from "@/lib/site";

const querySchema = z.object({
  order: z.uuid().optional(),
  status: z.enum(["unassigned", "active", "disabled"]).optional(),
});

// The CSV the NFC programming vendor writes onto chips: one row per card, URL in the second column.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user.role !== "admin") return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const query = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) return new Response("Bad request", { status: 400 });

  const filters: SQL[] = [];
  if (query.data.status) filters.push(eq(cards.status, query.data.status));
  if (query.data.order) {
    const items = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.orderId, query.data.order));
    if (!items.length) return new Response("No cards for this order", { status: 404 });
    filters.push(inArray(cards.orderItemId, items.map((item) => item.id)));
  }

  const rows = await db
    .select({ card: cards, owner: user.username })
    .from(cards)
    .leftJoin(user, eq(user.id, cards.userId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(cards.createdAt))
    .limit(5000);

  const body = toCsv(
    ["code", "chip_url", "qr_url", "status", "owner", "label"],
    rows.map(({ card, owner }) => [
      card.code,
      absoluteUrl(`/t/${card.code}`),
      absoluteUrl(`/t/${card.code}?s=qr`),
      card.status,
      owner,
      card.label,
    ]),
  );
  return csvResponse(`cards-${new Date().toISOString().slice(0, 10)}.csv`, body);
}
