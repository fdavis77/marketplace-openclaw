import type { Metadata } from "next";
import { createVendor } from "@/actions/vendors";
import { PageHeader } from "@/components/ui";
import { VendorForm } from "@/components/vendors/vendor-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "New vendor" };

export default async function NewVendorPage({ searchParams }: PageProps<"/vendors/new">) {
  await requireUser();
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Vendors" title="New vendor" />
      <VendorForm
        action={createVendor}
        defaults={{
          category: typeof sp.category === "string" ? sp.category : undefined,
          country: typeof sp.country === "string" ? sp.country : undefined,
        }}
        cancelHref="/vendors"
      />
    </div>
  );
}
