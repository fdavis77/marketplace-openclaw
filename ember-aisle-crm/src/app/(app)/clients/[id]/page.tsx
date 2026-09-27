import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientWorkspace } from "@/components/clients/workspace";
import { requireUser } from "@/lib/auth/dal";
import { summariseBudget } from "@/lib/budget";
import { todayISO } from "@/lib/dates";
import { coupleName } from "@/lib/format";
import { paymentStatus, summarisePayments } from "@/lib/payments";
import { uuid } from "@/lib/validation";
import { getClientDetail } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/clients/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!uuid.safeParse(id).success) return { title: "Client" };
  const d = await getClientDetail(id);
  return { title: d ? coupleName(d.client) : "Client" };
}

export default async function ClientPage({ params, searchParams }: PageProps<"/clients/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  if (!uuid.safeParse(id).success) notFound();
  const detail = await getClientDetail(id);
  if (!detail) notFound();

  const today = todayISO();
  const budgetSummary = summariseBudget(
    detail.budget.map((l) => ({ committed: l.committedPence, actual: l.actualPence })),
    detail.client.weddingBudgetPence,
  );
  const paymentRows = detail.payments.map((p) => ({ ...p, status: paymentStatus(p, today) }));
  const paymentSummary = summarisePayments(
    detail.payments.map((p) => ({ amount: p.amountPence, dueDate: p.dueDate, paidDate: p.paidDate })),
    today,
  );

  return (
    <ClientWorkspace
      today={today}
      person={user.person}
      initialTab={typeof sp.tab === "string" ? sp.tab : undefined}
      justCreated={sp.created === "1"}
      client={detail.client}
      tasks={detail.tasks}
      assignments={detail.assignments}
      budget={detail.budget}
      budgetSummary={budgetSummary}
      payments={paymentRows}
      paymentSummary={paymentSummary}
      wrapUp={detail.wrapUp}
      vendorOptions={detail.vendorOptions}
    />
  );
}
