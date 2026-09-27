"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteClient } from "@/actions/clients";
import { ActionForm, SubmitButton } from "@/components/forms";
import { buttonClass, Card, TextField } from "@/components/ui";
import type { Client } from "@/db/schema";
import { COUNTRY_LABELS, FEE_STRUCTURE_LABELS, OWNER_LABELS, TIER_LABELS } from "@/lib/domain";
import { formatDate } from "@/lib/dates";
import { formatGBP } from "@/lib/money";

export function DetailsPanel({ client: c }: { client: Client }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4 sm:p-5">
        <h3 className="mb-3 text-lg">Contact</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <Row label={c.partnerOneName} value={<Contact email={c.email} phone={c.phone} />} />
          <Row label={c.partnerTwoName} value={<Contact email={c.secondaryEmail} phone={c.secondaryPhone} />} />
        </dl>
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="mb-3 text-lg">Booking</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <Row label="Tier" value={TIER_LABELS[c.tier]} />
          <Row label="Add-ons" value={c.addonFoodWine ? "Food & Wine Curation" : "None"} />
          <Row label="Fee structure" value={c.tier === "full" ? FEE_STRUCTURE_LABELS[c.feeStructure] : "Flat fee"} />
          <Row label="Base fee" value={formatGBP(c.baseFeePence)} />
          <Row label="Destination surcharge" value={formatGBP(c.destinationSurchargePence)} />
          <Row label="Total fee" value={<strong className="tabular">{formatGBP(c.totalFeePence)}</strong>} />
          <Row label="Couple's budget" value={formatGBP(c.weddingBudgetPence)} />
          <Row label="Booked on" value={formatDate(c.bookedOn)} />
          <Row label="Country" value={COUNTRY_LABELS[c.country]} />
          <Row label="Lead" value={OWNER_LABELS[c.lead]} />
        </dl>
      </Card>

      {c.notes && (
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <h3 className="mb-2 text-lg">Notes</h3>
          <p className="whitespace-pre-wrap text-sm">{c.notes}</p>
        </Card>
      )}

      <Card className="p-4 sm:p-5 lg:col-span-2">
        <h3 className="mb-1 text-lg">Data &amp; privacy</h3>
        <p className="mb-3 text-sm text-ink-soft">
          For a subject access request, download everything held on this couple. For an erasure request, delete them —
          this removes the booking, tasks, budget, payments, vendor links and wrap-up notes permanently.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/clients/${c.id}/edit`} className={buttonClass("secondary")}>
            Edit booking
          </Link>
          <a href={`/clients/${c.id}/export`} className={buttonClass("secondary")}>
            Download data (JSON)
          </a>
          <button type="button" className={buttonClass("danger")} onClick={() => setConfirming((v) => !v)}>
            Delete permanently…
          </button>
        </div>
        {confirming && (
          <div className="mt-4 rounded-xl border border-over/30 bg-over-wash/50 p-3">
            <ActionForm action={deleteClient.bind(null, c.id)}>
              {(e, pending) => (
                <>
                  <TextField
                    label={`Type “${c.partnerOneName}” to confirm. This can't be undone.`}
                    name="confirm"
                    autoComplete="off"
                    error={e.confirm}
                  />
                  <div>
                    <SubmitButton variant="danger" pending={pending} pendingLabel="Deleting…">
                      Delete all data for this couple
                    </SubmitButton>
                  </div>
                </>
              )}
            </ActionForm>
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </>
  );
}

function Contact({ email, phone }: { email: string | null; phone: string | null }) {
  if (!email && !phone) return <span className="text-ink-soft">—</span>;
  return (
    <span className="flex flex-col">
      {email && (
        <a href={`mailto:${email}`} className="text-ember hover:underline">
          {email}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-ember hover:underline">
          {phone}
        </a>
      )}
    </span>
  );
}
