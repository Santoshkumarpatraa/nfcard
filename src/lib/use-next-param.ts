"use client";

import { useSyncExternalStore } from "react";
import { safeNext } from "@/lib/safe-redirect";

const subscribe = () => () => {};

/** Reads the post-login `next` path without useSearchParams, so auth pages prerender their full form into static HTML. */
export function useNextParam(fallback = "/dashboard"): string {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return safeNext(new URLSearchParams(search).get("next"), fallback);
}
