import "server-only";
import { createHash } from "node:crypto";

/** Client IP from headers our own edge sets; the rightmost X-Forwarded-For entry is added by the trusted proxy, the rest is client-controlled. */
export function clientIp(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || null;
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256")
    .update(`${ip}:${process.env.BETTER_AUTH_SECRET ?? "nfcard"}`)
    .digest("hex")
    .slice(0, 32);
}

export class BodyTooLargeError extends Error {}

/** Reads a multipart body but stops as soon as it exceeds `maxBytes`, so oversized uploads never fill memory. */
export async function readFormDataLimited(request: Request, maxBytes: number): Promise<FormData> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new BodyTooLargeError();
  if (!request.body) return new FormData();

  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    chunks.push(new Uint8Array(value));
  }
  return new Response(new Blob(chunks), {
    headers: { "content-type": request.headers.get("content-type") ?? "" },
  }).formData();
}
