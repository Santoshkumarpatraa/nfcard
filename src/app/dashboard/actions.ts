"use server";

import { and, eq, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { cards, profileBlocks, profiles, user } from "@/db/schema";
import { cardTag, profileTag, usernameTag } from "@/data/public-profile";
import { ensureProfile } from "@/data/owner";
import { grantPremiumAtLeast } from "@/data/premium";
import { auth } from "@/lib/auth";
import { BLOCK_LABELS, blockInputSchema, isBlockType } from "@/lib/blocks";
import { isCardCode, normaliseCardCode } from "@/lib/card-code";
import { toE164 } from "@/lib/phone";
import { premiumMonthsFor } from "@/lib/premium";
import { isThemeId } from "@/lib/themes";
import { normaliseUsername, usernameProblem } from "@/lib/username";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function verifiedSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if (!session.user.phoneNumberVerified) return null;
  return session;
}

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const phoneField = z
  .string()
  .trim()
  .max(20)
  .transform((value, ctx) => {
    if (!value) return null;
    const e164 = toE164(value);
    if (!e164) {
      ctx.addIssue({ code: "custom", message: `${value} is not a valid phone number` });
      return z.NEVER;
    }
    return e164;
  });

const websiteField = z
  .string()
  .trim()
  .max(300)
  .transform((value, ctx) => {
    if (!value) return null;
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    if (!URL.canParse(withProtocol)) {
      ctx.addIssue({ code: "custom", message: "Website must be a valid link" });
      return z.NEVER;
    }
    return withProtocol;
  });

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Name is required").max(80),
  headline: nullableText(80),
  company: nullableText(80),
  bio: nullableText(600),
  contactPhone: phoneField,
  contactEmail: z
    .string()
    .trim()
    .max(120)
    .transform((value) => value.toLowerCase() || null)
    .pipe(z.email("Enter a valid public email").nullable()),
  whatsapp: phoneField,
  website: websiteField,
  address: nullableText(300),
  avatarKey: z.string().max(200).nullable(),
  coverKey: z.string().max(200).nullable(),
  theme: z.string().refine(isThemeId, "Unknown theme"),
  accent: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.string().regex(/^#[0-9a-fA-F]{6}$/, "Accent must be a hex colour").nullable()),
});

const saveSchema = z.object({
  profile: profileSchema,
  blocks: z.array(blockInputSchema).max(30),
});

export type ProfileFormValues = z.input<typeof profileSchema>;

const FIELD_LABELS: Record<string, string> = {
  displayName: "Name",
  contactPhone: "Phone",
  contactEmail: "Email",
  whatsapp: "WhatsApp",
  website: "Website",
  accent: "Accent colour",
};

const BLOCK_FIELD_LABELS: Record<string, string> = {
  url: "link",
  label: "label",
  name: "name",
  address: "address",
  vpa: "UPI ID",
  payeeName: "payee name",
  body: "text",
  author: "reviewer name",
  text: "review",
};

function blockTypeAt(input: unknown, index: number): string | null {
  if (typeof input !== "object" || input === null || !("blocks" in input) || !Array.isArray(input.blocks)) return null;
  const block: unknown = input.blocks[index];
  return typeof block === "object" && block !== null && "type" in block && typeof block.type === "string" ? block.type : null;
}

function describeIssue(issue: z.core.$ZodIssue | undefined, input: unknown): string {
  if (!issue) return "Some details are invalid";
  const [scope, index, ...rest] = issue.path;
  if (scope === "blocks" && typeof index === "number") {
    const type = blockTypeAt(input, index);
    const section = type && isBlockType(type) ? BLOCK_LABELS[type] : `Section ${index + 1}`;
    const key = rest.filter((part) => typeof part === "string").pop();
    const field = typeof key === "string" ? (BLOCK_FIELD_LABELS[key] ?? key) : "a field";
    if (issue.code === "too_small") return `${section}: fill in the ${field} or remove that row`;
    if (key === "url") return `${section}: the ${field} must be a full web address, like https://example.com`;
    if (issue.code === "too_big") return `${section}: the ${field} is too long`;
    return `${section}: ${issue.message}`;
  }
  if (scope === "profile" && typeof index === "string") {
    return `${FIELD_LABELS[index] ?? index}: ${issue.message}`;
  }
  return issue.message;
}

