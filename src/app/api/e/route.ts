import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cards, profileEvents, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|slack|discord|headless|lighthouse/i;

const eventSchema = z.object({
  p: z.uuid(),
  c: z.uuid().optional(),
  t: z.enum(["view", "save_contact", "link_click"]),
  s: z.enum(["nfc", "qr", "link"]),
  x: z.string().max(300).optional(),
});

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) return new Response(null, { status: 204 });

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const event = parsed.data;

  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(and(eq(profiles.id, event.p), eq(profiles.isPublished, true)))
    .limit(1);
  if (!profile) return new Response(null, { status: 204 });

  // Owners checking their own page should not inflate their numbers.
  const session = await auth.api.getSession({ headers: request.headers });
  if (session?.user.id === profile.userId) return new Response(null, { status: 204 });

  const [card] = event.c
    ? await db
        .select({ id: cards.id })
        .from(cards)
        .where(and(eq(cards.id, event.c), eq(cards.profileId, event.p)))
        .limit(1)
    : [];

  await db.insert(profileEvents).values({
    profileId: event.p,
    cardId: card?.id,
    type: event.t,
    source: card ? event.s : event.s === "nfc" ? "link" : event.s,
    target: event.x,
  });

  return new Response(null, { status: 204 });
}
