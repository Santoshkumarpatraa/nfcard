// Fills profiles with presentation content and generated images (stored in media_objects); usage: pnpm showcase --profile=<username>
import { createHash } from "node:crypto";
import { eq, max } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import sharp from "sharp";
import { mediaObjects, profileBlocks, profiles, user } from "../src/db/schema.ts";

const arg = (name: string) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const site = (arg("site") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://nfcard-peach.vercel.app").replace(/\/$/, "");
const profileArg = arg("profile");
const usernames = ["demo", ...(profileArg ? [profileArg.toLowerCase()] : [])];

const client = postgres(process.env.DATABASE_URL ?? "postgres://localhost:5432/nfcard_local", { max: 1 });
const db = drizzle(client, { casing: "snake_case" });

type Finish = { surface: [string, string, string]; ink: string; sub: string; backdrop: [string, string]; glow: string };

const FINISHES = {
  black: { surface: ["#2c2c30", "#121214", "#0b0b0c"], ink: "#ead9b0", sub: "#a19d94", backdrop: ["#1a1a1d", "#0a0a0b"], glow: "#c8a96a" },
  gold: { surface: ["#f2dfb2", "#c8a96a", "#9c7d43"], ink: "#17150f", sub: "#3b3326", backdrop: ["#17150f", "#0a0a0b"], glow: "#e6cf9a" },
  silver: { surface: ["#f4f4f2", "#bdbdbb", "#8d8d8b"], ink: "#111113", sub: "#3a3a40", backdrop: ["#eceae4", "#cfccc4"], glow: "#ffffff" },
  rose: { surface: ["#f5d8cc", "#c98f7b", "#9a5f4d"], ink: "#1f1210", sub: "#4a2d26", backdrop: ["#2b1418", "#120a0b"], glow: "#e8b9a8" },
} satisfies Record<string, Finish>;

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function cardScene(finish: Finish, name: string, title: string, angle: number): string {
  const nfc = [10, 18, 26, 34].map((r) => `<path d="M${-r * 0.55} ${-r} A ${r} ${r} 0 0 1 ${-r * 0.55} ${r}" />`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <radialGradient id="bg" cx="70%" cy="25%" r="90%"><stop offset="0" stop-color="${finish.backdrop[0]}"/><stop offset="1" stop-color="${finish.backdrop[1]}"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${finish.glow}" stop-opacity="0.35"/><stop offset="1" stop-color="${finish.glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${finish.surface[0]}"/><stop offset="0.55" stop-color="${finish.surface[1]}"/><stop offset="1" stop-color="${finish.surface[2]}"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0.3" stop-color="#fff" stop-opacity="0"/><stop offset="0.47" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <pattern id="brush" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="1" height="4" fill="#fff" opacity="0.05"/></pattern>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="40" stdDeviation="40" flood-color="#000" flood-opacity="0.55"/></filter>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="560" cy="520" r="430" fill="url(#glow)"/>
  <g transform="translate(540 560) rotate(${angle})" filter="url(#shadow)">
    <rect x="-380" y="-240" width="760" height="480" rx="34" fill="url(#metal)"/>
    <rect x="-380" y="-240" width="760" height="480" rx="34" fill="url(#brush)"/>
    <rect x="-380" y="-240" width="760" height="480" rx="34" fill="url(#sheen)"/>
    <text x="-330" y="-160" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="${finish.ink}">NFCard</text>
    <g transform="translate(310 -172)" fill="none" stroke="${finish.ink}" stroke-width="5" stroke-linecap="round">${nfc}</g>
    <text x="-330" y="150" font-family="Helvetica, Arial, sans-serif" font-size="42" font-weight="600" fill="${finish.ink}">${escapeXml(name)}</text>
    <text x="-330" y="196" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="5" fill="${finish.sub}">${escapeXml(title.toUpperCase())}</text>
  </g>
</svg>`;
}

function coverScene(): string {
  const lines = Array.from({ length: 40 }, (_, i) => `<line x1="${i * 48 - 400}" y1="480" x2="${i * 48 + 80}" y2="0" stroke="#c8a96a" stroke-opacity="0.06" stroke-width="1"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="480" viewBox="0 0 1440 480">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#121214"/><stop offset="1" stop-color="#2a2418"/></linearGradient>
    <radialGradient id="glow" cx="78%" cy="30%" r="55%"><stop offset="0" stop-color="#c8a96a" stop-opacity="0.45"/><stop offset="1" stop-color="#c8a96a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1440" height="480" fill="url(#bg)"/>
  ${lines}
  <rect width="1440" height="480" fill="url(#glow)"/>
</svg>`;
}

async function storeImage(kind: "cover" | "gallery", svg: string, widths: number[], aspect: number) {
  const source = await sharp(Buffer.from(svg)).png().toBuffer();
  const key = `${kind}/${createHash("sha256").update(source).digest("hex").slice(0, 20)}`;
  for (const width of widths) {
    const body = await sharp(source).resize({ width, height: Math.round(width / aspect), fit: "cover" }).webp({ quality: 82 }).toBuffer();
    await db.insert(mediaObjects).values({ key: `${key}-${width}.webp`, contentType: "image/webp", body }).onConflictDoNothing();
  }
  const largest = Math.max(...widths);
  return { key, width: largest, height: Math.round(largest / aspect) };
}

async function showcase(username: string) {
  const [owner] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.username, username)).limit(1);
  if (!owner) {
    console.info(`skip @${username}: no such user`);
    return;
  }
  let [profile] = await db.select().from(profiles).where(eq(profiles.userId, owner.id)).limit(1);
  if (!profile) [profile] = await db.insert(profiles).values({ userId: owner.id, displayName: owner.name }).returning();
  if (!profile) throw new Error(`Could not create a profile for @${username}`);

  const cover = await storeImage("cover", coverScene(), [720, 1440], 3);
  const title = profile.headline || "Founder";
  const gallery = [];
  for (const [finish, angle] of [["black", -8], ["gold", 6], ["silver", -5], ["rose", 7]] as const) {
    gallery.push(await storeImage("gallery", cardScene(FINISHES[finish], profile.displayName, title, angle), [480, 1080], 1));
  }

  await db
    .update(profiles)
    .set({
      coverKey: profile.coverKey ?? cover.key,
      headline: profile.headline ?? "Founder",
      company: profile.company ?? "NFCard",
      bio:
        profile.bio ??
        "Helping professionals and teams make every first impression count. Tap to save my details, share yours, or book a quick call.",
    })
    .where(eq(profiles.id, profile.id));

  const existing = await db.select({ type: profileBlocks.type }).from(profileBlocks).where(eq(profileBlocks.profileId, profile.id));
  const has = (type: string) => existing.some((block) => block.type === type);
  const [{ top } = { top: -1 }] = await db
    .select({ top: max(profileBlocks.position) })
    .from(profileBlocks)
    .where(eq(profileBlocks.profileId, profile.id));
  let position = (top ?? -1) + 1;

  const blocks = [
    !has("services") && {
      type: "services" as const,
      title: "What we offer",
      data: {
        items: [
          { name: "Premium metal NFC cards", price: "From ₹2,499", description: "Laser engraved, one tap to share your profile." },
          { name: "Team cards", price: "Custom pricing", description: "Branded cards for your whole team with one dashboard." },
          { name: "Profile setup", price: "Included", description: "We design your profile so it is ready on day one." },
        ],
      },
    },
    !has("gallery") && { type: "gallery" as const, title: "Our cards", data: { images: gallery } },
    !has("links") && {
      type: "links" as const,
      title: "Get started",
      data: {
        items: [
          { label: "Order your card", url: `${site}/shop` },
          { label: "Cards for your team", url: `${site}/business` },
        ],
      },
    },
    !has("reviews") && {
      type: "reviews" as const,
      title: "What clients say",
      data: {
        items: [
          { author: "Sales head, SaaS company", rating: 5, text: "Our whole sales team switched. Leads now land in one place after every event." },
          { author: "Founder, D2C brand", rating: 5, text: "The metal card starts a conversation every single time. Setup took two minutes." },
          { author: "Real estate consultant", rating: 5, text: "Clients save my number on the spot. No more lost paper cards." },
        ],
      },
    },
    !has("social") && {
      type: "social" as const,
      data: { items: [{ network: "linkedin", url: "https://www.linkedin.com" }, { network: "instagram", url: "https://www.instagram.com" }] },
    },
    !has("location") && { type: "location" as const, title: "Visit us", data: { address: "Bengaluru, Karnataka, India" } },
  ].filter((block) => block !== false);

  if (blocks.length) {
    await db.insert(profileBlocks).values(blocks.map((block) => ({ ...block, profileId: profile.id, position: position++ })));
  }
  console.info(`@${username}: cover ${profile.coverKey ? "kept" : "added"}, ${blocks.length} sections added (${blocks.map((b) => b.type).join(", ") || "none"})`);
}

try {
  for (const username of usernames) await showcase(username);
  console.info("Done. Open each profile in the dashboard and press Save (or redeploy) so the live pages refresh.");
} finally {
  await client.end();
}
