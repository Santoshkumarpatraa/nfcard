import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">About</p>
      <h1 className="mt-4 font-display text-6xl leading-tight text-ink-50">First impressions, made to last.</h1>
      <div className="mt-8 flex flex-col gap-5 text-lg leading-relaxed text-ink-300">
        <p>
          Paper business cards get lost, go out of date and end up in the bin. {site.name} replaces them with one
          premium card and a profile you control, so every introduction turns into a real connection.
        </p>
        <p>
          We design for how India does business: WhatsApp first, UPI built in, and pricing in rupees with no
          subscription. Every card is made to order and checked by hand before it ships.
        </p>
      </div>
    </div>
  );
}
