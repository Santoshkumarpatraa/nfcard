import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icons";
import { CardRender } from "@/components/marketing/card-render";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "NFC cards for teams",
  description: "Branded NFC business cards for your whole team, with central lead capture.",
};

const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: "card", title: "Your brand on every card", body: "Company logo, colours and finish, consistent across the team." },
  { icon: "users", title: "Leads for every rep", body: "Each person gets a profile and leads straight to their inbox." },
  { icon: "shield", title: "Offboarding in a tap", body: "Disable a departing employee's card instantly." },
  { icon: "rupee", title: "Volume pricing and GST invoice", body: "Tiered pricing from 10 cards, with a proper tax invoice." },
];

export default function BusinessPage() {
  const whatsapp = `https://wa.me/${site.supportWhatsapp}?text=${encodeURIComponent("Hi, I am interested in NFC cards for my team.")}`;

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">For teams</p>
          <h1 className="mt-4 font-display text-6xl leading-[1.02] text-ink-50">Equip your whole team.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-300">
            Sales, leadership and events teams make a stronger first impression with cards that capture every lead.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gold-300 px-7 py-3.5 text-[15px] font-semibold text-ink-950"
            >
              <Icon name="chat" size={18} /> Talk on WhatsApp
            </a>
            <a
              href={`mailto:${site.supportEmail}?subject=Team%20cards`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-[15px] text-ink-100"
            >
              Email us
            </a>
          </div>
        </div>
        <div className="relative h-80">
          <CardRender finish="silver" name="Riya Kapoor" title="Head of Sales" className="absolute top-0 left-6 w-[70%] rotate-[-8deg]" />
          <CardRender finish="black" name="Kabir Shah" title="Account Executive" className="absolute right-0 bottom-0 w-[70%] rotate-[5deg]" />
        </div>
      </div>
      <div className="mt-24 grid gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((point) => (
          <div key={point.title} className="bg-ink-950 p-8">
            <Icon name={point.icon} size={22} className="text-gold-300" />
            <h2 className="mt-5 font-medium text-ink-50">{point.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{point.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
