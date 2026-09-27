import type { Metadata } from "next";
import { createClient } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "New booking" };

export default async function NewClientPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Clients" title="New booking" />
      <ClientForm action={createClient} today={todayISO()} cancelHref="/clients" />
    </div>
  );
}
