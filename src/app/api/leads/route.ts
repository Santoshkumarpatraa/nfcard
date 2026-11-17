import { and, count, eq, gt } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { cards, leads, profileEvents, profiles, user } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { toE164 } from "@/lib/phone";
import { clientIp, hashIp } from "@/lib/request";
import { absoluteUrl, site } from "@/lib/site";

const MAX_LEADS_PER_IP = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;
const MAX_LEADS_PER_PROFILE_PER_HOUR = 30;
const MAX_EMAILS_PER_PROFILE_PER_HOUR = 10;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || undefined);

const leadSchema = z.object({
  profileId: z.uuid(),
  cardId: z.uuid().optional().nullable(),
  name: z.string().trim().min(1, "Please enter your name").max(80),
  phone: optionalText(20),
  email: optionalText(120).pipe(z.email("Enter a valid email").optional()),
  company: optionalText(80),
  note: optionalText(500),
  website: optionalText(200),
});

const tooMany = () => Response.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });

export async function POST(request: Request) {
  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const input = parsed.data;

  // Honeypot: bots fill every field. Pretend success so they do not adapt.
  if (input.website) return Response.json({ ok: true });

  const phone = input.phone ? toE164(input.phone) : undefined;
  if (input.phone && !phone) return Response.json({ error: "Enter a valid phone number" }, { status: 400 });
  if (!phone && !input.email) return Response.json({ error: "Add a phone number or email" }, { status: 400 });

  const [owner] = await db
    .select({ email: user.email, emailVerified: user.emailVerified })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .where(and(eq(profiles.id, input.profileId), eq(profiles.isPublished, true)))
    .limit(1);
  if (!owner) return Response.json({ error: "Profile not found" }, { status: 404 });

  const ipHash = hashIp(clientIp(request));
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [[fromIp], [forProfile]] = await Promise.all([
    ipHash
      ? db
          .select({ value: count() })
          .from(leads)
          .where(and(eq(leads.ipHash, ipHash), gt(leads.createdAt, new Date(Date.now() - IP_WINDOW_MS))))
      : Promise.resolve([{ value: 0 }]),
    db
      .select({ value: count() })
      .from(leads)
      .where(and(eq(leads.profileId, input.profileId), gt(leads.createdAt, hourAgo))),
  ]);
  if ((fromIp?.value ?? 0) >= MAX_LEADS_PER_IP) return tooMany();
  const profileLeadsThisHour = forProfile?.value ?? 0;
  if (profileLeadsThisHour >= MAX_LEADS_PER_PROFILE_PER_HOUR) return tooMany();

  // A card id is only kept when it really belongs to this profile.
  const [card] = input.cardId
    ? await db
        .select({ id: cards.id })
        .from(cards)
        .where(and(eq(cards.id, input.cardId), eq(cards.profileId, input.profileId)))
        .limit(1)
    : [];

  await db.insert(leads).values({
    profileId: input.profileId,
    cardId: card?.id,
    name: input.name,
    phone,
    email: input.email,
    company: input.company,
    note: input.note,
    ipHash,
  });
  await db.insert(profileEvents).values({
    profileId: input.profileId,
    cardId: card?.id,
    type: "lead",
    source: card ? "nfc" : "link",
  });

  if (owner.emailVerified && profileLeadsThisHour < MAX_EMAILS_PER_PROFILE_PER_HOUR) {
    after(() =>
      sendEmail({
        to: owner.email,
        subject: `New contact: ${input.name}`,
        text: [
          `${input.name} shared their details with you on ${site.name}.`,
          "",
          phone ? `Phone: ${phone}` : null,
          input.email ? `Email: ${input.email}` : null,
          input.company ? `Company: ${input.company}` : null,
          input.note ? `Note: ${input.note}` : null,
          "",
          `See all your leads: ${absoluteUrl("/dashboard/leads")}`,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      }).catch((error: unknown) => console.error("[leads] notification email failed", error)),
    );
  }

  return Response.json({ ok: true });
}
