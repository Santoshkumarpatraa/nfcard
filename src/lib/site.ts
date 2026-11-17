// Brand placeholders. Replace once the brand name and domain are final.
export const site = {
  name: "NFCard",
  tagline: "The last business card you will ever need",
  description:
    "Premium metal NFC business cards. One tap opens your living profile: contact, WhatsApp, services, gallery and more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3400",
  supportEmail: "support@example.com",
  supportPhone: "+91 90000 00000",
  supportWhatsapp: "919000000000",
  company: "NFCard Technologies Pvt Ltd",
  address: "Bengaluru, Karnataka, India",
  freeShippingAbovePaise: 0,
  shippingPaise: 0,
};

export function absoluteUrl(path: string) {
  return new URL(path, site.url).toString();
}
