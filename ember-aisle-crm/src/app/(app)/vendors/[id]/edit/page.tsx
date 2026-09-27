import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateVendor } from "@/actions/vendors";
import { PageHeader } from "@/components/ui";
import { VendorForm } from "@/components/vendors/vendor-form";
import { requireUser } from "@/lib/auth/dal";
import { uuid } from "@/lib/validation";
import { getVendorDetail } from "@/server/queries";

export const metadata: Metadata = { title: "Edit vendor" };

export default async function EditVendorPage({ params }: PageProps<"/vendors/[id]/edit">) {
  await requireUser();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const d = await getVendorDetail(id);
  if (!d) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Edit vendor" title={d.vendor.name} />
      <VendorForm action={updateVendor.bind(null, id)} vendor={d.vendor} cancelHref={`/vendors/${id}`} />
    </div>
  );
}
