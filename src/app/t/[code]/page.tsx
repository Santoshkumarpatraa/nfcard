import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProfileView } from "@/components/profile/profile-view";
import { getCardTarget } from "@/data/public-profile";
import { isCardCode, normaliseCardCode } from "@/lib/card-code";
import { imageUrl } from "@/lib/media";
import { profileQrSvg } from "@/lib/profile-qr";
import { absoluteUrl, site } from "@/lib/site";

// This is the URL written to every NFC chip. Rendered statically per card, refreshed on change.
export const ensureStatic = "navigation";
// Entry pages opened from taps and links; prefetch-instant validation does not apply, the full page is static.
export const instant = false;

export function generateStaticParams() {
  return [{ code: "_" }];
}

async function load(params: Promise<{ code: string }>) {
  const { code: raw } = await params;
  const code = normaliseCardCode(raw);
  if (!isCardCode(code)) return null;
  const target = await getCardTarget(code);
  return target ? { code, target } : null;
}

export async function generateMetadata({ params }: PageProps<"/t/[code]">): Promise<Metadata> {
  const loaded = await load(params);
  if (loaded?.target.status === "active" && loaded.target.profile) {
    const profile = loaded.target.profile;
    const description = [profile.headline, profile.company].filter(Boolean).join(" at ") || undefined;
    const image = profile.avatarKey ? absoluteUrl(imageUrl(profile.avatarKey, 384)) : undefined;
    return {
      title: profile.displayName,
      description,
      alternates: { canonical: absoluteUrl(`/${profile.username}`) },
      robots: { index: false },
      openGraph: {
        type: "profile",
        url: absoluteUrl(`/${profile.username}`),
        title: profile.displayName,
        description,
        images: image ? [{ url: image, width: 384, height: 384 }] : undefined,
      },
    };
  }
  return { title: `${site.name} card`, robots: { index: false } };
}

function Notice({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-950 px-6 text-ink-50">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gold-300">
          <Icon name="nfc" size={26} />
        </div>
        <h1 className="mt-6 font-display text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-300">{body}</p>
        {children}
      </div>
    </main>
  );
}

export default async function CardPage({ params }: PageProps<"/t/[code]">) {
  const loaded = await load(params);
  if (!loaded) notFound();
  const { code, target } = loaded;

  if (target.status === "active" && target.profile) {
    return <ProfileView profile={target.profile} cardId={target.cardId} qrSvg={await profileQrSvg(target.profile.username)} />;
  }

  if (target.status === "active") {
    return (
      <Notice
        title="Profile coming soon"
        body="The owner of this card has not published their profile yet. Please check back shortly."
      />
    );
  }

  if (target.status === "disabled") {
    return (
      <Notice
        title="Card inactive"
        body="This card has been deactivated by its owner. If you found it, it may have been reported lost."
      />
    );
  }

  return (
    <Notice
      title="Activate your card"
      body="This card is ready. Sign in or create an account to link it to your profile. It takes under a minute."
    >
      <Link
        href={`/activate/${code}`}
        prefetch={false}
        className="mt-8 flex items-center justify-center gap-2 rounded-full bg-gold-300 px-6 py-3.5 text-sm font-semibold text-ink-950"
      >
        Activate card <Icon name="arrowRight" size={16} />
      </Link>
    </Notice>
  );
}
