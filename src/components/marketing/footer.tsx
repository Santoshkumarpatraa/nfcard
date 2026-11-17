import Link from "next/link";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/shop", label: "Shop cards" },
      { href: "/business", label: "For teams" },
      { href: "/demo", label: "Live demo" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/refund", label: "Refunds" },
      { href: "/legal/shipping", label: "Shipping" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 bg-ink-950 text-ink-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-3xl text-ink-50">{site.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">{site.tagline}. Designed in India, shipped across India.</p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-medium tracking-[0.18em] text-ink-400 uppercase">{column.title}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-ink-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-6 text-xs text-ink-400 sm:px-8">
          <span>
            {site.company}. {site.address}
          </span>
          <span>Prices in INR, inclusive of GST.</span>
        </div>
      </div>
    </footer>
  );
}
