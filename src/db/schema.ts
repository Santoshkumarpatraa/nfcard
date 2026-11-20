import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// Better Auth tables. Field names must match what Better Auth and its plugins expect.

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  username: text().unique(),
  displayUsername: text(),
  phoneNumber: text().unique(),
  phoneNumberVerified: boolean().notNull().default(false),
  role: text().notNull().default("user"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text().primaryKey(),
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// Uploaded media for the "db" storage driver: lets uploads work on read-only hosts until object storage is configured.
export const mediaObjects = pgTable("media_objects", {
  key: text().primaryKey(),
  contentType: text().notNull(),
  body: bytea().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Every OTP SMS sent, so sends can be capped per number and overall (SMS pumping protection).
export const smsLog = pgTable(
  "sms_log",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    phone: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.phone, t.createdAt), index().on(t.createdAt)],
);

// Profiles

export const profiles = pgTable("profiles", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text().notNull(),
  headline: text(),
  company: text(),
  bio: text(),
  contactPhone: text(),
  contactEmail: text(),
  whatsapp: text(),
  website: text(),
  address: text(),
  avatarKey: text(),
  coverKey: text(),
  theme: text().notNull().default("onyx"),
  accent: text(),
  isPublished: boolean().notNull().default(false),
  premiumUntil: timestamp({ withTimezone: true }),
  premiumNotice: text(),
  ...timestamps,
});

export const blockType = pgEnum("block_type", [
  "links",
  "social",
  "gallery",
  "video",
  "services",
  "document",
  "reviews",
  "location",
  "upi",
  "text",
]);

export const profileBlocks = pgTable(
  "profile_blocks",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: blockType().notNull(),
    title: text(),
    position: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    data: jsonb().notNull().default(sql`'{}'::jsonb`),
    ...timestamps,
  },
  (t) => [index().on(t.profileId, t.position)],
);

// Cards

export const cardStatus = pgEnum("card_status", ["unassigned", "active", "disabled"]);

export const cards = pgTable(
  "cards",
  {
    id: uuid().primaryKey().defaultRandom(),
    code: text().notNull().unique(),
    status: cardStatus().notNull().default("unassigned"),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    profileId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    label: text(),
    orderItemId: uuid().references(() => orderItems.id, { onDelete: "set null" }),
    activatedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.userId), index().on(t.profileId)],
);

// Leads and analytics

export const leads = pgTable(
  "leads",
  {
    id: uuid().primaryKey().defaultRandom(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    cardId: uuid().references(() => cards.id, { onDelete: "set null" }),
    name: text().notNull(),
    phone: text(),
    email: text(),
    company: text(),
    note: text(),
    ipHash: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.profileId, t.createdAt), index().on(t.ipHash, t.createdAt)],
);

export const eventType = pgEnum("event_type", ["view", "save_contact", "link_click", "lead"]);
export const eventSource = pgEnum("event_source", ["nfc", "qr", "link"]);

export const profileEvents = pgTable(
  "profile_events",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    cardId: uuid().references(() => cards.id, { onDelete: "set null" }),
    type: eventType().notNull(),
    source: eventSource().notNull().default("link"),
    target: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.profileId, t.createdAt)],
);

// Store

export const products = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  material: text().notNull(),
  tagline: text().notNull(),
  description: text().notNull(),
  features: jsonb().$type<string[]>().notNull().default([]),
  position: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  ...timestamps,
});

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid().primaryKey().defaultRandom(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text().notNull(),
    finish: text().notNull(),
    pricePaise: integer().notNull(),
    compareAtPaise: integer(),
    position: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [index().on(t.productId)],
);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
]);

export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    number: bigserial({ mode: "number" }).notNull().unique(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatus().notNull().default("pending"),
    subtotalPaise: integer().notNull(),
    shippingPaise: integer().notNull().default(0),
    totalPaise: integer().notNull(),
    currency: text().notNull().default("INR"),
    shipping: jsonb().$type<ShippingAddress>().notNull(),
    gstin: text(),
    razorpayOrderId: text().unique(),
    razorpayPaymentId: text(),
    courier: text(),
    trackingNumber: text(),
    paidAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.userId), index().on(t.status)],
);

export type CardCustomisation = {
  nameOnCard: string;
  titleOnCard?: string;
  notes?: string;
  logoKey?: string;
};

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    variantId: uuid()
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    productName: text().notNull(),
    variantName: text().notNull(),
    unitPricePaise: integer().notNull(),
    quantity: integer().notNull(),
    customisation: jsonb().$type<CardCustomisation>().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.orderId)],
);

// Admin-managed values such as the Premium renewal price.
export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const renewalStatus = pgEnum("renewal_status", ["pending", "paid"]);

export const renewals = pgTable(
  "renewals",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    profileId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    months: integer().notNull(),
    amountPaise: integer().notNull(),
    status: renewalStatus().notNull().default("pending"),
    razorpayOrderId: text().unique(),
    razorpayPaymentId: text(),
    paidAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId)],
);
