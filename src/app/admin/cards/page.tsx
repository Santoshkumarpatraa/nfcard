import { count, desc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { Badge, Card, PageHeader, Skeleton, buttonClass } from "@/components/ui";
import { db } from "@/db";
import { cards, user } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { GenerateCardsForm } from "./generate-form";

export default function AdminCardsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AdminCards />
    </Suspense>
  );
}

async function AdminCards() {
  await requireAdmin();

  const [recent, totals] = await Promise.all([
    db
      .select({ card: cards, owner: user.username })
      .from(cards)
      .leftJoin(user, eq(user.id, cards.userId))
      .orderBy(desc(cards.createdAt))
      .limit(100),
    db.select({ status: cards.status, value: count() }).from(cards).groupBy(cards.status),
  ]);
  const total = (status: string) => totals.find((row) => row.status === status)?.value ?? 0;

  return (
    <>
      <PageHeader
        title="Cards"
        description="Each chip is programmed with its /t/CODE link. Unassigned cards show an activation page on tap."
        action={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from a route handler, not a page
          <a href="/admin/cards/export?status=unassigned" className={buttonClass("secondary")}>
            Export unassigned (CSV)
          </a>
        }
      />
      <div className="mb-6 grid grid-cols-3 gap-4">
        {(["unassigned", "active", "disabled"] as const).map((status) => (
          <Card key={status} className="p-5">
            <p className="text-sm text-ink-500 capitalize">{status}</p>
            <p className="mt-1 text-2xl font-semibold">{total(status)}</p>
          </Card>
        ))}
      </div>
      <Card className="mb-6 p-5">
        <h2 className="font-medium">Generate blank cards</h2>
        <p className="mt-1 text-sm text-ink-500">For retail stock or events. Buyers activate them by tapping.</p>
        <GenerateCardsForm />
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-ink-100 text-xs text-ink-500">
            <tr>
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {recent.map(({ card, owner }) => (
              <tr key={card.id}>
                <td className="px-5 py-3 font-mono">{card.code}</td>
                <td className="px-5 py-3">
                  <Badge tone={card.status === "active" ? "green" : card.status === "disabled" ? "red" : "neutral"}>{card.status}</Badge>
                </td>
                <td className="px-5 py-3">{owner ? `@${owner}` : "-"}</td>
                <td className="px-5 py-3 text-ink-500">{card.label ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
