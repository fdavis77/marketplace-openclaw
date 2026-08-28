"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertUser } from "@/lib/dal";

const idSchema = z.object({ id: z.uuid() });

// A lightweight, genre-neutral beat sheet. Page numbers are guidance for a
// feature-length script — halve them for a short.
const DEFAULT_BEATS: { title: string; description: string }[] = [
  { title: "Opening image", description: "The first thing we see — sets tone, before-state of your hero. ~p.1" },
  { title: "Setup", description: "Introduce hero, world, and what's missing in their life. ~p.1–10" },
  { title: "Catalyst", description: "The inciting incident that kicks the story into motion. ~p.10–12" },
  { title: "Debate", description: "Hero hesitates — can they really do this? ~p.12–25" },
  { title: "Break into two", description: "Hero commits and enters the new world of the story. ~p.25" },
  { title: "B story", description: "A secondary relationship that carries the theme. ~p.30" },
  { title: "Midpoint", description: "A false victory or false defeat that raises the stakes. ~p.50–55" },
  { title: "All is lost", description: "The lowest point — it looks like the hero has failed. ~p.75" },
  { title: "Break into three", description: "The hero finds the answer and commits to the final push. ~p.85" },
  { title: "Finale", description: "The hero proves what they've learned and resolves the story. ~p.85–110" },
  { title: "Final image", description: "The mirror of the opening image — how the world has changed." },
];

async function ownsProject(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, ownerId: string) {
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).eq("owner_id", ownerId).maybeSingle();
  return Boolean(data);
}

export async function generateBeatSheet(formData: FormData) {
  const user = await assertUser();
  const { id: projectId } = idSchema.parse({ id: formData.get("projectId") });
  const supabase = await createClient();

  if (!(await ownsProject(supabase, projectId, user.id))) throw new Error("Project not found.");

  const { count } = await supabase
    .from("story_beats")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (!count) {
    await supabase.from("story_beats").insert(
      DEFAULT_BEATS.map((b, i) => ({
        project_id: projectId,
        position: i + 1,
        title: b.title,
        description: b.description,
      }))
    );
  }

  revalidatePath(`/projects/${projectId}`);
}

const beatSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(1, "Give the beat a name.").max(200),
  description: z.string().trim().max(1000).optional(),
  targetPage: z.coerce.number().int().min(1).max(1000).optional(),
});

export async function updateBeat(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = beatSchema.parse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    targetPage: formData.get("targetPage") || undefined,
  });
  const supabase = await createClient();
  await supabase
    .from("story_beats")
    .update({
      title: data.title,
      description: data.description ?? null,
      target_page: data.targetPage ?? null,
    })
    .eq("id", id);
  revalidatePath(`/projects/${data.projectId}`);
}

const toggleSchema = z.object({ id: z.uuid(), projectId: z.uuid(), isDone: z.boolean() });

export async function toggleBeat(formData: FormData) {
  await assertUser();
  const data = toggleSchema.parse({
    id: formData.get("id"),
    projectId: formData.get("projectId"),
    isDone: formData.get("isDone") === "true",
  });
  const supabase = await createClient();
  await supabase.from("story_beats").update({ is_done: data.isDone }).eq("id", data.id);
  revalidatePath(`/projects/${data.projectId}`);
}

export async function deleteBeat(formData: FormData) {
  await assertUser();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const projectId = z.uuid().parse(formData.get("projectId"));
  const supabase = await createClient();
  await supabase.from("story_beats").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}
