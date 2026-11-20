import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";

// Draft policy text. Must be reviewed by a lawyer before launch; Razorpay checks these pages during KYC.
const DOCS: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: "Terms of service",
    sections: [
      { heading: "Using the service", body: `By creating an account or buying a card from ${site.name} you agree to these terms. You must provide accurate details and keep your password private.` },
      { heading: "Your profile content", body: "You own the content you publish on your profile and are responsible for it. Do not publish anything unlawful, misleading or that infringes someone else's rights. We may remove content that breaks these rules." },
      { heading: "Cards", body: "Cards are personalised and made to order. The card links to your profile for as long as your account is active. You can disable a card at any time from your dashboard." },
      { heading: "Premium", body: "Each card includes free Premium (business sections, themes and analytics): 12 months with a metal card and 6 months with a PVC card. After that, Premium renews yearly at the price shown in your dashboard. If you do not renew, your card and basic profile keep working and your Premium content is kept, hidden, until you renew. Renewals are not refundable once the new period starts." },
      { heading: "Liability", body: "The service is provided as is. To the extent allowed by law, our liability is limited to the amount you paid for the card." },
      { heading: "Contact", body: `Questions about these terms: ${site.supportEmail}.` },
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      { heading: "What we collect", body: "Account details (name, email, mobile number), the profile content you choose to publish, delivery addresses for orders, and anonymous profile analytics such as views and clicks." },
      { heading: "Leads", body: "When a visitor shares their details from your profile, we store them for you and email you a copy. Visitors share these details by choice." },
      { heading: "How we use data", body: "To run your account, deliver orders, send one-time codes and service emails, and prevent abuse. We do not sell personal data." },
      { heading: "Processors", body: "We use trusted providers for hosting, SMS (MSG91), email (Resend) and payments (Razorpay). Card details are handled by Razorpay and never touch our servers." },
      { heading: "Your rights", body: `You can edit or delete your profile at any time. To delete your account or request a copy of your data, write to ${site.supportEmail}.` },
    ],
  },
  refund: {
    title: "Cancellation and refund policy",
    sections: [
      { heading: "Before production", body: "You can cancel an order for a full refund until you approve the design proof." },
      { heading: "After production", body: "Personalised cards cannot be returned once production starts, unless they arrive damaged or defective." },
      { heading: "Damaged or defective cards", body: "Tell us within 7 days of delivery with a photo and we will replace the card free of charge." },
      { heading: "Refund timeline", body: "Approved refunds are issued to the original payment method within 5 to 7 working days." },
    ],
  },
  shipping: {
    title: "Shipping policy",
    sections: [
      { heading: "Where we ship", body: "We ship to all serviceable PIN codes in India." },
      { heading: "Timelines", body: "Cards ship within 5 to 7 working days after design approval. Delivery usually takes a further 2 to 5 working days." },
      { heading: "Tracking", body: "You will receive a tracking number by email and in your dashboard once your order ships." },
    ],
  },
};

export const instant = false;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await params;
  return { title: DOCS[doc]?.title ?? "Policy" };
}

export default async function LegalPage({ params }: PageProps<"/legal/[doc]">) {
  const { doc } = await params;
  const content = DOCS[doc];
  if (!content) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      <h1 className="font-display text-5xl text-ink-50">{content.title}</h1>
      <p className="mt-3 text-sm text-ink-400">{site.company}</p>
      <div className="mt-10 flex flex-col gap-8">
        {content.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-medium text-ink-50">{section.heading}</h2>
            <p className="mt-2 leading-relaxed text-ink-300">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
