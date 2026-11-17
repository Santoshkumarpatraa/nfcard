import type { Metadata } from "next";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/nav";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Orders", icon: "bag" },
  { href: "/admin/cards", label: "Cards", icon: "card" },
  { href: "/admin/products", label: "Products", icon: "settings" },
  { href: "/dashboard", label: "My dashboard", icon: "user" },
] as const;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-ink-50 text-ink-950 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="z-20 border-b border-ink-200 bg-ink-50/95 backdrop-blur lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-4 px-4 py-4 lg:px-5 lg:py-6">
          <Link href="/" className="font-display text-2xl">
            {site.name} <span className="font-sans text-xs font-medium tracking-wider text-ink-500 uppercase">Admin</span>
          </Link>
          <DashboardNav items={NAV} />
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-5 py-8 lg:px-10">{children}</main>
    </div>
  );
}
