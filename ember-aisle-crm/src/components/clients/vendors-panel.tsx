"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { createAssignment, deleteAssignment, updateAssignment } from "@/actions/vendors";
import { ActionForm, SubmitButton } from "@/components/forms";
import { useAction } from "@/components/use-action";
import {
  Button,
  Card,
  Chip,
  cx,
  Field,
  inputClass,
  options,
  OwnerChip,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABELS,
  CATEGORY_DEFAULT_OWNER,
  COUNTRY_LABELS,
  OWNERS,
  OWNER_LABELS,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_LABELS,
  type AssignmentStatus,
  type Country,
  type Owner,
  type VendorCategory,
  type VendorStatus,
} from "@/lib/domain";
import { reveal } from "@/lib/motion";

export type VendorOption = {
  id: string;
  name: string;
  category: VendorCategory;
  country: Country;
  status: VendorStatus;
};

export type AssignmentRow = {
  id: string;
  category: VendorCategory;
  status: AssignmentStatus;
  owner: Owner;
  contractRef: string | null;
  depositRef: string | null;
  notes: string | null;
  vendorId: string;
  vendorName: string;
  vendorStatus: VendorStatus;
  vendorCountry: Country;
  vendorEmail: string | null;
  vendorPhone: string | null;
};

const statusTone = { shortlisted: "gold", booked: "ember", confirmed: "good" } as const;

