import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

const LOCAL_ROOT = path.join(process.cwd(), ".uploads");
const IMMUTABLE = "public, max-age=31536000, immutable";

let s3: S3Client | null = null;

function s3Client(): { client: S3Client; bucket: string } {
  const { endpoint, region, bucket, accessKeyId, secretAccessKey } = env.storage;
  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error("S3 storage is not configured");
  s3 ??= new S3Client({ endpoint, region, credentials: { accessKeyId, secretAccessKey } });
  return { client: s3, bucket };
}

export function localPath(key: string): string | null {
  const resolved = path.resolve(LOCAL_ROOT, key);
  return resolved.startsWith(LOCAL_ROOT + path.sep) ? resolved : null;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (env.storage.driver === "local") {
    const target = localPath(key);
    if (!target) throw new Error("Invalid storage key");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return;
  }

  const { client, bucket } = s3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: IMMUTABLE,
    }),
  );
}

export async function getObject(key: string): Promise<Buffer | null> {
  try {
    if (env.storage.driver === "local") {
      const target = localPath(key);
      return target ? await readFile(target) : null;
    }
    const { client, bucket } = s3Client();
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) return null;
    return Buffer.from(await result.Body.transformToByteArray());
  } catch {
    return null;
  }
}
