import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { ensureProfile, getProfileBlocks } from "@/data/owner";
import { formatPlanDate, isPremium } from "@/lib/premium";
import { requireVerifiedUser } from "@/lib/session";
import { ProfileEditor } from "./editor";

export const metadata: Metadata = { title: "Edit profile" };

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-[600px]" />
          <Skeleton className="hidden h-[600px] lg:block" />
        </div>
      }
    >
      <EditorLoader />
    </Suspense>
  );
}

async function EditorLoader() {
  const session = await requireVerifiedUser("/dashboard/profile");
  const profile = await ensureProfile(session.user.id, session.user.name);
  const blocks = await getProfileBlocks(profile.id);

  return (
    <ProfileEditor
      profileId={profile.id}
      username={session.user.username ?? ""}
      isPublished={profile.isPublished}
      verifiedPhone={session.user.phoneNumber ?? null}
      premiumNotice={
        isPremium(profile.premiumUntil)
          ? null
          : profile.premiumUntil
            ? `Premium ended on ${formatPlanDate(profile.premiumUntil)}. Your sections and theme are saved, but hidden on your public page until you renew.`
            : "Sections and custom themes are part of Premium. You can set them up now; they show on your public page while Premium is active."
      }
      initialProfile={{
        displayName: profile.displayName,
        headline: profile.headline ?? "",
        company: profile.company ?? "",
        bio: profile.bio ?? "",
        contactPhone: profile.contactPhone ?? "",
        contactEmail: profile.contactEmail ?? "",
        whatsapp: profile.whatsapp ?? "",
        website: profile.website ?? "",
        address: profile.address ?? "",
        avatarKey: profile.avatarKey,
        coverKey: profile.coverKey,
        theme: profile.theme,
        accent: profile.accent ?? "",
      }}
      initialBlocks={blocks}
    />
  );
}
