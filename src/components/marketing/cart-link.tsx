"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { useCart } from "@/lib/cart";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" aria-label={`Cart, ${count} items`} className="relative flex size-11 items-center justify-center rounded-full text-ink-200 hover:text-white">
      <Icon name="cart" size={21} />
      {count > 0 ? (
        <span className="absolute top-0.5 right-0.5 flex size-4.5 items-center justify-center rounded-full bg-gold-300 text-[10px] font-bold text-ink-950">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
