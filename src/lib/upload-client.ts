export type UploadKind = "avatar" | "cover" | "gallery" | "logo" | "document";

export type UploadedImage = { key: string; width: number; height: number };

async function post(file: File, kind: UploadKind): Promise<unknown> {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const response = await fetch("/api/uploads", { method: "POST", body: form });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Upload failed";
    throw new Error(message);
  }
  return body;
}

export async function uploadImage(file: File, kind: Exclude<UploadKind, "document">): Promise<UploadedImage> {
  const body = await post(file, kind);
  if (
    body &&
    typeof body === "object" &&
    "key" in body &&
    "width" in body &&
    "height" in body &&
    typeof body.key === "string" &&
    typeof body.width === "number" &&
    typeof body.height === "number"
  ) {
    return { key: body.key, width: body.width, height: body.height };
  }
  throw new Error("Upload failed");
}

export async function uploadDocument(file: File): Promise<string> {
  const body = await post(file, "document");
  if (body && typeof body === "object" && "key" in body && typeof body.key === "string") return body.key;
  throw new Error("Upload failed");
}
