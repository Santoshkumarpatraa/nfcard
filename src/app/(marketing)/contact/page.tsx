import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const channels = [
    { icon: "chat" as const, label: "WhatsApp", value: site.supportPhone, href: `https://wa.me/${site.supportWhatsapp}` },
    { icon: "mail" as const, label: "Email", value: site.supportEmail, href: `mailto:${site.supportEmail}` },
    { icon: "pin" as const, label: "Office", value: site.address, href: undefined },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">Contact</p>
      <h1 className="mt-4 font-display text-6xl text-ink-50">We are here to help.</h1>
      <p className="mt-5 text-lg text-ink-300">Order questions, design help or team pricing. We reply within one working day.</p>
      <div className="mt-12 grid gap-4">
        {channels.map((channel) => {
          const content = (
            <>
              <Icon name={channel.icon} size={22} className="text-gold-300" />
              <div>
                <p className="text-sm text-ink-400">{channel.label}</p>
                <p className="text-ink-50">{channel.value}</p>
              </div>
            </>
          );
          return channel.href ? (
            <a
              key={channel.label}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 rounded-2xl border border-white/5 bg-ink-900/60 p-6 hover:border-white/15"
            >
              {content}
            </a>
          ) : (
            <div key={channel.label} className="flex items-center gap-5 rounded-2xl border border-white/5 bg-ink-900/60 p-6">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
