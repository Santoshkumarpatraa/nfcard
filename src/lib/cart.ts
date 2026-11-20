"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  finish: string;
  pricePaise: number;
  quantity: number;
  nameOnCard: string;
  titleOnCard?: string;
  logoKey?: string;
  logoName?: string;
  notes?: string;
};

const KEY = "nfcard.cart.v1";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function isCartItem(value: unknown): value is CartItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "variantId" in value &&
    typeof value.variantId === "string" &&
    "quantity" in value &&
    typeof value.quantity === "number"
  );
}

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.items;
  let items: CartItem[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    items = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY;
  } catch {
    items = EMPTY;
  }
  cache = { raw, items };
  return items;
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage can be unavailable in private mode; the cart then lives only for this page view.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalPaise: items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0),
    add: (item: Omit<CartItem, "id">) => write([...read(), { ...item, id: crypto.randomUUID() }]),
    update: (id: string, patch: Partial<CartItem>) =>
      write(read().map((item) => (item.id === id ? { ...item, ...patch } : item))),
    remove: (id: string) => write(read().filter((item) => item.id !== id)),
    clear: () => write([]),
  };
}
