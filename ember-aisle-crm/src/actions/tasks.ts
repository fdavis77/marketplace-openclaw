"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { timelineTasks } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { OWNERS, TASK_STATUSES, type TaskStatus } from "@/lib/domain";
import {
  fromForm,
  invalid,
  optionalText,
  requiredDate,
  requiredText,
  uuid,
  type ActionResult,
} from "@/lib/validation";

const TaskSchema = z.object({
  name: requiredText("Task name", 300),
  dueDate: requiredDate("Due date"),
  owner: z.enum(OWNERS),
  status: z.enum(TASK_STATUSES),
  phase: optionalText(120),
  notes: optionalText(5000),
});

function completedAtFor(status: TaskStatus, previous?: Date | null) {
  if (status !== "done") return null;
  return previous ?? new Date();
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(taskId).success || !TASK_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid task." };
  }
  const updated = await db
    .update(timelineTasks)
    .set({ status, completedAt: completedAtFor(status) })
    .where(eq(timelineTasks.id, taskId))
    .returning({ id: timelineTasks.id });
  if (!updated.length) return { ok: false, error: "That task no longer exists." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTask(taskId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(taskId).success) return { ok: false, error: "Invalid task." };
  const parsed = TaskSchema.safeParse(fromForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const [cur] = await db.select().from(timelineTasks).where(eq(timelineTasks.id, taskId));
  if (!cur) return { ok: false, error: "That task no longer exists." };

  await db
    .update(timelineTasks)
    .set({
      name: v.name,
      dueDate: v.dueDate,
      // A hand-changed date is pinned so a timeline rebuild won't move it.
      dueDateManual: cur.dueDateManual || v.dueDate !== cur.dueDate,
      owner: v.owner,
      status: v.status,
      completedAt: completedAtFor(v.status, cur.completedAt),
      phase: v.phase ?? cur.phase,
      notes: v.notes,
    })
    .where(eq(timelineTasks.id, taskId));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createTask(clientId: string, _prev: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(clientId).success) return { ok: false, error: "Unknown client." };
  const parsed = TaskSchema.safeParse({ status: "not_started", ...fromForm(fd) });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  await db.insert(timelineTasks).values({
    clientId,
    name: v.name,
    dueDate: v.dueDate,
    dueDateManual: true,
    owner: v.owner,
    status: v.status,
    completedAt: completedAtFor(v.status),
    phase: v.phase ?? "Added by hand",
    phaseOrder: 999,
    sortOrder: 999,
    notes: v.notes,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  await requireUser();
  if (!uuid.safeParse(taskId).success) return { ok: false, error: "Invalid task." };
  await db.delete(timelineTasks).where(eq(timelineTasks.id, taskId));
  revalidatePath("/", "layout");
  return { ok: true };
}
