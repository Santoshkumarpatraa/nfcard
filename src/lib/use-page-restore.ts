"use client";

import { useEffect, useRef } from "react";

/** Runs `onRestore` when the browser restores this page from its back/forward cache with UI frozen mid-submit. */
export function useOnPageRestore(onRestore: () => void) {
  const latest = useRef(onRestore);
  useEffect(() => {
    latest.current = onRestore;
  });
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) latest.current();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
}
