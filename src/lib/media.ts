// Images are stored once per size as `<base>-<width>.webp` under content-hash keys, so every URL is immutable.
export const IMAGE_SIZES = {
  avatar: [192, 384],
  cover: [720, 1440],
  gallery: [480, 1080],
  logo: [256, 512],
} as const;

export type ImageKind = keyof typeof IMAGE_SIZES;

// `||` on purpose: an empty value (as shipped in .env.example) must fall back to the local route.
const publicBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "/media";

// A stored key may also be a full https link to an image hosted elsewhere; it is used as-is, in one size.
function isExternal(key: string): boolean {
  return key.startsWith("https://");
}

export function mediaUrl(key: string): string {
  if (isExternal(key)) return key;
  return `${publicBase.replace(/\/$/, "")}/${key}`;
}

export function imageUrl(baseKey: string, width: number): string {
  if (isExternal(baseKey)) return baseKey;
  return mediaUrl(`${baseKey}-${width}.webp`);
}

export function imageSrcSet(baseKey: string, kind: ImageKind): string | undefined {
  if (isExternal(baseKey)) return undefined;
  return IMAGE_SIZES[kind].map((width) => `${imageUrl(baseKey, width)} ${width}w`).join(", ");
}
