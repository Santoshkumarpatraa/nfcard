import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { getSession } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "chart" },
  { href: "/dashboard/profile", label: "Profile", icon: "user" },
  { href: "/dashboard/leads", label: "Leads", icon: "users" },
  { href: "/dashboard/cards", label: "Cards", icon: "card" },
  { href: "/dashboard/orders", label: "Orders", icon: "bag" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

async function AccountBadge() {
  const session = await getSession();
  if (!session) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{session.user.name}</p>
        <p className="truncate text-xs text-ink-500">@{session.user.username}</p>
      </div>
      <SignOutButton />
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-dvh bg-ink-50 text-ink-950 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="z-20 border-b border-ink-200 bg-ink-50/95 backdrop-blur lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-4 px-4 py-4 lg:px-5 lg:py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-display text-2xl">
              {site.name}
            </Link>
            <Link href="/shop" className="text-xs font-medium text-ink-500 hover:text-ink-900 lg:hidden">
              Shop
            </Link>
          </div>
          <DashboardNav items={NAV} />
          <div className="mt-auto hidden lg:block">
            <Suspense>
              <AccountBadge />
            </Suspense>
          </div>
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-5 py-8 lg:px-10">{children}</main>
    </div>
  );
}
