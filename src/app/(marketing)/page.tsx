import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { CardRender, type Finish } from "@/components/marketing/card-render";
import { IPhoneFrame } from "@/components/profile/iphone-frame";
import { PhonePreview } from "@/components/profile/phone-preview";
import { ProfileView } from "@/components/profile/profile-view";
import { getCatalog } from "@/data/products";
import { showcaseProfile } from "@/lib/demo-profile";
import { formatInr } from "@/lib/money";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} - Premium metal NFC business cards in India` },
  description: site.description,
};

const PROFILE_FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "userPlus", title: "Save contact", body: "Your photo, numbers and email straight into their phone book." },
  { icon: "exchange", title: "Two-way exchange", body: "They share their details back. Leads land in your dashboard and inbox." },
  { icon: "whatsapp", title: "WhatsApp first", body: "One-tap chat, call and email buttons built for how India does business." },
  { icon: "rupee", title: "Services and UPI", body: "List what you offer with prices, and take payments with any UPI app." },
  { icon: "star", title: "Gallery and reviews", body: "Show your work, a video and what customers say about you." },
  { icon: "file", title: "Brochures", body: "Share your catalogue or menu as a PDF, always the latest version." },
];

const FINISHES: { key: string; finish: Finish; name: string; note: string; href: string }[] = [
  { key: "metal-black", finish: "black", name: "Metal Card, Matte Black", note: "Stainless steel, laser engraved name and logo", href: "/shop/metal-card" },
  { key: "pvc-white", finish: "white", name: "PVC Card, White", note: "Your name and logo printed in full colour", href: "/shop/classic-card" },
  { key: "pvc-black", finish: "matte", name: "PVC Card, Black", note: "Full colour print on matte black", href: "/shop/classic-card" },
];

const REASONS: { icon: IconName; title: string; body: string }[] = [
  { icon: "shield", title: "Lost card? Switch it off", body: "Disable a card from your phone in one tap. Your profile stays safe." },
  { icon: "chart", title: "Know what works", body: "See taps, saves, clicks and leads, day by day." },
  { icon: "refresh", title: "Works forever", body: "Your card never stops working. Premium free for 12 months with metal, 6 with PVC." },
  { icon: "truck", title: "Made for India", body: "Prices in rupees, UPI and WhatsApp built in, shipped nationwide." },
];

const AUDIENCES = ["Founders", "Sales teams", "Real estate", "Doctors", "Consultants", "Creators", "Lawyers and CAs", "Event teams"];

const FAQ = [
  {
    q: "Do people need an app to read my card?",
    a: "No. Every modern iPhone and Android phone reads NFC natively. Older phones can scan the QR code on the back.",
  },
  {
    q: "Is there a monthly fee?",
    a: "No. Your card and basic profile (name, photo, contact buttons, save contact) work forever at no cost. Premium, with business sections, themes and analytics, is free for 12 months with a metal card and 6 months with PVC, then renews yearly if you want to keep it.",
  },
  {
    q: "Can I change my details after the card is printed?",
    a: "Yes, as often as you like. The card opens your live profile, so changes show up immediately.",
  },
  {
    q: "What if I lose my card?",
    a: "Disable it from your dashboard and it stops showing your profile. Order a replacement and link it to the same profile.",
  },
  {
    q: "How long does delivery take?",
    a: "Cards are made to order. Most orders ship within 5 to 7 working days after you approve the design proof.",
  },
  {
    q: "Do you do bulk orders for teams?",
    a: "Yes. Talk to us for volume pricing, team branding and centralised ordering.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">{children}</p>;
}

export default async function HomePage() {
  const catalog = await getCatalog();
  const prices = catalog.flatMap((product) => product.variants.map((variant) => variant.pricePaise));
  const fromPrice = prices.length ? Math.min(...prices) : null;

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 75% 30%, rgb(200 169 106 / 0.16), transparent 70%), radial-gradient(40% 40% at 10% 90%, rgb(200 169 106 / 0.06), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-24 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-32">
          <div>
            <Eyebrow>Premium NFC business cards</Eyebrow>
            <h1 className="mt-6 font-display text-[clamp(44px,7vw,84px)] leading-[0.98] tracking-tight text-ink-50">
              Your whole business,
              <br />
              <span className="text-gold-300 italic">in one tap.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink-300">
              A premium metal or PVC card that opens your living profile on any phone. Contact, WhatsApp, services,
              payments and more. Always up to date.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-gold-300 px-7 py-3.5 text-[15px] font-semibold text-ink-950 transition hover:bg-gold-200"
              >
                Shop cards <Icon name="arrowRight" size={16} />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-[15px] font-medium text-ink-100 transition hover:border-white/40"
              >
                See a live profile
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-400">
              {["No app needed", "iPhone and Android", "Premium free for up to a year"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Icon name="check" size={15} className="text-gold-300" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto h-[360px] w-full max-w-[520px] sm:h-[420px]">
            <div className="float-slow absolute top-6 right-0 w-[78%] [--r:8deg]">
              <CardRender finish="white" name="Ishita Rao" title="Partner, Rao and Co." />
            </div>
            <div className="float-slow absolute bottom-6 left-0 w-[78%] [--r:-6deg] [animation-delay:-3.5s]">
              <CardRender finish="black" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:gap-16 sm:px-8 sm:py-24 lg:grid-cols-[400px_1fr]">
        <div className="mx-auto w-full max-w-[360px]">
          <IPhoneFrame className="h-[700px]">
            <PhonePreview>
              <ProfileView profile={showcaseProfile} preview />
            </PhonePreview>
          </IPhoneFrame>
        </div>
        <div>
          <Eyebrow>What opens on tap</Eyebrow>
          <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-ink-50 sm:text-5xl">
            Not a link. A mini website that sells for you.
          </h2>
          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8">
            {PROFILE_FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4 sm:block">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gold-300">
                  <Icon name={feature.icon} size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-ink-50 sm:mt-4">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-400 sm:mt-1.5">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Materials</Eyebrow>
              <h2 className="mt-4 font-display text-5xl text-ink-50">Metal or PVC. Made yours.</h2>
            </div>
            <Link href="/shop#compare" className="inline-flex items-center gap-2 text-sm font-medium text-gold-300">
              Compare cards <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FINISHES.map((item) => (
              <Link key={item.key} href={item.href} className="group">
                <CardRender finish={item.finish} className="transition duration-500 group-hover:-translate-y-1.5" />
                <p className="mt-5 font-medium text-ink-50">{item.name}</p>
                <p className="mt-0.5 text-sm text-ink-400">{item.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <div key={reason.title} className="bg-ink-950 p-8">
              <Icon name={reason.icon} size={22} className="text-gold-300" />
              <h3 className="mt-5 font-medium text-ink-50">{reason.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{reason.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center sm:mt-20">
          <Eyebrow>Built for</Eyebrow>
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {AUDIENCES.map((audience) => (
              <span key={audience} className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-200">
                {audience}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(50% 80% at 50% 0%, rgb(200 169 106 / 0.14), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-4 font-display text-5xl text-ink-50 sm:text-6xl">Buy once. Works forever.</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-ink-300">
            {fromPrice !== null ? `Cards from ${formatInr(fromPrice)}. ` : ""}Your card and contact profile never stop working.
            Premium sections, themes and analytics are free for 12 months with metal, 6 with PVC.
          </p>
          <Link
            href="/shop"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-gold-300 px-8 py-4 text-[15px] font-semibold text-ink-950 transition hover:bg-gold-200"
          >
            Choose your card <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </section>

      <section id="faq" className="mx-auto scroll-mt-28 max-w-3xl px-5 pt-16 pb-12 sm:px-8 sm:py-24">
        <Eyebrow>Questions</Eyebrow>
        <h2 className="mt-4 font-display text-5xl text-ink-50">Good to know</h2>
        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg text-ink-50">
                {item.q}
                <Icon name="plus" size={18} className="shrink-0 text-gold-300 transition group-open:rotate-45" />
              </summary>
              <p className="mt-3 leading-relaxed text-ink-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
