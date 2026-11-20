import { and, eq, gt, isNull, lte, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { profiles, user } from "@/db/schema";
import { getPremiumPricePaise, refreshPublicProfile } from "@/data/premium";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { formatInr } from "@/lib/money";
import { formatPlanDate } from "@/lib/premium";
import { absoluteUrl, site } from "@/lib/site";

const DAY = 86_400_000;
const BATCH = 500;

type Due = { profileId: string; premiumUntil: Date | null; email: string; name: string };

async function due(condition: ReturnType<typeof and>): Promise<Due[]> {
  return db
    .select({ profileId: profiles.id, premiumUntil: profiles.premiumUntil, email: user.email, name: user.name })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .where(condition)
    .limit(BATCH);
}

// Runs daily (vercel.json): reminder emails before Premium ends, and a page refresh for anyone who just expired.
export async function GET(request: Request) {
  if (env.isProduction || env.cronSecret) {
    if (!env.cronSecret || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * DAY);
  const in30 = new Date(now.getTime() + 30 * DAY);
  const pricePaise = await getPremiumPricePaise();
  const renewLine = pricePaise
    ? `Renew for ${formatInr(pricePaise)} a year: ${absoluteUrl("/dashboard/plan")}`
    : `See your plan: ${absoluteUrl("/dashboard/plan")}`;

  const send = (person: Due, subject: string, lines: string[]) =>
    sendEmail({ to: person.email, subject, text: [`Hi ${person.name.split(" ")[0]},`, "", ...lines, "", site.name].join("\n") }).catch(
      (error: unknown) => console.error("[cron:premium] email failed", error),
    );

  const expired = await due(and(lte(profiles.premiumUntil, now), or(isNull(profiles.premiumNotice), ne(profiles.premiumNotice, "expired"))));
  for (const person of expired) {
    await db.update(profiles).set({ premiumNotice: "expired" }).where(eq(profiles.id, person.profileId));
    refreshPublicProfile(person.profileId);
    await send(person, "Your Premium has ended", [
      "Your card still works and shows your name, photo and contact buttons.",
      "Your business sections, theme and analytics are saved and will come back as soon as you renew.",
      renewLine,
    ]);
  }

  const week = await due(
    and(gt(profiles.premiumUntil, now), lte(profiles.premiumUntil, in7), or(isNull(profiles.premiumNotice), eq(profiles.premiumNotice, "30d"))),
  );
  for (const person of week) {
    await db.update(profiles).set({ premiumNotice: "7d" }).where(eq(profiles.id, person.profileId));
    await send(person, "Your Premium ends in a week", [
      `Premium ends on ${person.premiumUntil ? formatPlanDate(person.premiumUntil) : "soon"}. Your card keeps working after that, but business sections and analytics will be hidden.`,
      renewLine,
    ]);
  }

  const month = await due(and(gt(profiles.premiumUntil, in7), lte(profiles.premiumUntil, in30), isNull(profiles.premiumNotice)));
  for (const person of month) {
    await db.update(profiles).set({ premiumNotice: "30d" }).where(eq(profiles.id, person.profileId));
    await send(person, "Your Premium ends next month", [
      `Premium ends on ${person.premiumUntil ? formatPlanDate(person.premiumUntil) : "soon"}.`,
      renewLine,
    ]);
  }

  return Response.json({ expired: expired.length, reminded7: week.length, reminded30: month.length });
}
