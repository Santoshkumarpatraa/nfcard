import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { cards, profileBlocks, profiles, user } from "@/db/schema";
import { type BlockInput, parseStoredBlock } from "@/lib/blocks";

export type PublicProfile = {
  id: string;
  username: string;
  displayName: string;
  headline: string | null;
  company: string | null;
  bio: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  avatarKey: string | null;
  coverKey: string | null;
  theme: string;
  accent: string | null;
  blocks: BlockInput[];
};

// Cache tags. Every write path must invalidate the tags its change touches.
export const profileTag = (profileId: string) => `p:${profileId}`;
export const usernameTag = (username: string) => `u:${username}`;
export const cardTag = (code: string) => `c:${code}`;

async function loadProfile(profileId: string): Promise<PublicProfile | null> {
  const [row] = await db
    .select({ profile: profiles, username: user.username })
    .from(profiles)
    .innerJoin(user, eq(user.id, profiles.userId))
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!row || !row.username || !row.profile.isPublished) return null;

  const blockRows = await db
    .select()
    .from(profileBlocks)
    .where(eq(profileBlocks.profileId, profileId))
    .orderBy(asc(profileBlocks.position));

  const blocks = blockRows
    .filter((block) => block.isVisible)
    .map(parseStoredBlock)
    .filter((block): block is BlockInput => block !== null);

  const p = row.profile;
  return {
    id: p.id,
    username: row.username,
    displayName: p.displayName,
    headline: p.headline,
    company: p.company,
    bio: p.bio,
    contactPhone: p.contactPhone,
    contactEmail: p.contactEmail,
    whatsapp: p.whatsapp,
    website: p.website,
    address: p.address,
    avatarKey: p.avatarKey,
    coverKey: p.coverKey,
    theme: p.theme,
    accent: p.accent,
    blocks,
  };
}

export async function getPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  "use cache";
  cacheLife("max");
  cacheTag(usernameTag(username));

  const [row] = await db
    .select({ profileId: profiles.id })
    .from(user)
    .innerJoin(profiles, eq(profiles.userId, user.id))
    .where(eq(user.username, username))
    .limit(1);

  if (!row) return null;
  cacheTag(profileTag(row.profileId));
  return loadProfile(row.profileId);
}

export type CardTarget =
  | { status: "unassigned" }
  | { status: "disabled" }
  | { status: "active"; cardId: string; profile: PublicProfile | null };

export async function getCardTarget(code: string): Promise<CardTarget | null> {
  "use cache";
  cacheLife("max");
  cacheTag(cardTag(code));

  const [card] = await db
    .select({ id: cards.id, status: cards.status, profileId: cards.profileId })
    .from(cards)
    .where(eq(cards.code, code))
    .limit(1);

  if (!card) return null;
  if (card.status === "disabled") return { status: "disabled" };
  if (card.status === "unassigned" || !card.profileId) return { status: "unassigned" };

  cacheTag(profileTag(card.profileId));
  return { status: "active", cardId: card.id, profile: await loadProfile(card.profileId) };
}
