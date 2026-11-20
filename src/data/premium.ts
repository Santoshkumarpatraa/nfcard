import "server-only";
import { eq, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { revalidateTag } from "next/cache";
import { db, type schema } from "@/db";
import { appSettings, profiles } from "@/db/schema";
import { profileTag } from "@/data/public-profile";

type Executor = PgDatabase<PostgresJsQueryResultHKT, typeof schema>;

const PRICE_KEY = "premium_price_paise";

/** Adds months on top of any remaining Premium time and clears the reminder state; returns the new end date. */
export async function extendPremium(profileId: string, months: number, executor: Executor = db): Promise<Date | null> {
  const [row] = await executor
    .update(profiles)
    .set({
      premiumUntil: sql`greatest(coalesce(${profiles.premiumUntil}, now()), now()) + make_interval(months => ${months})`,
      premiumNotice: null,
    })
    .where(eq(profiles.id, profileId))
    .returning({ premiumUntil: profiles.premiumUntil });
  return row?.premiumUntil ?? null;
}

/** Makes sure Premium lasts at least `months` from now without stacking; used for the free period that comes with a card. */
export async function grantPremiumAtLeast(profileId: string, months: number, executor: Executor = db): Promise<void> {
  await executor
    .update(profiles)
    .set({
      premiumUntil: sql`greatest(coalesce(${profiles.premiumUntil}, now()), now() + make_interval(months => ${months}))`,
      premiumNotice: null,
    })
    .where(eq(profiles.id, profileId));
}

/** Expires the cached public page so a plan change shows on the next visit; works from actions, routes and cron. */
export function refreshPublicProfile(profileId: string) {
  revalidateTag(profileTag(profileId), { expire: 0 });
}

export async function getPremiumPricePaise(): Promise<number | null> {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, PRICE_KEY)).limit(1);
  return typeof row?.value === "number" && row.value > 0 ? row.value : null;
}

export async function setPremiumPricePaise(paise: number | null): Promise<void> {
  if (paise === null) {
    await db.delete(appSettings).where(eq(appSettings.key, PRICE_KEY));
    return;
  }
  await db
    .insert(appSettings)
    .values({ key: PRICE_KEY, value: paise })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: paise, updatedAt: new Date() } });
}
