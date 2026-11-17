import type { PublicProfile } from "@/data/public-profile";

function escape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** vCard 3.0 is the version both iOS Contacts and Android import without prompting about format. */
export function buildVCard(profile: PublicProfile, profileUrl: string, photoBase64?: string): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const [first, ...rest] = profile.displayName.trim().split(/\s+/);
  const last = rest.join(" ");

  lines.push(`N:${escape(last)};${escape(first ?? "")};;;`);
  lines.push(`FN:${escape(profile.displayName)}`);
  if (profile.company) lines.push(`ORG:${escape(profile.company)}`);
  if (profile.headline) lines.push(`TITLE:${escape(profile.headline)}`);
  if (profile.contactPhone) lines.push(`TEL;TYPE=CELL,VOICE:${profile.contactPhone}`);
  if (profile.whatsapp && profile.whatsapp !== profile.contactPhone)
    lines.push(`TEL;TYPE=CELL:${profile.whatsapp}`);
  if (profile.contactEmail) lines.push(`EMAIL;TYPE=INTERNET:${profile.contactEmail}`);
  if (profile.website) lines.push(`URL:${profile.website}`);
  lines.push(`URL:${profileUrl}`);
  if (profile.address) lines.push(`ADR;TYPE=WORK:;;${escape(profile.address)};;;;`);
  if (profile.bio) lines.push(`NOTE:${escape(profile.bio)}`);
  if (photoBase64) lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}`);
  lines.push("END:VCARD");

  return lines.join("\r\n") + "\r\n";
}
