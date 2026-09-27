"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import { ButtonLink, Card, options, SelectField, TextAreaField, TextField } from "@/components/ui";
import type { Vendor } from "@/db/schema";
import {
  COUNTRIES,
  COUNTRY_LABELS,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUSES,
  VENDOR_STATUS_LABELS,
  VETTING_CHECKS,
} from "@/lib/domain";
import type { ActionResult } from "@/lib/validation";

export function VendorForm({
  action,
  vendor,
  defaults,
  cancelHref,
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  vendor?: Vendor;
  defaults?: { category?: string; country?: string };
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} className="gap-6">
      {(e, pending) => (
        <>
          <Card className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" name="name" defaultValue={vendor?.name} error={e.name} className="sm:col-span-2" required />
              <SelectField label="Category" name="category" defaultValue={vendor?.category ?? defaults?.category ?? ""} placeholder="Choose…" options={options(VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS)} error={e.category} />
              <SelectField label="Country" name="country" defaultValue={vendor?.country ?? defaults?.country ?? ""} placeholder="Choose…" options={options(COUNTRIES, COUNTRY_LABELS)} error={e.country} />
              <TextField label="Region / town" name="region" defaultValue={vendor?.region ?? ""} error={e.region} />
              <SelectField label="Status" name="status" defaultValue={vendor?.status ?? "prospective"} options={options(VENDOR_STATUSES, VENDOR_STATUS_LABELS)} />
              <TextField label="Contact name" name="contactName" defaultValue={vendor?.contactName ?? ""} error={e.contactName} />
              <TextField label="Email" name="email" type="email" defaultValue={vendor?.email ?? ""} error={e.email} />
              <TextField label="Phone" name="phone" type="tel" defaultValue={vendor?.phone ?? ""} error={e.phone} />
              <TextField label="Website" name="website" defaultValue={vendor?.website ?? ""} error={e.website} />
              <TextAreaField label="Pricing / trade terms" name="pricingTerms" defaultValue={vendor?.pricingTerms ?? ""} error={e.pricingTerms} className="sm:col-span-2" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="mb-1 text-xl">Vetting checklist</h2>
            <p className="mb-4 text-sm text-ink-soft">Enter the date each check was completed. Blank means not done.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {VETTING_CHECKS.map((c) => (
                <TextField key={c.key} label={c.label} name={c.key} type="date" defaultValue={vendor?.[c.key] ?? ""} error={e[c.key]} />
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <TextAreaField label="Notes" name="notes" rows={5} defaultValue={vendor?.notes ?? ""} error={e.notes} />
          </Card>

          <div className="sticky bottom-20 z-20 flex justify-end gap-2 rounded-2xl border border-line bg-card/95 p-3 shadow-lg backdrop-blur sm:bottom-4">
            <ButtonLink href={cancelHref} variant="ghost">
              Cancel
            </ButtonLink>
            <SubmitButton pending={pending}>{vendor ? "Save vendor" : "Add vendor"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
