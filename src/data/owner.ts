import "server-only";
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db, type schema } from "@/db";
import { cards, leads, orderItems, orders, profileBlocks, profileEvents, profiles } from "@/db/schema";
import { type BlockInput, parseStoredBlock } from "@/lib/blocks";

// Either the shared pool or an open transaction, so callers inside a transaction reuse its connection.
type Executor = PgDatabase<PostgresJsQueryResultHKT, typeof schema>;

/** Every account gets exactly one profile, created lazily on first dashboard visit. */
export async function ensureProfile(userId: string, name: string, executor: Executor = db) {
  const [existing] = await executor.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing) return existing;

  const [created] = await executor
    .insert(profiles)
    .values({ userId, displayName: name })
    .onConflictDoNothing({ target: profiles.userId })
    .returning();
  if (created) return created;

  const [raced] = await executor.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!raced) throw new Error("Could not create profile");
  return raced;
}

export type OwnerProfile = Awaited<ReturnType<typeof ensureProfile>>;

export async function getProfileBlocks(profileId: string): Promise<BlockInput[]> {
  const rows = await db
    .select()
    .from(profileBlocks)
    .where(eq(profileBlocks.profileId, profileId))
    .orderBy(asc(profileBlocks.position));
  return rows.map(parseStoredBlock).filter((block): block is BlockInput => block !== null);
}

const IST_DAY = sql<string>`to_char(date_trunc('day', ${profileEvents.createdAt} at time zone 'Asia/Kolkata'), 'YYYY-MM-DD')`;

// Midnight India time, `daysAgo` days back, so totals cover exactly the days the chart shows.
function istMidnight(daysAgo: number): Date {
  const day = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return new Date(`${day}T00:00:00+05:30`);
}

export async function getProfileStats(profileId: string, days = 30) {
  const since = istMidnight(days - 1);
  const inRange = and(eq(profileEvents.profileId, profileId), gte(profileEvents.createdAt, since));

  const [byType, bySource, daily, topLinks] = await Promise.all([
    db.select({ type: profileEvents.type, value: count() }).from(profileEvents).where(inRange).groupBy(profileEvents.type),
    db
      .select({ source: profileEvents.source, value: count() })
      .from(profileEvents)
      .where(and(inRange, eq(profileEvents.type, "view")))
      .groupBy(profileEvents.source),
    db
      .select({ day: IST_DAY, value: count() })
      .from(profileEvents)
      .where(and(inRange, eq(profileEvents.type, "view")))
      .groupBy(IST_DAY)
      .orderBy(IST_DAY),
    db
      .select({ target: profileEvents.target, value: count() })
      .from(profileEvents)
      .where(and(inRange, eq(profileEvents.type, "link_click")))
      .groupBy(profileEvents.target)
      .orderBy(desc(count()))
      .limit(6),
  ]);

  const totals = { view: 0, save_contact: 0, link_click: 0, lead: 0 };
  for (const row of byType) totals[row.type] = row.value;

  const sources = { nfc: 0, qr: 0, link: 0 };
  for (const row of bySource) sources[row.source] = row.value;

  const dailyMap = new Map(daily.map((row) => [row.day, row.value]));
  const series: { day: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const day = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    series.push({ day, value: dailyMap.get(day) ?? 0 });
  }

  return { totals, sources, series, topLinks };
}

export async function getLeads(profileId: string, limit = 500) {
  return db
    .select()
    .from(leads)
    .where(eq(leads.profileId, profileId))
    .orderBy(desc(leads.createdAt))
    .limit(limit);
}

export async function getUserCards(userId: string) {
  return db.select().from(cards).where(eq(cards.userId, userId)).orderBy(desc(cards.createdAt));
}

export async function getUserOrders(userId: string) {
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  const items = rows.length
    ? await db
        .select()
        .from(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            rows.map((row) => row.id),
          ),
        )
    : [];
  return rows.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) }));
}
