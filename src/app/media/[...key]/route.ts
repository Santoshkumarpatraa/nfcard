import { env } from "@/lib/env";
import { contentTypeFor, getObject } from "@/lib/storage";

// Serves files for the local and db storage drivers; with S3/R2 the bucket's CDN serves media instead.
export async function GET(_request: Request, { params }: RouteContext<"/media/[...key]">) {
  if (env.storage.driver === "s3") return new Response("Not found", { status: 404 });

  const { key } = await params;
  const path = key.join("/");
  if (!/^[a-z]+\/[\w./-]+$/.test(path) || path.includes("..")) return new Response("Not found", { status: 404 });

  const body = await getObject(path);
  if (!body) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": contentTypeFor(path),
      // Keys are content hashes, so the CDN and browsers may keep them forever.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
