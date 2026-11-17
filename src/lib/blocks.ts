import { z } from "zod";

const url = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`))
  .pipe(z.url({ protocol: /^https?$/ }));

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), url.optional());

const shortText = (max: number) => z.string().trim().max(max);

export const SOCIAL_NETWORKS = [
  "instagram",
  "linkedin",
  "x",
  "facebook",
  "youtube",
  "github",
  "behance",
  "dribbble",
  "telegram",
] as const;

const NETWORK_HOSTS: [RegExp, (typeof SOCIAL_NETWORKS)[number]][] = [
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(x|twitter)\.com$/, "x"],
  [/(^|\.)(facebook|fb)\.com$/, "facebook"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)github\.com$/, "github"],
  [/(^|\.)behance\.net$/, "behance"],
  [/(^|\.)dribbble\.com$/, "dribbble"],
  [/(^|\.)(t\.me|telegram\.me)$/, "telegram"],
];

/** Detects the social network from a pasted link, so the icon always matches the URL. */
export function networkFromUrl(input: string): (typeof SOCIAL_NETWORKS)[number] | null {
  try {
    const host = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`).hostname.toLowerCase();
    return NETWORK_HOSTS.find(([pattern]) => pattern.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
}

export const imageRef = z.object({
  key: shortText(200).min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type ImageRef = z.infer<typeof imageRef>;

export const blockDataSchemas = {
  links: z.object({
    items: z.array(z.object({ label: shortText(60).min(1), url })).max(20),
  }),
  social: z.object({
    items: z.array(z.object({ network: z.enum(SOCIAL_NETWORKS), url })).max(12),
  }),
  gallery: z.object({
    images: z.array(imageRef).max(12),
  }),
  video: z.object({
    url,
    caption: shortText(120).optional(),
  }),
  services: z.object({
    items: z
      .array(
        z.object({
          name: shortText(80).min(1),
          description: shortText(300).optional(),
          price: shortText(40).optional(),
        }),
      )
      .max(20),
  }),
  document: z.object({
    items: z.array(z.object({ label: shortText(80).min(1), key: shortText(200).min(1) })).max(10),
  }),
  reviews: z.object({
    googleReviewUrl: optionalUrl,
    items: z
      .array(
        z.object({
          author: shortText(60).min(1),
          text: shortText(400).min(1),
          rating: z.number().int().min(1).max(5),
        }),
      )
      .max(10),
  }),
  location: z.object({
    address: shortText(300).min(1),
    mapsUrl: optionalUrl,
  }),
  upi: z.object({
    vpa: z
      .string()
      .trim()
      .regex(/^[\w.-]{2,256}@[a-zA-Z]{2,64}$/, "Enter a valid UPI ID like name@okbank"),
    payeeName: shortText(60).min(1),
  }),
  text: z.object({
    body: shortText(1500).min(1),
  }),
} as const;

export type BlockType = keyof typeof blockDataSchemas;
export const BLOCK_TYPES: BlockType[] = [
  "links",
  "social",
  "services",
  "gallery",
  "video",
  "reviews",
  "document",
  "location",
  "upi",
  "text",
];

export type BlockData<T extends BlockType> = z.infer<(typeof blockDataSchemas)[T]>;

export const BLOCK_LABELS: Record<BlockType, string> = {
  links: "Links",
  social: "Social profiles",
  gallery: "Photo gallery",
  video: "Video",
  services: "Services and prices",
  document: "Brochures and documents",
  reviews: "Reviews",
  location: "Location",
  upi: "UPI payment",
  text: "About text",
};

const blockBase = {
  id: z.string().optional(),
  title: shortText(60).optional(),
  isVisible: z.boolean(),
};

export const blockInputSchema = z.discriminatedUnion("type", [
  z.object({ ...blockBase, type: z.literal("links"), data: blockDataSchemas.links }),
  z.object({ ...blockBase, type: z.literal("social"), data: blockDataSchemas.social }),
  z.object({ ...blockBase, type: z.literal("gallery"), data: blockDataSchemas.gallery }),
  z.object({ ...blockBase, type: z.literal("video"), data: blockDataSchemas.video }),
  z.object({ ...blockBase, type: z.literal("services"), data: blockDataSchemas.services }),
  z.object({ ...blockBase, type: z.literal("document"), data: blockDataSchemas.document }),
  z.object({ ...blockBase, type: z.literal("reviews"), data: blockDataSchemas.reviews }),
  z.object({ ...blockBase, type: z.literal("location"), data: blockDataSchemas.location }),
  z.object({ ...blockBase, type: z.literal("upi"), data: blockDataSchemas.upi }),
  z.object({ ...blockBase, type: z.literal("text"), data: blockDataSchemas.text }),
]);

export type BlockInput = z.infer<typeof blockInputSchema>;

/** Reads a stored block back through its schema so renderers never see malformed JSON. */
export function parseStoredBlock(row: {
  id: string;
  type: BlockType;
  title: string | null;
  isVisible: boolean;
  data: unknown;
}): BlockInput | null {
  const parsed = blockInputSchema.safeParse({
    id: row.id,
    type: row.type,
    title: row.title ?? undefined,
    isVisible: row.isVisible,
    data: row.data,
  });
  return parsed.success ? parsed.data : null;
}

export function youtubeId(input: string): string | null {
  try {
    const parsed = new URL(input);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
      return match ? match[1] : null;
    }
  } catch {
    return null;
  }
  return null;
}
