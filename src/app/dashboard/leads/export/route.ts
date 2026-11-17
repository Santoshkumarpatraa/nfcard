import { ensureProfile, getLeads } from "@/data/owner";
import { auth } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.phoneNumberVerified) return new Response("Unauthorized", { status: 401 });

  const profile = await ensureProfile(session.user.id, session.user.name);
  const leads = await getLeads(profile.id, 10_000);
  const body = toCsv(
    ["Name", "Phone", "Email", "Company", "Note", "Received"],
    leads.map((lead) => [lead.name, lead.phone, lead.email, lead.company, lead.note, lead.createdAt]),
  );
  return csvResponse(`leads-${new Date().toISOString().slice(0, 10)}.csv`, body);
}
