"use client";

import { Icon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ withLabel = false }: { withLabel?: boolean }) {
  return (
    <button
      type="button"
      aria-label="Sign out"
      onClick={async () => {
        await authClient.signOut();
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full page load drops in-memory pages holding account data
        window.location.assign("/");
      }}
      className="inline-flex items-center gap-2 rounded-lg p-2 text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-900"
    >
      <Icon name="logout" size={17} />
      {withLabel ? "Sign out" : null}
    </button>
  );
}
