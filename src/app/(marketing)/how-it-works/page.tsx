import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { TapStory } from "./tap-story";

export const metadata: Metadata = {
  title: "How it works",
  description: "See what one tap of an NFC business card does: open your profile, save your contact, capture leads and more.",
};

export default function HowItWorksPage() {
  return (
    <>
      <header className="mx-auto flex min-h-[calc(100svh-108px)] max-w-3xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8 md:min-h-[calc(100svh-64px)]">
        <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">How it works</p>
        <h1 className="mt-5 font-display text-5xl leading-[1.05] text-ink-50 sm:text-7xl">
          One tap.
          <br />
          <span className="text-gold-300 italic">Every connection.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
          From the handshake to the follow-up, see everything your card does in the few seconds after you meet someone.
        </p>
        <div className="mt-14 flex flex-col items-center gap-3 text-sm text-ink-400">
          Scroll to watch
          <span className="flex h-10 w-6 justify-center rounded-full border border-white/20 pt-2">
            <span className="h-2 w-1 animate-bounce rounded-full bg-gold-300" />
          </span>
        </div>
      </header>

      <TapStory />

      <section className="border-t border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
          <h2 className="font-display text-4xl text-ink-50 sm:text-5xl">Your next introduction starts with a tap.</h2>
          <p className="mt-5 text-lg text-ink-300">Metal or PVC, made with your name and logo. Premium included free.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-gold-300 px-7 py-3.5 text-[15px] font-semibold text-ink-950 transition hover:bg-gold-200"
            >
              Choose your card <Icon name="arrowRight" size={16} />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-[15px] text-ink-100 transition hover:border-white/30"
            >
              See a live profile
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
