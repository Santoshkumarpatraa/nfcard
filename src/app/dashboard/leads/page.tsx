import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { Card, PageHeader, Skeleton, buttonClass } from "@/components/ui";
import { ensureProfile, getLeads } from "@/data/owner";
import { formatPhone } from "@/lib/phone";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Leads />
    </Suspense>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

async function Leads() {
  const session = await requireVerifiedUser("/dashboard/leads");
  const profile = await ensureProfile(session.user.id, session.user.name);
  const leads = await getLeads(profile.id);

  return (
    <>
      <PageHeader
        title="Leads"
        description="People who shared their details from your profile."
        action={
          leads.length ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from a route handler, not a page
            <a href="/dashboard/leads/export" className={buttonClass("secondary")}>
              Export CSV
            </a>
          ) : null
        }
      />
      {leads.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <Icon name="users" size={22} />
          </div>
          <p className="mt-4 font-medium">No leads yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink-500">
            When someone taps your card and presses &quot;Share yours&quot;, their details land here and in your email.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink-100 text-xs text-ink-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="align-top">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{lead.name}</p>
                    {lead.company ? <p className="text-xs text-ink-500">{lead.company}</p> : null}
                  </td>
                  <td className="px-5 py-3.5">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="block hover:underline">
                        {formatPhone(lead.phone)}
                      </a>
                    ) : null}
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="block text-ink-600 hover:underline">
                        {lead.email}
                      </a>
                    ) : null}
                  </td>
                  <td className="max-w-xs px-5 py-3.5 text-ink-600">{lead.note}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-ink-500">{dateFormat.format(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