export async function saveProfile(input: unknown): Promise<ActionResult> {
  const session = await verifiedSession();
  if (!session) return { ok: false, error: "Please sign in again" };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: describeIssue(parsed.error.issues[0], input) };

  const profile = await ensureProfile(session.user.id, session.user.name);
  const { profile: values, blocks } = parsed.data;

  await db.transaction(async (tx) => {
    await tx.update(profiles).set(values).where(eq(profiles.id, profile.id));
    await tx.delete(profileBlocks).where(eq(profileBlocks.profileId, profile.id));
    if (blocks.length) {
      await tx.insert(profileBlocks).values(
        blocks.map((block, position) => ({
          profileId: profile.id,
          type: block.type,
          title: block.title || null,
          isVisible: block.isVisible,
          data: block.data,
          position,
        })),
      );
    }
  });

  updateTag(profileTag(profile.id));
  return { ok: true, message: "Saved. Your live profile is updated." };
}

export async function setPublished(published: boolean): Promise<ActionResult> {
  const session = await verifiedSession();
  if (!session) return { ok: false, error: "Verify your phone number before publishing" };
  if (!session.user.username) return { ok: false, error: "Choose a username first" };

  const profile = await ensureProfile(session.user.id, session.user.name);
  await db.update(profiles).set({ isPublished: published }).where(eq(profiles.id, profile.id));
  updateTag(profileTag(profile.id));
  updateTag(usernameTag(session.user.username));
  return { ok: true, message: published ? "Your profile is live" : "Your profile is hidden" };
}

export async function changeUsername(raw: string): Promise<ActionResult> {
  const session = await verifiedSession();
  if (!session) return { ok: false, error: "Please sign in again" };

  const next = normaliseUsername(raw);
  const problem = usernameProblem(next);
  if (problem) return { ok: false, error: problem };

  const previous = session.user.username;
  if (previous === next) return { ok: true, message: "No change" };

  const [taken] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.username, next), ne(user.id, session.user.id)))
    .limit(1);
  if (taken) return { ok: false, error: "That username is taken" };

  await db.update(user).set({ username: next, displayUsername: next }).where(eq(user.id, session.user.id));

  const profile = await ensureProfile(session.user.id, session.user.name);
  updateTag(profileTag(profile.id));
  updateTag(usernameTag(next));
  if (previous) updateTag(usernameTag(previous));
  return { ok: true, message: `Your profile now lives at /${next}. Your cards keep working.` };
}

export async function activateCard(rawCode: string): Promise<ActionResult> {
  const session = await verifiedSession();
  if (!session) return { ok: false, error: "Verify your phone number first" };

  const code = normaliseCardCode(rawCode);
  if (!isCardCode(code)) return { ok: false, error: "That does not look like a card code" };

  const [card] = await db.select().from(cards).where(eq(cards.code, code)).limit(1);
  if (!card) return { ok: false, error: "Card not found. Check the code printed with your card." };
  if (card.userId === session.user.id) return { ok: true, message: "This card is already yours" };
  if (card.status !== "unassigned") return { ok: false, error: "This card is already linked to another account" };

  const profile = await ensureProfile(session.user.id, session.user.name);
  const updated = await db
    .update(cards)
    .set({ userId: session.user.id, profileId: profile.id, status: "active", activatedAt: new Date() })
    .where(and(eq(cards.id, card.id), eq(cards.status, "unassigned")))
    .returning({ id: cards.id });
  if (!updated.length) return { ok: false, error: "This card was just activated by someone else" };

  await grantPremiumAtLeast(profile.id, premiumMonthsFor(card.label ?? ""));
  updateTag(cardTag(code));
  updateTag(profileTag(profile.id));
  return { ok: true, message: "Card activated. A tap now opens your profile." };
}

export async function setCardStatus(cardId: string, status: "active" | "disabled"): Promise<ActionResult> {
  const session = await verifiedSession();
  if (!session) return { ok: false, error: "Please sign in again" };

  const [card] = await db
    .update(cards)
    .set({ status })
    .where(and(eq(cards.id, cardId), eq(cards.userId, session.user.id), ne(cards.status, "unassigned")))
    .returning({ code: cards.code });
  if (!card) return { ok: false, error: "Card not found" };

  updateTag(cardTag(card.code));
  return { ok: true, message: status === "disabled" ? "Card disabled. Taps now show an inactive notice." : "Card re-enabled" };
}
