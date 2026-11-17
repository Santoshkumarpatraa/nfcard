import type { PublicProfile } from "@/data/public-profile";

/** Sample content for the homepage showcase. Not a real person. */
export const showcaseProfile: PublicProfile = {
  id: "00000000-0000-4000-8000-000000000000",
  username: "demo",
  displayName: "Aarav Mehta",
  headline: "Founder",
  company: "Northwind Studio",
  bio: "Brand and product design for ambitious Indian startups.",
  contactPhone: "+919000000000",
  contactEmail: "hello@example.com",
  whatsapp: "+919000000000",
  website: "https://example.com",
  address: null,
  avatarKey: null,
  coverKey: null,
  theme: "onyx",
  accent: null,
  blocks: [
    {
      type: "services",
      isVisible: true,
      title: "Services",
      data: {
        items: [
          { name: "Brand identity", price: "From ₹75,000", description: "Logo, type, colour and guidelines." },
          { name: "Website design", price: "From ₹1,20,000" },
        ],
      },
    },
    {
      type: "social",
      isVisible: true,
      data: {
        items: [
          { network: "linkedin", url: "https://linkedin.com" },
          { network: "instagram", url: "https://instagram.com" },
          { network: "behance", url: "https://behance.net" },
        ],
      },
    },
  ],
};
