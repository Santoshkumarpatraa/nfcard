import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { env } from "@/lib/env";
import { IMAGE_SIZES, type ImageKind } from "@/lib/media";
import { putObject } from "@/lib/storage";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;

const ASPECT: Partial<Record<ImageKind, number>> = {
  avatar: 1,
  cover: 3,
};

export type ProcessedImage = { key: string; width: number; height: number };

/** Resizes once at upload into fixed WebP widths (plus a vCard JPEG for avatars), so pages never optimise at request time. */
export async function processImage(input: Buffer, kind: ImageKind): Promise<ProcessedImage> {
  if (input.byteLength > MAX_INPUT_BYTES) throw new Error("Image must be 8 MB or smaller");

  const source = sharp(input, { failOn: "error" }).rotate();
  const meta = await source.metadata();
  if (!meta.width || !meta.height) throw new Error("Unsupported image");

  const hash = createHash("sha256").update(input).digest("hex").slice(0, 20);
  const key = `${kind}/${hash}`;
  const aspect = ASPECT[kind];
  const widths = IMAGE_SIZES[kind];
  const largest = widths[widths.length - 1];

  const outWidth = Math.min(largest, meta.width);
  const outHeight = aspect ? Math.round(outWidth / aspect) : Math.round((meta.height / meta.width) * outWidth);

  await Promise.all(
    widths.map(async (width) => {
      const height = aspect ? Math.round(width / aspect) : undefined;
      const buffer = await source
        .clone()
        .resize({ width, height, fit: aspect ? "cover" : "inside", withoutEnlargement: !aspect })
        .webp({ quality: 78 })
        .toBuffer();
      await putObject(`${key}-${width}.webp`, buffer, "image/webp");
    }),
  );

  if (kind === "avatar") {
    const jpeg = await source
      .clone()
      .resize({ width: 256, height: 256, fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    await putObject(`${key}-vcard.jpg`, jpeg, "image/jpeg");
  }

  return { key, width: outWidth, height: outHeight };
}

// Customer logos are kept byte-for-byte for print quality; SVG is refused because it can carry scripts.
const DESIGN_SIGNATURES: { ext: string; type: string; magic: number[] }[] = [
  { ext: "png", type: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { ext: "jpg", type: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  { ext: "pdf", type: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46, 0x2d] },
];

export const DESIGN_KEY_PATTERN = /^design\/[0-9a-f]{20}\.(png|jpg|pdf)$/;

export async function storeDesign(input: Buffer): Promise<string> {
  if (input.byteLength > 4 * 1024 * 1024) throw new Error("Logo files must be 4 MB or smaller");
  const match = DESIGN_SIGNATURES.find(({ magic }) => magic.every((byte, i) => input[i] === byte));
  if (!match) throw new Error("Upload your logo as PNG, JPG or PDF");
  const key = `design/${createHash("sha256").update(input).digest("hex").slice(0, 20)}.${match.ext}`;
  await putObject(key, input, match.type);
  return key;
}

export async function storeDocument(input: Buffer, filename: string): Promise<string> {
  // Database-stored files are served through a function, which caps responses at about 4 MB.
  const maxMb = env.storage.driver === "db" ? 4 : 10;
  if (input.byteLength > maxMb * 1024 * 1024) throw new Error(`Documents must be ${maxMb} MB or smaller`);
  if (input.subarray(0, 5).toString("latin1") !== "%PDF-") throw new Error("Only PDF files are allowed");

  const hash = createHash("sha256").update(input).digest("hex").slice(0, 20);
  const safeName = filename
    .toLowerCase()
    .replace(/\.pdf$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const key = `doc/${hash}/${safeName || "document"}.pdf`;
  await putObject(key, input, "application/pdf");
  return key;
}
