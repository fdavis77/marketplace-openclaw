"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const idSchema = z.object({ id: z.uuid() });

const FORMATS = ["short", "feature", "pilot", "tv_movie", "other"] as const;
const STAGES = [
  "idea",
  "outline",
  "drafting",
  "revision",
  "polish",
  "locked",
  "in_production",
  "delivered",
] as const;

const projectSchema = z.object({
  title: z.string().trim().min(1, "Give it a title.").max(200),
  logline: z.string().trim().max(500).optional(),
  format: z.enum(FORMATS),
  stage: z.enum(STAGES),
  targetDeadline: z.string().optional(),
});

function readProjectForm(formData: FormData) {
  return projectSchema.parse({
    title: formData.get("title"),
    logline: formData.get("logline") || undefined,
    format: formData.get("format"),
    stage: formData.get("stage"),
    targetDeadline: formData.get("targetDeadline") || undefined,
  });
}

export async function createProject(formData: FormData) {
  const user = await assertUser();
  const data = readProjectForm(formData);
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title: data.title,
      logline: data.logline ?? null,
      format: data.format,
      stage: data.stage,
      target_deadline: data.targetDeadline || null,
    })
    .select("id")
    .single();
  if (error || !project) throw new Error("Could not create project.");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = readProjectForm(formData);
  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({
      title: data.title,
      logline: data.logline ?? null,
      format: data.format,
      stage: data.stage,
      target_deadline: data.targetDeadline || null,
    })
    .eq("id", id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

export async function deleteProject(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/projects");
  redirect("/projects");
}

// ---------------------------------------------------------------------------
// scenes
// ---------------------------------------------------------------------------
const sceneSchema = z.object({
  projectId: z.uuid(),
  sceneNumber: z.coerce.number().int().min(1).max(9999),
  heading: z.string().trim().max(200).default(""),
  status: z.enum(["needs_work", "drafted", "revised", "locked"]),
  notes: z.string().trim().max(2000).optional(),
});

export async function createScene(formData: FormData) {
  await assertUser();
  const data = sceneSchema.parse({
    projectId: formData.get("projectId"),
    sceneNumber: formData.get("sceneNumber"),
    heading: formData.get("heading") ?? "",
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  const supabase = await createClient();
  await supabase.from("scenes").insert({
    project_id: data.projectId,
    scene_number: data.sceneNumber,
    heading: data.heading,
    status: data.status,
    notes: data.notes ?? null,
  });
  revalidatePath(`/projects/${data.projectId}`);
}

export async function updateScene(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = sceneSchema.parse({
    projectId: formData.get("projectId"),
    sceneNumber: formData.get("sceneNumber"),
    heading: formData.get("heading") ?? "",
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  const supabase = await createClient();
  await supabase
    .from("scenes")
    .update({
      scene_number: data.sceneNumber,
      heading: data.heading,
      status: data.status,
      notes: data.notes ?? null,
    })
    .eq("id", id);
  revalidatePath(`/projects/${data.projectId}`);
}

export async function deleteScene(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const projectId = z.uuid().parse(formData.get("projectId"));
  const supabase = await createClient();
  await supabase.from("scenes").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}

// ---------------------------------------------------------------------------
// submissions
// ---------------------------------------------------------------------------
const submissionSchema = z.object({
  projectId: z.uuid(),
  targetName: z.string().trim().min(1, "Name the competition, agent, or producer.").max(200),
  targetType: z.enum(["competition", "festival", "agent", "producer", "other"]),
  submittedAt: z.string().min(1),
  responseDueAt: z.string().optional(),
  status: z.enum(["submitted", "pending", "rejected", "accepted"]),
  notes: z.string().trim().max(2000).optional(),
});

export async function createSubmission(formData: FormData) {
  await assertUser();
  const data = submissionSchema.parse({
    projectId: formData.get("projectId"),
    targetName: formData.get("targetName"),
    targetType: formData.get("targetType"),
    submittedAt: formData.get("submittedAt"),
    responseDueAt: formData.get("responseDueAt") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  const supabase = await createClient();
  await supabase.from("submissions").insert({
    project_id: data.projectId,
    target_name: data.targetName,
    target_type: data.targetType,
    submitted_at: data.submittedAt,
    response_due_at: data.responseDueAt || null,
    status: data.status,
    notes: data.notes ?? null,
  });
  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath("/");
}

export async function updateSubmission(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = submissionSchema.parse({
    projectId: formData.get("projectId"),
    targetName: formData.get("targetName"),
    targetType: formData.get("targetType"),
    submittedAt: formData.get("submittedAt"),
    responseDueAt: formData.get("responseDueAt") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  const supabase = await createClient();
  await supabase
    .from("submissions")
    .update({
      target_name: data.targetName,
      target_type: data.targetType,
      submitted_at: data.submittedAt,
      response_due_at: data.responseDueAt || null,
      status: data.status,
      notes: data.notes ?? null,
    })
    .eq("id", id);
  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath("/");
}

export async function deleteSubmission(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const projectId = z.uuid().parse(formData.get("projectId"));
  const supabase = await createClient();
  await supabase.from("submissions").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}
