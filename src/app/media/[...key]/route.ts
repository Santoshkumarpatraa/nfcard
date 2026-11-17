import { readFile } from "node:fs/promises";
import { env } from "@/lib/env";
import { localPath } from "@/lib/storage";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  pdf: "application/pdf",
};

// Serves files written by the local storage driver. With S3/R2 the bucket's CDN serves media instead.
export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
  if (env.storage.driver !== "local") return new Response("Not found", { status: 404 });

  const { key } = await params;
  const target = localPath(key.join("/"));
  if (!target) return new Response("Not found", { status: 404 });

  const body = await readFile(target).catch(() => null);
  if (!body) return new Response("Not found", { status: 404 });

  const extension = target.split(".").pop() ?? "";
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": TYPES[extension] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
