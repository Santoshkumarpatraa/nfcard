"use client";

import { useEffect } from "react";

function send(body: Record<string, string | undefined>) {
  const payload = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.("/api/e", new Blob([payload], { type: "application/json" }))) return;
  } catch {
    // Some browsers throw on sendBeacon in restricted contexts; the fetch below covers them.
  }
  fetch("/api/e", { method: "POST", body: payload, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => undefined);
}

/** Records a profile view and tracked clicks, whether the page came from the server or a client-side navigation. */
export function ProfileTracker({ profileId, cardId }: { profileId: string; cardId?: string }) {
  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("s") === "qr" ? "qr" : cardId ? "nfc" : "link";
    const track = (type: string, target?: string) => send({ p: profileId, c: cardId, t: type, s: source, x: target });
    track("view");
    const onClick = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest("[data-track]") : null;
      if (element) track(element.getAttribute("data-track") ?? "", element.getAttribute("data-target") ?? element.getAttribute("href") ?? undefined);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [profileId, cardId]);
  return null;
}
