import Link from "next/link";
import QRCode from "qrcode";
import { Suspense } from "react";
import { setCardStatus } from "@/app/dashboard/actions";
import { ActionButton } from "@/components/dashboard/action-button";
import { Badge, Card, PageHeader, Skeleton, buttonClass } from "@/components/ui";
import { getUserCards } from "@/data/owner";
import { requireVerifiedUser } from "@/lib/session";
import { absoluteUrl } from "@/lib/site";
import { ActivateCardForm } from "./activate-form";

export default function CardsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Cards />
    </Suspense>
  );
}

async function Cards() {
  const session = await requireVerifiedUser("/dashboard/cards");
  const cards = await getUserCards(session.user.id);
  const qrCodes = await Promise.all(
    cards.map((card) => QRCode.toString(absoluteUrl(`/t/${card.code}?s=qr`), { type: "svg", margin: 1, width: 120 })),
  );

  return (
    <>
      <PageHeader
        title="Cards"
        description="Every card opens your profile. Disable a lost card instantly."
        action={
          <Link href="/shop" className={buttonClass("primary")}>
            Order a card
          </Link>
        }
      />

      <Card className="mb-6 p-5">
        <h2 className="font-medium">Activate a card</h2>
        <p className="mt-1 text-sm text-ink-500">
          Tap the card on your phone, or type the 8-character code printed on the card sleeve.
        </p>
        <ActivateCardForm />
      </Card>

      {cards.length === 0 ? (
        <Card className="px-6 py-14 text-center text-sm text-ink-500">No cards linked to your account yet.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card, index) => (
            <Card key={card.id} className="flex min-w-0 gap-4 p-4 sm:gap-5 sm:p-5">
              <div
                className="shrink-0 rounded-lg border border-ink-100 bg-white p-1"
                dangerouslySetInnerHTML={{ __html: qrCodes[index] ?? "" }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-semibold tracking-wider">{card.code}</p>
                  <Badge tone={card.status === "active" ? "green" : "red"}>
                    {card.status === "active" ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-ink-500">{card.label ?? "NFC card"}</p>
                <p className="truncate text-xs text-ink-500">{absoluteUrl(`/t/${card.code}`)}</p>
                <div className="mt-auto pt-2">
                  {card.status === "active" ? (
                    <ActionButton
                      variant="danger"
                      action={setCardStatus.bind(null, card.id, "disabled")}
                      confirm="Disable this card? Taps will show an inactive notice until you re-enable it."
                    >
                      Report lost / disable
                    </ActionButton>
                  ) : (
                    <ActionButton action={setCardStatus.bind(null, card.id, "active")}>Re-enable</ActionButton>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
