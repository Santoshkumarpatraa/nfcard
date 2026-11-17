"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export function DashboardNav({ items }: { items: readonly { href: string; label: string; icon: IconName }[] }) {
  const pathname = usePathname();
  const root = items[0]?.href;

  return (
    <nav className="grid grid-cols-3 gap-1 lg:flex lg:flex-col">
      {items.map((item) => {
        const active = item.href === root ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-medium transition lg:justify-start lg:gap-2.5 lg:px-3 ${
              active ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-100 hover:text-ink-950"
            }`}
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
