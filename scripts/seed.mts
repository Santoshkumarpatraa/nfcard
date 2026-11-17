// Seeds the catalogue, the /demo profile and two test cards (safe to re-run); `--admin=<username>` promotes an admin.
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cards, productVariants, products, profileBlocks, profiles, user } from "../src/db/schema.ts";

const url = process.env.DATABASE_URL ?? "postgres://localhost:5432/nfcard_local";
if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo data in production");

const client = postgres(url, { max: 1 });
const db = drizzle(client, { casing: "snake_case" });

const CATALOG = [
  {
    slug: "metal-card",
    name: "Metal Card",
    material: "Stainless steel",
    tagline: "Our signature. Laser-engraved, 0.8 mm stainless steel.",
    description:
      "Cut from stainless steel and laser engraved with your name and logo. Heavy in the hand and built to last for years.\n\nThe NFC chip sits behind a precision window so it reads reliably on every modern phone.",
    features: [
      "Laser-engraved name, title and logo",
      "Works with iPhone and Android, no app",
      "QR code on the back for older phones",
      "Profile, leads and analytics included",
    ],
    position: 0,
    variants: [
      { name: "Matte Black", finish: "black", pricePaise: 249_900, compareAtPaise: 349_900 },
      { name: "24K Gold", finish: "gold", pricePaise: 399_900, compareAtPaise: 499_900 },
      { name: "Brushed Silver", finish: "silver", pricePaise: 249_900, compareAtPaise: 349_900 },
      { name: "Rose Gold", finish: "rose", pricePaise: 349_900, compareAtPaise: 449_900 },
    ],
  },
  {
    slug: "classic-card",
    name: "Classic Card",
    material: "Premium PVC",
    tagline: "Soft-touch matte finish with full colour printing.",
    description:
      "A lightweight card with a soft-touch matte finish and edge-to-edge print. The easy way to equip a whole team.",
    features: ["Full colour print on both sides", "Soft-touch matte finish", "Works with iPhone and Android", "Ideal for teams and events"],
    position: 1,
    variants: [
      { name: "Matte Black", finish: "black", pricePaise: 99_900, compareAtPaise: 149_900 },
      { name: "Pearl White", finish: "white", pricePaise: 99_900, compareAtPaise: 149_900 },
    ],
  },
];

async function seedCatalog() {
  for (const item of CATALOG) {
    const { variants, ...product } = item;
    const [row] = await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({ target: products.slug, set: product })
      .returning({ id: products.id });
    if (!row) throw new Error(`Could not upsert ${item.slug}`);

    const existing = await db.select().from(productVariants).where(eq(productVariants.productId, row.id));
    for (const [position, variant] of variants.entries()) {
      const match = existing.find((v) => v.name === variant.name);
      if (match) {
        await db.update(productVariants).set({ ...variant, position }).where(eq(productVariants.id, match.id));
      } else {
        await db.insert(productVariants).values({ ...variant, position, productId: row.id });
      }
    }
  }
  console.info(`catalogue: ${CATALOG.length} products`);
}

async function seedDemo() {
  const demoId = "demo-user";
  await db
    .insert(user)
    .values({
      id: demoId,
      name: "Aarav Mehta",
      email: "demo@example.com",
      emailVerified: true,
      username: "demo",
      displayUsername: "demo",
      phoneNumberVerified: true,
    })
    .onConflictDoNothing({ target: user.id });

  const [profile] = await db
    .insert(profiles)
    .values({
      userId: demoId,
      displayName: "Aarav Mehta",
      headline: "Founder",
      company: "Northwind Studio",
      bio: "Brand and product design for ambitious Indian startups. This is a sample profile to show what a tap opens.",
      contactEmail: "hello@example.com",
      website: "https://example.com",
      address: "Indiranagar, Bengaluru",
      theme: "onyx",
      isPublished: true,
    })
    .onConflictDoUpdate({ target: profiles.userId, set: { isPublished: true } })
    .returning({ id: profiles.id });
  if (!profile) throw new Error("Could not create demo profile");

  await db.delete(profileBlocks).where(eq(profileBlocks.profileId, profile.id));
  const blocks = [
    {
      type: "services" as const,
      title: "Services",
      data: {
        items: [
          { name: "Brand identity", price: "From ₹75,000", description: "Logo, typography, colour and a usable guideline." },
          { name: "Website design", price: "From ₹1,20,000", description: "Marketing sites that load fast and convert." },
          { name: "Design retainer", price: "₹60,000 / month" },
        ],
      },
    },
    {
      type: "links" as const,
      title: "Work",
      data: {
        items: [
          { label: "Portfolio", url: "https://example.com/work" },
          { label: "Book a 20 minute intro call", url: "https://example.com/book" },
        ],
      },
    },
    {
      type: "social" as const,
      data: {
        items: [
          { network: "linkedin", url: "https://www.linkedin.com" },
          { network: "instagram", url: "https://www.instagram.com" },
          { network: "behance", url: "https://www.behance.net" },
        ],
      },
    },
    {
      type: "reviews" as const,
      title: "Sample testimonials",
      data: {
        items: [
          { author: "Sample client", rating: 5, text: "Placeholder testimonial to show how reviews appear on a profile." },
        ],
      },
    },
    { type: "location" as const, title: "Studio", data: { address: "Indiranagar, Bengaluru, Karnataka" } },
  ];
  await db.insert(profileBlocks).values(blocks.map((block, position) => ({ ...block, position, profileId: profile.id })));

  await db
    .insert(cards)
    .values([
      { code: "NFCTEST2", status: "active", userId: demoId, profileId: profile.id, label: "Demo card", activatedAt: new Date() },
      { code: "NEWCARD9", status: "unassigned", label: "Test card for activation" },
    ])
    .onConflictDoNothing({ target: cards.code });

  console.info("demo: /demo profile, cards NFCTEST2 (active) and NEWCARD9 (unassigned)");
}

async function promoteAdmin() {
  const arg = process.argv.find((value) => value.startsWith("--admin="));
  if (!arg) return;
  const username = arg.slice("--admin=".length).toLowerCase();
  const updated = await db.update(user).set({ role: "admin" }).where(eq(user.username, username)).returning({ id: user.id });
  console.info(updated.length ? `admin: @${username} promoted` : `admin: no user @${username}`);
}

try {
  await seedCatalog();
  await seedDemo();
  await promoteAdmin();
} finally {
  await client.end();
}
