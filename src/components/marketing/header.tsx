import Link from "next/link";
import { CartLink } from "@/components/marketing/cart-link";
import { site } from "@/lib/site";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/business", label: "For teams" },
  { href: "/demo", label: "Live demo" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex min-h-11 items-center font-display text-2xl tracking-wide text-ink-50">
          {site.name}
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-ink-300 transition hover:text-ink-50">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="hidden rounded-full px-4 py-2.5 text-sm text-ink-200 hover:text-white sm:block">
            Account
          </Link>
          <CartLink />
          <Link
            href="/shop"
            className="flex min-h-11 items-center rounded-full bg-gold-300 px-4 text-sm font-semibold text-ink-950 transition hover:bg-gold-200"
          >
            Get yours
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-3 [scrollbar-width:none] md:hidden">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="flex min-h-11 shrink-0 items-center px-2.5 text-sm text-ink-300">
            {link.label}
          </Link>
        ))}
        <Link href="/dashboard" className="flex min-h-11 shrink-0 items-center px-2.5 text-sm text-ink-300">
          Account
        </Link>
      </nav>
    </header>
  );
}
