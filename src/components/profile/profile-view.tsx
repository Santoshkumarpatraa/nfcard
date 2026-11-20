import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { ProfileBlock } from "@/components/profile/blocks";
import { ExchangeContact } from "@/components/profile/exchange-contact";
import { ProfileTracker } from "@/components/profile/profile-tracker";
import { ShareButton } from "@/components/profile/share-button";
import type { PublicProfile } from "@/data/public-profile";
import { imageSrcSet, imageUrl } from "@/lib/media";
import { whatsappDigits } from "@/lib/phone";
import { absoluteUrl, site } from "@/lib/site";
import { resolveTheme, themeStyle } from "@/lib/themes";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileView({
  profile,
  cardId,
  preview = false,
  qrSvg,
}: {
  profile: PublicProfile;
  cardId?: string;
  preview?: boolean;
  qrSvg?: string;
}) {
  const theme = resolveTheme(profile.theme, profile.accent);
  const profileUrl = absoluteUrl(`/${profile.username}`);
  const whatsapp = profile.whatsapp ? whatsappDigits(profile.whatsapp) : null;
  const firstName = profile.displayName.split(/\s+/)[0] ?? profile.displayName;

  const quickActions: { icon: IconName; label: string; href: string; external?: boolean }[] = [];
  if (profile.contactPhone) quickActions.push({ icon: "phone", label: "Call", href: `tel:${profile.contactPhone}` });
  if (whatsapp) quickActions.push({ icon: "whatsapp", label: "WhatsApp", href: `https://wa.me/${whatsapp}`, external: true });
  if (profile.contactEmail) quickActions.push({ icon: "mail", label: "Email", href: `mailto:${profile.contactEmail}` });
  if (profile.website) quickActions.push({ icon: "globe", label: "Website", href: profile.website, external: true });

  const subtitle = [profile.headline, profile.company].filter(Boolean).join(" at ");

  return (
    <div style={themeStyle(theme)} className={`${preview ? "min-h-full" : "relative min-h-dvh lg:py-14"} bg-p-bg text-p-text antialiased`}>
      {preview ? null : (
        <div aria-hidden className="pointer-events-none fixed inset-0 hidden overflow-hidden lg:block">
          {profile.coverKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl(profile.coverKey, 720)} alt="" className="size-full scale-110 object-cover opacity-25 blur-3xl" />
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(50% 60% at 15% 10%, color-mix(in oklab, ${theme.accent} 22%, transparent), transparent 70%), radial-gradient(45% 55% at 90% 90%, color-mix(in oklab, ${theme.accent} 14%, transparent), transparent 70%)`,
            }}
          />
        </div>
      )}
      {preview ? null : (
        <Link
          href="/"
          prefetch={false}
          className="fixed top-6 left-8 z-20 hidden items-center gap-2 rounded-full border border-p-border bg-p-surface/70 py-2 pr-4 pl-3 text-sm text-p-muted backdrop-blur-xl transition hover:text-p-text lg:flex"
        >
          <Icon name="arrowRight" size={15} className="rotate-180" />
          <span className="font-display text-lg leading-none tracking-wide text-p-text">{site.name}</span>
        </Link>
      )}
      <div className="relative mx-auto max-w-[480px]">
        <main
          className={`pb-12 ${preview ? "" : "lg:overflow-hidden lg:rounded-[32px] lg:border lg:border-p-border lg:bg-p-bg lg:shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)]"}`}
        >
          <div className="relative">
            {preview ? null : (
              <Link
                href="/"
                prefetch={false}
                aria-label={`${site.name} home`}
                className="absolute top-3 left-3 z-10 flex min-h-9 items-center gap-1.5 rounded-full bg-black/35 px-3 font-display text-[15px] tracking-wide text-white backdrop-blur-md lg:hidden"
              >
                <Icon name="arrowRight" size={13} className="rotate-180" />
                {site.name}
              </Link>
            )}
            {profile.coverKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl(profile.coverKey, 720)}
                srcSet={imageSrcSet(profile.coverKey, "cover")}
                sizes="(max-width: 480px) 100vw, 480px"
                width={720}
                height={240}
                alt=""
                fetchPriority="high"
                className="aspect-[3/1] w-full object-cover"
              />
            ) : (
              <div
                className="aspect-[3/1] w-full"
                style={{
                  background: `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${theme.accent} 35%, transparent), transparent 60%), linear-gradient(135deg, ${theme.surface}, ${theme.bg})`,
                }}
              />
            )}
            <div className="absolute -bottom-12 left-6">
              {profile.avatarKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl(profile.avatarKey, 192)}
                  srcSet={imageSrcSet(profile.avatarKey, "avatar")}
                  sizes="104px"
                  width={104}
                  height={104}
                  alt={profile.displayName}
                  fetchPriority="high"
                  className="size-26 rounded-full border-4 border-p-bg object-cover"
                />
              ) : (
                <div className="flex size-26 items-center justify-center rounded-full border-4 border-p-bg bg-p-accent text-3xl font-semibold text-p-accent-text">
                  {initials(profile.displayName)}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pt-16">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{profile.displayName}</h1>
            {subtitle ? <p className="mt-1 text-[15px] text-p-muted">{subtitle}</p> : null}

            <div className="mt-6 flex gap-2.5">
              <a
                href={`/${profile.username}/vcard`}
                data-track="save_contact"
                className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-p-accent px-3 py-3.5 text-[15px] font-semibold whitespace-nowrap text-p-accent-text"
              >
                <Icon name="userPlus" size={18} /> Save contact
              </a>
              <ExchangeContact profileId={profile.id} cardId={cardId} ownerFirstName={firstName} />
            </div>

            {quickActions.length > 0 ? (
              <div
                className="mt-3 grid gap-2.5"
                style={{ gridTemplateColumns: `repeat(${quickActions.length}, minmax(0, 1fr))` }}
              >
                {quickActions.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    data-track="link_click"
                    data-target={action.label.toLowerCase()}
                    {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    aria-label={action.label}
                    title={action.label}
                    className="flex items-center justify-center rounded-2xl border border-p-border bg-p-surface py-4"
                  >
                    <Icon name={action.icon} size={24} className="text-p-accent" />
                  </a>
                ))}
              </div>
            ) : null}

            {profile.bio ? (
              <p className="mt-7 text-[15px] leading-relaxed whitespace-pre-line text-p-text/90">{profile.bio}</p>
            ) : null}

            {profile.blocks.map((block, index) => (
              <ProfileBlock key={block.id ?? index} block={block} whatsapp={whatsapp} />
            ))}

            <footer className="mt-12 flex flex-col items-center gap-5 border-t border-p-border pt-8">
              <ShareButton url={profileUrl} title={profile.displayName} />
              <Link href="/" prefetch={false} className="text-xs text-p-muted">
                Get your own {site.name} card
              </Link>
            </footer>
          </div>
        </main>
        {qrSvg && !preview ? (
          <aside className="absolute inset-y-0 left-full ml-10 hidden w-52 xl:block">
            <div className="sticky top-14 rounded-3xl border border-p-border bg-p-surface/80 p-5 text-center backdrop-blur-xl">
              <div className="rounded-2xl bg-white p-2.5 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="mt-4 text-sm font-semibold">Open on your phone</p>
              <p className="mt-1 text-xs leading-relaxed text-p-muted">Scan to save {firstName}&apos;s contact and share yours.</p>
            </div>
          </aside>
        ) : null}
      </div>
      {preview ? null : (
        <ProfileTracker profileId={profile.id} cardId={cardId} />
      )}
    </div>
  );
}
