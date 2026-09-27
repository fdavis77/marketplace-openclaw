import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { DB } from "@/db";
import { clients, timelineTasks } from "@/db/schema";
import { buildTimeline, planTimelineSync } from "@/lib/timeline-templates";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/**
 * Regenerates a booking's template tasks from its current tier, dates and
 * add-ons, preserving work already done (see planTimelineSync).
 */
export async function syncTimeline(tx: Tx, clientId: string) {
  const [c] = await tx.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!c) return { inserted: 0, updated: 0, deleted: 0 };

  const generated = buildTimeline({
    tier: c.tier,
    addonFoodWine: c.addonFoodWine,
    country: c.country,
    bookedOn: c.bookedOn,
    weddingDate: c.weddingDate,
  });
  const existing = await tx
    .select({
      id: timelineTasks.id,
      templateKey: timelineTasks.templateKey,
      status: timelineTasks.status,
      dueDateManual: timelineTasks.dueDateManual,
      dueDate: timelineTasks.dueDate,
    })
    .from(timelineTasks)
    .where(eq(timelineTasks.clientId, clientId));

  const plan = planTimelineSync(existing, generated);

  if (plan.deleteIds.length) {
    await tx.delete(timelineTasks).where(inArray(timelineTasks.id, plan.deleteIds));
  }
  if (plan.inserts.length) {
    await tx.insert(timelineTasks).values(plan.inserts.map((g) => ({ ...g, clientId })));
  }
  for (const u of plan.updates) {
    await tx
      .update(timelineTasks)
      .set({ dueDate: u.dueDate, phase: u.phase, phaseOrder: u.phaseOrder, sortOrder: u.sortOrder })
      .where(eq(timelineTasks.id, u.id));
  }
  return { inserted: plan.inserts.length, updated: plan.updates.length, deleted: plan.deleteIds.length };
}
