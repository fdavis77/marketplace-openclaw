import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { updateClient } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/ui";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { todayISO } from "@/lib/dates";
import { coupleName } from "@/lib/format";
import { uuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Edit booking" };

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  await requireUser();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Edit booking" title={coupleName(client)} />
      <ClientForm
        action={updateClient.bind(null, client.id)}
        client={client}
        today={todayISO()}
        cancelHref={`/clients/${client.id}`}
      />
    </div>
  );
}
