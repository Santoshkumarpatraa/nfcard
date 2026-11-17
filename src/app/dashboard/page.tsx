import Link from "next/link";
import QRCode from "qrcode";
import { Suspense } from "react";
import { setPublished } from "@/app/dashboard/actions";
import { ActionButton } from "@/components/dashboard/action-button";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader, Skeleton, buttonClass } from "@/components/ui";
import { ensureProfile, getProfileStats, getUserCards } from "@/data/owner";
import { requireVerifiedUser } from "@/lib/session";
import { absoluteUrl } from "@/lib/site";

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4">
          <Skeleton className="h-16" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      }
    >
      <Overview />
    </Suspense>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value.toLocaleString("en-IN")}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </Card>
  );
}

async function Overview() {
  const session = await requireVerifiedUser("/dashboard");
  const profile = await ensureProfile(session.user.id, session.user.name);
  const [stats, cards] = await Promise.all([getProfileStats(profile.id), getUserCards(session.user.id)]);

  if (!session.user.username) {
    return (
      <>
        <PageHeader title={`Hi, ${session.user.name.split(" ")[0]}`} />
        <Card className="p-6">
          <h2 className="font-medium">Choose your username</h2>
          <p className="mt-1 text-sm text-ink-500">Your username is your profile link. Pick one to get your QR code and publish.</p>
          <Link href="/dashboard/settings" className={buttonClass("primary", "mt-4")}>
            Choose username
          </Link>
        </Card>
      </>
    );
  }

  const profileUrl = absoluteUrl(`/${session.user.username}`);
  const qrSvg = await QRCode.toString(`${profileUrl}?s=qr`, { type: "svg", margin: 1, width: 168 });
  const peak = Math.max(1, ...stats.series.map((point) => point.value));

  const checklist = [
    { done: Boolean(profile.avatarKey), label: "Add a profile photo", href: "/dashboard/profile" },
    { done: Boolean(profile.headline || profile.bio), label: "Add your title and bio", href: "/dashboard/profile" },
    { done: session.user.emailVerified, label: "Verify your email for lead alerts", href: "/verify?next=/dashboard" },
    { done: cards.length > 0, label: "Activate or order a card", href: cards.length ? "/dashboard/cards" : "/shop" },
    { done: profile.isPublished, label: "Publish your profile", href: "#publish" },
  ];
  const pending = checklist.filter((item) => !item.done);

  return (
    <>
      <PageHeader
        title={`Hi, ${session.user.name.split(" ")[0]}`}
        description="Your profile performance over the last 30 days."
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/profile" className={buttonClass("secondary")}>
              Edit profile
            </Link>
            {profile.isPublished ? (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
                View live <Icon name="arrowUpRight" size={16} />
              </a>
            ) : null}
          </div>
        }
      />

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5" >
        <div id="publish" className="flex items-center gap-3">
          <Badge tone={profile.isPublished ? "green" : "amber"}>{profile.isPublished ? "Live" : "Hidden"}</Badge>
          <p className="text-sm text-ink-600">
            {profile.isPublished ? (
              <>
                Your profile is live at <span className="font-medium text-ink-950">{profileUrl.replace(/^https?:\/\//, "")}</span>
              </>
            ) : (
              "Your profile is hidden. Taps show a 'coming soon' page until you publish."
            )}
          </p>
        </div>
        <ActionButton
          action={setPublished.bind(null, !profile.isPublished)}
          variant={profile.isPublished ? "secondary" : "primary"}
        >
          {profile.isPublished ? "Unpublish" : "Publish profile"}
        </ActionButton>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Profile views" value={stats.totals.view} hint={`${stats.sources.nfc} from card taps`} />
        <Stat label="Contacts saved" value={stats.totals.save_contact} />
        <Stat label="Leads received" value={stats.totals.lead} />
        <Stat label="Link clicks" value={stats.totals.link_click} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Daily views</h2>
            <div className="flex gap-3 text-xs text-ink-500">
              <span>Tap {stats.sources.nfc}</span>
              <span>QR {stats.sources.qr}</span>
              <span>Link {stats.sources.link}</span>
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-[3px]" role="img" aria-label="Daily profile views for 30 days">
            {stats.series.map((point) => (
              <div key={point.day} className="group relative flex-1">
                <div
                  className="w-full rounded-t-[3px] bg-ink-900 transition group-hover:bg-gold-500"
                  style={{ height: `${Math.max(2, (point.value / peak) * 176)}px` }}
                />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-ink-950 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white group-hover:block">
                  {point.value} on {point.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-ink-500">
            <span>{stats.series[0]?.day.slice(5)}</span>
            <span>Today</span>
          </div>

          {stats.topLinks.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-medium">Most clicked</h3>
              <ul className="mt-3 divide-y divide-ink-100">
                {stats.topLinks.map((link) => (
                  <li key={link.target ?? "unknown"} className="flex justify-between gap-4 py-2 text-sm">
                    <span className="truncate text-ink-600">{link.target ?? "Unknown"}</span>
                    <span className="font-medium">{link.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-medium">Profile QR code</h2>
            <p className="mt-1 text-xs text-ink-500">For your desk, slides or email signature.</p>
            <div className="mt-4 flex justify-center rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <a
              href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
              download={`${session.user.username}-qr.svg`}
              className={buttonClass("secondary", "mt-4 w-full")}
            >
              Download SVG
            </a>
          </Card>

          {pending.length > 0 ? (
            <Card className="p-5">
              <h2 className="font-medium">Finish setting up</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {checklist.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="flex items-center gap-2.5 text-sm">
                      <span
                        className={`flex size-5 items-center justify-center rounded-full ${
                          item.done ? "bg-emerald-600 text-white" : "border border-ink-300"
                        }`}
                      >
                        {item.done ? <Icon name="check" size={12} strokeWidth={3} /> : null}
                      </span>
                      <span className={item.done ? "text-ink-500 line-through" : "text-ink-800"}>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
