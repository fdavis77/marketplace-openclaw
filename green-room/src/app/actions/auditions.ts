"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const idSchema = z.object({ id: z.uuid() });
const STATUSES = ["submitted", "callback", "booked", "passed", "declined"] as const;

const optionalUuid = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.uuid().optional());

const auditionSchema = z.object({
  projectName: z.string().trim().min(1, "Name the project or show.").max(200),
  roleName: z.string().trim().min(1, "Name the role.").max(200),
  castingOffice: z.string().trim().max(200).optional(),
  auditionDate: z.string().optional(),
  callbackDate: z.string().optional(),
  status: z.enum(STATUSES),
  sidesUrl: z.union([z.url(), z.literal("")]).optional(),
  selfTapeDeadline: z.string().optional(),
  selfTapeUrl: z.union([z.url(), z.literal("")]).optional(),
  takeNotes: z.string().trim().max(1000).optional(),
  headshotId: optionalUuid,
  resumeId: optionalUuid,
  reelId: optionalUuid,
  notes: z.string().trim().max(1000).optional(),
});

function readAuditionForm(formData: FormData) {
  return auditionSchema.parse({
    projectName: formData.get("projectName"),
    roleName: formData.get("roleName"),
    castingOffice: formData.get("castingOffice") || undefined,
    auditionDate: formData.get("auditionDate") || undefined,
    callbackDate: formData.get("callbackDate") || undefined,
    status: formData.get("status"),
    sidesUrl: formData.get("sidesUrl") || "",
    selfTapeDeadline: formData.get("selfTapeDeadline") || undefined,
    selfTapeUrl: formData.get("selfTapeUrl") || "",
    takeNotes: formData.get("takeNotes") || undefined,
    headshotId: formData.get("headshotId") || undefined,
    resumeId: formData.get("resumeId") || undefined,
    reelId: formData.get("reelId") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

function toRow(data: ReturnType<typeof auditionSchema.parse>) {
  return {
    project_name: data.projectName,
    role_name: data.roleName,
    casting_office: data.castingOffice ?? null,
    audition_date: data.auditionDate ? new Date(data.auditionDate).toISOString() : null,
    callback_date: data.callbackDate ? new Date(data.callbackDate).toISOString() : null,
    status: data.status,
    sides_url: data.sidesUrl || null,
    self_tape_deadline: data.selfTapeDeadline ? new Date(data.selfTapeDeadline).toISOString() : null,
    self_tape_url: data.selfTapeUrl || null,
    take_notes: data.takeNotes ?? null,
    headshot_id: data.headshotId ?? null,
    resume_id: data.resumeId ?? null,
    reel_id: data.reelId ?? null,
    notes: data.notes ?? null,
  };
}

export async function createAudition(formData: FormData) {
  const user = await assertUser();
  const data = readAuditionForm(formData);
  const supabase = await createClient();
  const { data: audition, error } = await supabase
    .from("auditions")
    .insert({ owner_id: user.id, ...toRow(data) })
    .select("id")
    .single();
  if (error || !audition) throw new Error("Could not create audition.");
  revalidatePath("/auditions");
  redirect(`/auditions/${audition.id}`);
}

export async function updateAudition(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = readAuditionForm(formData);
  const supabase = await createClient();
  await supabase.from("auditions").update(toRow(data)).eq("id", id);
  revalidatePath("/auditions");
  revalidatePath(`/auditions/${id}`);
  revalidatePath("/");
}

export async function deleteAudition(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase.from("auditions").delete().eq("id", id);
  revalidatePath("/auditions");
  redirect("/auditions");
}
