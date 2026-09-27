"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import {
  ButtonLink,
  Card,
  options,
  SelectField,
  TextAreaField,
  TextField,
  cx,
} from "@/components/ui";
import type { Client } from "@/db/schema";
import {
  COUNTRIES,
  COUNTRY_LABELS,
  FEE_STRUCTURES,
  FEE_STRUCTURE_LABELS,
  OWNERS,
  OWNER_LABELS,
  STAGES,
  STAGE_LABELS,
  TIERS,
  TIER_LABELS,
  TIER_SHORT,
  type FeeStructure,
  type Tier,
} from "@/lib/domain";
import { calculateFee } from "@/lib/fees";
import { formatGBP, parsePounds, penceToInput } from "@/lib/money";
import type { ActionResult } from "@/lib/validation";

const TIER_BLURB: Record<Tier, string> = {
  full: "9–18 months · end-to-end planning",
  partial: "From 6 months · sourcing, confirmation, styling",
  day_of: "~8 weeks · coordination and the day itself",
};

export function ClientForm({
  action,
  client,
  today,
  cancelHref,
}: {
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
  client?: Client;
  today: string;
  cancelHref: string;
}) {
  const [tier, setTier] = useState<Tier>(client?.tier ?? "full");
  const [feeStructure, setFeeStructure] = useState<FeeStructure>(client?.feeStructure ?? "flat");
  const [budget, setBudget] = useState(penceToInput(client?.weddingBudgetPence));
  const [flatFee, setFlatFee] = useState(client ? penceToInput(client.baseFeePence) : "");
  const [surcharge, setSurcharge] = useState(penceToInput(client?.destinationSurchargePence || null));

  const effectiveStructure: FeeStructure = tier === "full" ? feeStructure : "flat";
  const preview = calculateFee({
    tier,
    feeStructure: effectiveStructure,
    flatFee: parsePounds(flatFee),
    weddingBudget: parsePounds(budget),
    destinationSurcharge: parsePounds(surcharge),
  });
  const previewOk = preview.ok && !Number.isNaN(preview.totalFee);

  return (
    <ActionForm action={action} className="gap-6">
      {(e, pending) => (
        <>
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-xl">The couple</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Partner one" name="partnerOneName" defaultValue={client?.partnerOneName} error={e.partnerOneName} autoComplete="off" required />
              <TextField label="Partner two" name="partnerTwoName" defaultValue={client?.partnerTwoName} error={e.partnerTwoName} autoComplete="off" required />
              <TextField label="Email" name="email" type="email" defaultValue={client?.email ?? ""} error={e.email} autoComplete="off" />
              <TextField label="Phone" name="phone" type="tel" defaultValue={client?.phone ?? ""} error={e.phone} autoComplete="off" />
              <TextField label="Second email" name="secondaryEmail" type="email" defaultValue={client?.secondaryEmail ?? ""} error={e.secondaryEmail} autoComplete="off" />
              <TextField label="Second phone" name="secondaryPhone" type="tel" defaultValue={client?.secondaryPhone ?? ""} error={e.secondaryPhone} autoComplete="off" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-xl">The wedding</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Wedding date" name="weddingDate" type="date" defaultValue={client?.weddingDate} error={e.weddingDate} hint="A provisional date is fine — the timeline re-dates itself if it changes." required />
              <TextField label="Booked on" name="bookedOn" type="date" defaultValue={client?.bookedOn ?? today} error={e.bookedOn} required />
              <SelectField label="Country" name="country" defaultValue={client?.country ?? ""} placeholder="Choose…" options={options(COUNTRIES, COUNTRY_LABELS)} error={e.country} required />
              <TextField label="Venue" name="venueName" defaultValue={client?.venueName ?? ""} error={e.venueName} />
              <TextField label="Guest count" name="guestCount" type="number" inputMode="numeric" min={0} defaultValue={client?.guestCount ?? ""} error={e.guestCount} />
              <TextField label="Couple's overall budget (£)" name="weddingBudget" inputMode="decimal" value={budget} onChange={(ev) => setBudget(ev.target.value)} error={e.weddingBudget} hint="Used as the budget target, and for 10% pricing." />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="mb-1 text-xl">Service</h2>
            <p className="mb-4 text-sm text-ink-soft">The task timeline is built from the tier you pick.</p>
            <fieldset>
              <legend className="sr-only">Service tier</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {TIERS.map((t) => (
                  <label
                    key={t}
                    className={cx(
                      "flex cursor-pointer flex-col rounded-xl border p-3 transition-brand",
                      tier === t ? "border-ember bg-ember-wash/60 ring-1 ring-ember" : "border-line-strong bg-card hover:border-ink-soft",
                    )}
                  >
                    <input type="radio" name="tier" value={t} checked={tier === t} onChange={() => setTier(t)} className="sr-only" />
                    <span className="text-xs font-medium uppercase tracking-wide text-gold-ink">{TIER_SHORT[t]}</span>
                    <span className="font-display text-lg leading-tight">{TIER_LABELS[t]}</span>
                    <span className="mt-1 text-xs text-ink-soft">{TIER_BLURB[t]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-card px-3">
              <input type="checkbox" name="addonFoodWine" defaultChecked={client?.addonFoodWine} className="h-5 w-5 accent-ember" />
              <span className="text-sm">
                <span className="font-medium">Food &amp; Wine Curation</span>
                <span className="text-ink-soft"> — adds Fabian&rsquo;s brief, tasting and sign-off tasks</span>
              </span>
            </label>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {tier === "full" ? (
                <SelectField
                  label="Fee structure"
                  name="feeStructure"
                  value={feeStructure}
                  onChange={(ev) => setFeeStructure(ev.target.value as FeeStructure)}
                  options={options(FEE_STRUCTURES, FEE_STRUCTURE_LABELS)}
                />
              ) : (
                <input type="hidden" name="feeStructure" value="flat" />
              )}
              {effectiveStructure === "flat" ? (
                <TextField label="Fee (£)" name="flatFee" inputMode="decimal" value={flatFee} onChange={(ev) => setFlatFee(ev.target.value)} error={e.flatFee} required />
              ) : (
                <input type="hidden" name="flatFee" value="" />
              )}
              <TextField label="Destination surcharge (£)" name="destinationSurcharge" inputMode="decimal" value={surcharge} onChange={(ev) => setSurcharge(ev.target.value)} error={e.destinationSurcharge} hint="Leave blank if none." />
            </div>

            <div className="mt-4 rounded-xl bg-ivory px-4 py-3 text-sm" aria-live="polite">
              {previewOk && preview.ok ? (
                <p>
                  Total fee <span className="tabular font-semibold">{formatGBP(preview.totalFee)}</span>
                  <span className="text-ink-soft">
                    {" "}
                    = {formatGBP(preview.baseFee)}
                    {effectiveStructure === "percent_of_budget" && (preview.minimumApplied ? " (£5,500 minimum)" : " (10% of budget)")}
                    {preview.surcharge > 0 && ` + ${formatGBP(preview.surcharge)} surcharge`}
                  </span>
                </p>
              ) : (
                <p className="text-ink-soft">{preview.ok ? "Check the amounts." : preview.error}</p>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-xl">Pipeline</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Stage" name="stage" defaultValue={client?.stage ?? "booked"} options={options(STAGES, STAGE_LABELS)} />
              <SelectField label="Lead" name="lead" defaultValue={client?.lead ?? "joint"} options={options(OWNERS, OWNER_LABELS)} />
              <TextAreaField label="Notes" name="notes" defaultValue={client?.notes ?? ""} className="sm:col-span-2" rows={4} />
            </div>
          </Card>

          <div className="sticky bottom-20 z-20 flex justify-end gap-2 rounded-2xl border border-line bg-card/95 p-3 shadow-lg backdrop-blur sm:bottom-4">
            <ButtonLink href={cancelHref} variant="ghost">
              Cancel
            </ButtonLink>
            <SubmitButton pending={pending}>{client ? "Save changes" : "Create booking"}</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