export function VendorsPanel({
  clientId,
  clientCountry,
  assignments,
  vendorOptions,
}: {
  clientId: string;
  clientCountry: Country;
  assignments: AssignmentRow[];
  vendorOptions: VendorOption[];
}) {
  const [assigning, setAssigning] = useState<VendorCategory | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const confirmed = assignments.filter((a) => a.status === "confirmed").length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        <span className="tabular font-medium text-ink">{confirmed}</span> confirmed ·{" "}
        {assignments.length} assigned across {new Set(assignments.map((a) => a.category)).size} of{" "}
        {VENDOR_CATEGORIES.length} categories
      </p>
      {VENDOR_CATEGORIES.map((cat) => {
        const rows = assignments.filter((a) => a.category === cat);
        return (
          <Card key={cat} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg">{VENDOR_CATEGORY_LABELS[cat]}</h3>
                <span className="text-xs text-ink-soft">lead: {OWNER_LABELS[CATEGORY_DEFAULT_OWNER[cat]]}</span>
              </div>
              <Button variant="ghost" onClick={() => setAssigning(assigning === cat ? null : cat)}>
                {assigning === cat ? "Close" : "+ Assign"}
              </Button>
            </div>

            {rows.length === 0 && assigning !== cat && (
              <p className="mt-1 text-sm text-ink-soft">Nothing assigned yet.</p>
            )}

            {rows.length > 0 && (
              <ul className="mt-2 divide-y divide-line">
                {rows.map((a) => (
                  <li key={a.id} className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/vendors/${a.vendorId}`} className="font-medium hover:text-ember">
                        {a.vendorName}
                      </Link>
                      <Chip tone={statusTone[a.status]}>{ASSIGNMENT_STATUS_LABELS[a.status]}</Chip>
                      <OwnerChip owner={a.owner} />
                      {a.vendorStatus === "do_not_use" && <Chip tone="over">Vendor marked do-not-use</Chip>}
                      <button
                        type="button"
                        onClick={() => setEditing(editing === a.id ? null : a.id)}
                        className="ml-auto text-sm text-ember hover:underline"
                        aria-expanded={editing === a.id}
                      >
                        {editing === a.id ? "Close" : "Edit"}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {[
                        COUNTRY_LABELS[a.vendorCountry],
                        a.contractRef && `Contract ${a.contractRef}`,
                        a.depositRef && `Deposit ${a.depositRef}`,
                        a.vendorPhone,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {a.notes && <p className="mt-1 text-sm">{a.notes}</p>}
                    <AnimatePresence initial={false}>
                      {editing === a.id && (
                        <motion.div key="e" {...reveal} className="overflow-hidden">
                          <EditAssignment row={a} onClose={() => setEditing(null)} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            )}

            <AnimatePresence initial={false}>
              {assigning === cat && (
                <motion.div key="a" {...reveal} className="overflow-hidden">
                  <AssignForm
                    clientId={clientId}
                    category={cat}
                    clientCountry={clientCountry}
                    vendors={vendorOptions.filter((v) => v.category === cat)}
                    alreadyAssigned={new Set(rows.map((r) => r.vendorId))}
                    onDone={() => setAssigning(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

function AssignForm({
  clientId,
  category,
  clientCountry,
  vendors,
  alreadyAssigned,
  onDone,
}: {
  clientId: string;
  category: VendorCategory;
  clientCountry: Country;
  vendors: VendorOption[];
  alreadyAssigned: Set<string>;
  onDone: () => void;
}) {
  const available = vendors.filter((v) => !alreadyAssigned.has(v.id));
  const local = available.filter((v) => v.country === clientCountry);
  const elsewhere = available.filter((v) => v.country !== clientCountry);

  if (available.length === 0) {
    return (
      <div className="mt-3 rounded-xl bg-ivory p-3 text-sm">
        No {vendors.length ? "other " : ""}
        {VENDOR_CATEGORY_LABELS[category].toLowerCase()} vendors in the directory.{" "}
        <Link href={`/vendors/new?category=${category}&country=${clientCountry}`} className="text-ember underline">
          Add one
        </Link>
      </div>
    );
  }

  const label = (v: VendorOption) =>
    `${v.name}${v.status === "do_not_use" ? " — DO NOT USE" : v.status === "prospective" ? " (prospective)" : ""}`;

  return (
    <div className="mt-3 rounded-xl bg-ivory p-3">
      <ActionForm action={createAssignment.bind(null, clientId)} onSuccess={onDone}>
        {(e, pending) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="category" value={category} />
            <Field label="Vendor" name="vendorId" error={e.vendorId} className="sm:col-span-2">
              <select id="vendorId" name="vendorId" className={inputClass} defaultValue="" required>
                <option value="" disabled>
                  Choose a vendor…
                </option>
                {local.length > 0 && (
                  <optgroup label={`In ${COUNTRY_LABELS[clientCountry]}`}>
                    {local.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.status === "do_not_use"}>
                        {label(v)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {elsewhere.length > 0 && (
                  <optgroup label="Elsewhere">
                    {elsewhere.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.status === "do_not_use"}>
                        {label(v)} · {COUNTRY_LABELS[v.country]}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </Field>
            <SelectField label="Status" name="status" defaultValue="shortlisted" options={options(ASSIGNMENT_STATUSES, ASSIGNMENT_STATUS_LABELS)} />
            <SelectField label="Owner" name="owner" defaultValue={CATEGORY_DEFAULT_OWNER[category]} options={options(OWNERS, OWNER_LABELS)} />
            <TextField label="Contract ref" name="contractRef" error={e.contractRef} />
            <TextField label="Deposit ref" name="depositRef" error={e.depositRef} />
            <TextAreaField label="Notes" name="notes" rows={2} className="sm:col-span-2" />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={onDone}>
                Cancel
              </Button>
              <SubmitButton pending={pending}>Assign vendor</SubmitButton>
            </div>
          </div>
        )}
      </ActionForm>
    </div>
  );
}

function EditAssignment({ row, onClose }: { row: AssignmentRow; onClose: () => void }) {
  const del = useAction();
  return (
    <div className={cx("mt-2 rounded-xl bg-ivory p-3")}>
      <ActionForm action={updateAssignment.bind(null, row.id)} onSuccess={onClose}>
        {(e, pending) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Status" name="status" defaultValue={row.status} options={options(ASSIGNMENT_STATUSES, ASSIGNMENT_STATUS_LABELS)} />
            <SelectField label="Owner" name="owner" defaultValue={row.owner} options={options(OWNERS, OWNER_LABELS)} />
            <TextField label="Contract ref" name="contractRef" defaultValue={row.contractRef ?? ""} error={e.contractRef} />
            <TextField label="Deposit ref" name="depositRef" defaultValue={row.depositRef ?? ""} error={e.depositRef} />
            <TextAreaField label="Notes" name="notes" rows={2} defaultValue={row.notes ?? ""} className="sm:col-span-2" />
            <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="danger"
                disabled={del.pending}
                onClick={() =>
                  del.run(() => deleteAssignment(row.id), { confirm: `Remove ${row.vendorName} from this booking?` })
                }
              >
                Remove
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <SubmitButton pending={pending}>Save</SubmitButton>
              </div>
            </div>
            {del.error && <p className="text-sm text-over sm:col-span-2">{del.error}</p>}
          </div>
        )}
      </ActionForm>
    </div>
  );
}
