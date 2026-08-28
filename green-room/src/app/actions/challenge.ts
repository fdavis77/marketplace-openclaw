"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const idSchema = z.object({ id: z.uuid() });

// A short-film-scale default plan. Days are targets from the day the
// challenge is started, not calendar dates, so a project can start its
// 90 days whenever it's ready.
const DEFAULT_MILESTONES: { day: number; phase: string; title: string; description?: string }[] = [
  { day: 1, phase: "Development", title: "Lock your logline and one-page synopsis" },
  { day: 7, phase: "Development", title: "Finish first draft of the script" },
  { day: 14, phase: "Development", title: "Get script notes from two readers" },
  { day: 20, phase: "Development", title: "Lock the final draft" },
  { day: 25, phase: "Pre-production", title: "Set your budget and financing plan" },
  { day: 30, phase: "Pre-production", title: "Attach key cast" },
  { day: 35, phase: "Pre-production", title: "Attach key crew", description: "DP, sound, gaffer — post in the network directory if you need to find them." },
  { day: 40, phase: "Pre-production", title: "Lock locations" },
  { day: 45, phase: "Pre-production", title: "Finish shooting schedule and shot list" },
  { day: 50, phase: "Production", title: "Complete rehearsals" },
  { day: 60, phase: "Production", title: "Wrap principal photography" },
  { day: 68, phase: "Post-production", title: "Lock picture" },
  { day: 75, phase: "Post-production", title: "Finish sound mix and music" },
  { day: 82, phase: "Post-production", title: "Finish color grade" },
  { day: 88, phase: "Delivery", title: "Export final deliverables" },
  { day: 90, phase: "Delivery", title: "Submit to a festival, or share it" },
];

async function ownsProject(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, ownerId: string) {
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).eq("owner_id", ownerId).maybeSingle();
  return Boolean(data);
}

export async function startChallenge(formData: FormData) {
  const user = await assertUser();
  const { id: projectId } = idSchema.parse({ id: formData.get("projectId") });
  const supabase = await createClient();

  if (!(await ownsProject(supabase, projectId, user.id))) throw new Error("Project not found.");

  const { count } = await supabase
    .from("challenge_milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (!count) {
    await supabase.from("challenge_milestones").insert(
      DEFAULT_MILESTONES.map((m) => ({
        project_id: projectId,
        day_number: m.day,
        phase: m.phase,
        title: m.title,
        description: m.description ?? null,
      }))
    );
  }

  await supabase.from("projects").update({ challenge_started_at: new Date().toISOString().slice(0, 10) }).eq("id", projectId);
  revalidatePath(`/projects/${projectId}`);
}

const toggleSchema = z.object({ id: z.uuid(), projectId: z.uuid(), isDone: z.boolean() });

export async function toggleMilestone(formData: FormData) {
  await assertUser();
  const data = toggleSchema.parse({
    id: formData.get("id"),
    projectId: formData.get("projectId"),
    isDone: formData.get("isDone") === "true",
  });
  const supabase = await createClient();
  await supabase
    .from("challenge_milestones")
    .update({ is_done: data.isDone, completed_at: data.isDone ? new Date().toISOString() : null })
    .eq("id", data.id);
  revalidatePath(`/projects/${data.projectId}`);
}
