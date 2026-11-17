import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { getPublicProfileByUsername } from "@/data/public-profile";
import { imageUrl } from "@/lib/media";
import { absoluteUrl } from "@/lib/site";
import { normaliseUsername, usernameProblem } from "@/lib/username";

// Fully static: the first visit renders once, later taps come from cache until the owner saves a change.
export const ensureStatic = "navigation";
// Entry pages opened from taps and links; prefetch-instant validation does not apply, the full page is static.
export const instant = false;

// Required by ensureStatic. A placeholder keeps the build independent of database contents.
export function generateStaticParams() {
  return [{ username: "_" }];
}

async function loadProfile(params: Promise<{ username: string }>) {
  const { username: raw } = await params;
  const username = normaliseUsername(decodeURIComponent(raw));
  if (usernameProblem(username)) return null;
  return getPublicProfileByUsername(username);
}

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const profile = await loadProfile(params);
  if (!profile) return { title: "Profile not found" };

  const description =
    [profile.headline, profile.company].filter(Boolean).join(" at ") || profile.bio?.slice(0, 160) || undefined;
  const url = absoluteUrl(`/${profile.username}`);
  const image = profile.avatarKey ? absoluteUrl(imageUrl(profile.avatarKey, 384)) : undefined;

  return {
    title: profile.displayName,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title: profile.displayName,
      description,
      images: image ? [{ url: image, width: 384, height: 384 }] : undefined,
    },
    twitter: { card: "summary", title: profile.displayName, description, images: image ? [image] : undefined },
  };
}

export default async function ProfilePage({ params }: PageProps<"/[username]">) {
  const profile = await loadProfile(params);
  if (!profile) notFound();
  return <ProfileView profile={profile} />;
}
