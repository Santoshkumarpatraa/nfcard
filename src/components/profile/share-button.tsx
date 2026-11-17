"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full border border-p-border px-4 py-2 text-sm font-medium"
    >
      <Icon name={copied ? "check" : "share"} size={16} />
      {copied ? "Link copied" : "Share profile"}
    </button>
  );
}
