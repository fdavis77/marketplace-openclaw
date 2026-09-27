import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, Chip, EmptyState, PageHeader, type Tone } from "@/components/ui";
import { DeleteVendorButton } from "@/components/vendors/delete-vendor";
import { VettingChecklist } from "@/components/vendors/vetting-checklist";
import { requireUser } from "@/lib/auth/dal";
import {
  ASSIGNMENT_STATUS_LABELS,
  COUNTRY_LABELS,
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUS_LABELS,
  type VendorStatus,
} from "@/lib/domain";
import { formatDate } from "@/lib/dates";
import { coupleName } from "@/lib/format";
import { uuid } from "@/lib/validation";
import { getVendorDetail } from "@/server/queries";

export const metadata: Metadata = { title: "Vendor" };

const statusTone: Record<VendorStatus, Tone> = { prospective: "gold", approved: "good", do_not_use: "over" };

export default async function VendorPage({ params }: PageProps<"/vendors/[id]">) {
  await requireUser();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const d = await getVendorDetail(id);
  if (!d) notFound();
  const v = d.vendor;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm">
        <Link href="/vendors" className="text-ink-soft hover:text-ink">← Vendors</Link>
      </nav>
      <PageHeader
        eyebrow={`${VENDOR_CATEGORY_LABELS[v.category]} · ${[v.region, COUNTRY_LABELS[v.country]].filter(Boolean).join(", ")}`}
        title={v.name}
        actions={<ButtonLink href={`/vendors/${v.id}/edit`} variant="secondary">Edit</ButtonLink>}
      >
        <div className="mt-2">
          <Chip tone={statusTone[v.status]}>{VENDOR_STATUS_LABELS[v.status]}</Chip>
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-xl">Contact &amp; terms</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink-soft">Contact</dt>
            <dd>{v.contactName ?? "—"}</dd>
            <dt className="text-ink-soft">Email</dt>
            <dd className="break-words">{v.email ? <a className="text-ember hover:underline" href={`mailto:${v.email}`}>{v.email}</a> : "—"}</dd>
            <dt className="text-ink-soft">Phone</dt>
            <dd>{v.phone ? <a className="text-ember hover:underline" href={`tel:${v.phone.replace(/\s/g, "")}`}>{v.phone}</a> : "—"}</dd>
            <dt className="text-ink-soft">Website</dt>
            <dd className="break-words">{v.website ? <a className="text-ember hover:underline" href={v.website} target="_blank" rel="noopener noreferrer">{v.website.replace(/^https?:\/\//, "")}</a> : "—"}</dd>
          </dl>
          {v.pricingTerms && (
            <>
              <h3 className="mb-1 mt-4 font-sans text-xs font-semibold uppercase tracking-wide text-ink-soft">Pricing / trade terms</h3>
              <p className="whitespace-pre-wrap text-sm">{v.pricingTerms}</p>
            </>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="mb-1 text-xl">Vetting</h2>
          <VettingChecklist
            vendorId={v.id}
            values={{
              publicLiabilityConfirmedOn: v.publicLiabilityConfirmedOn,
              tastingAttendedOn: v.tastingAttendedOn,
              referencesCheckedOn: v.referencesCheckedOn,
              responseTimeTestedOn: v.responseTimeTestedOn,
            }}
          />
        </Card>

        {v.notes && (
          <Card className="p-4 sm:p-5 lg:col-span-2">
            <h2 className="mb-2 text-xl">Notes</h2>
            <p className="whitespace-pre-wrap text-sm">{v.notes}</p>
          </Card>
        )}

        <Card className="p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-3 text-xl">Bookings</h2>
          {d.bookings.length === 0 ? (
            <EmptyState>Not used on any booking yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {d.bookings.map((b) => (
                <li key={b.assignmentId} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/clients/${b.clientId}?tab=vendors`} className="font-display text-lg hover:text-ember">
                    {coupleName(b)}
                  </Link>
                  <span className="text-right text-xs text-ink-soft">
                    {formatDate(b.weddingDate)} · {ASSIGNMENT_STATUS_LABELS[b.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-2">
          <DeleteVendorButton vendorId={v.id} name={v.name} />
        </div>
      </div>
    </>
  );
}
