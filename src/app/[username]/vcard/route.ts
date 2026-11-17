import { getPublicProfileByUsername } from "@/data/public-profile";
import { getObject } from "@/lib/storage";
import { absoluteUrl } from "@/lib/site";
import { normaliseUsername, usernameProblem } from "@/lib/username";
import { buildVCard } from "@/lib/vcard";

export async function GET(_request: Request, { params }: RouteContext<"/[username]/vcard">) {
  const { username: raw } = await params;
  const username = normaliseUsername(decodeURIComponent(raw));
  if (usernameProblem(username)) return new Response("Not found", { status: 404 });

  const profile = await getPublicProfileByUsername(username);
  if (!profile) return new Response("Not found", { status: 404 });

  const photo = profile.avatarKey ? await getObject(`${profile.avatarKey}-vcard.jpg`) : null;
  const body = buildVCard(profile, absoluteUrl(`/${profile.username}`), photo?.toString("base64"));
  const filename = profile.displayName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || profile.username;

  return new Response(body, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.vcf"`,
      "Cache-Control": "no-cache",
    },
  });
}
