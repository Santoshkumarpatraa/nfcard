import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActivateCardForm } from "@/app/dashboard/cards/activate-form";
import { CardRender } from "@/components/marketing/card-render";
import { Skeleton } from "@/components/ui";
import { normaliseCardCode } from "@/lib/card-code";
import { requireVerifiedUser } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Activate card", robots: { index: false } };

export default function ActivatePage({ params }: PageProps<"/activate/[code]">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-50 px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-2xl">
          {site.name}
        </Link>
        <CardRender finish="black" name="Your card" title="Ready to activate" className="mt-8 w-full" />
        <Suspense fallback={<Skeleton className="mt-8 h-40" />}>
          <Activate params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Activate({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normaliseCardCode(raw);
  const session = await requireVerifiedUser(`/activate/${code}`);

  return (
    <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-6">
      <h1 className="text-xl font-semibold tracking-tight">Link this card to @{session.user.username}</h1>
      <p className="mt-1 text-sm text-ink-500">
        Card code <span className="font-mono font-semibold text-ink-900">{code}</span>. After activation, a tap opens your profile.
      </p>
      <ActivateCardForm defaultCode={code} successHref="/dashboard/cards" />
      <Link href="/dashboard/cards" className="mt-6 block text-sm text-ink-500 hover:text-ink-900">
        Go to my cards
      </Link>
    </div>
  );
}
