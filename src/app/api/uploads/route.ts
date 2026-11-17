import { z } from "zod";
import { auth } from "@/lib/auth";
import { processImage, storeDocument } from "@/lib/images";
import { BodyTooLargeError, readFormDataLimited } from "@/lib/request";

const kindSchema = z.enum(["avatar", "cover", "gallery", "logo", "document"]);
const MAX_BODY_BYTES = 11 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please sign in again" }, { status: 401 });
  if (!session.user.phoneNumberVerified) {
    return Response.json({ error: "Verify your phone number before uploading" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await readFormDataLimited(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return Response.json({ error: "Files must be 10 MB or smaller" }, { status: 413 });
    return Response.json({ error: "Could not read the upload" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = kindSchema.safeParse(form.get("kind"));
  if (!(file instanceof File) || !kind.success) {
    return Response.json({ error: "Choose a file to upload" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    if (kind.data === "document") {
      const key = await storeDocument(buffer, file.name);
      return Response.json({ key });
    }
    const image = await processImage(buffer, kind.data);
    return Response.json(image);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
