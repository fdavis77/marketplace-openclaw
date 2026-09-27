"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { regenerateTimeline } from "@/actions/clients";
import { createTask, deleteTask, updateTask } from "@/actions/tasks";
import { ActionForm, SubmitButton } from "@/components/forms";
import { TaskCheck } from "@/components/task-check";
import { useAction } from "@/components/use-action";
import {
  Button,
  Card,
  Chip,
  cx,
  EmptyState,
  options,
  OwnerChip,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui";
import type { TimelineTask } from "@/db/schema";
import {
  isMine,
  OWNERS,
  OWNER_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Person,
} from "@/lib/domain";
import { formatShortDate } from "@/lib/dates";
import { reveal, transition } from "@/lib/motion";

const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const monthLabel = (iso: string) => monthFmt.format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`));

export function TimelinePanel({
  clientId,
  tasks,
  today,
  person,
}: {
  clientId: string;
  tasks: TimelineTask[];
  today: string;
  person: Person;
}) {
  const [who, setWho] = useState<"all" | "mine">("all");
  const [hideDone, setHideDone] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const rebuild = useAction();

  const done = tasks.filter((t) => t.status === "done").length;
  const visible = tasks.filter(
    (t) => (who === "all" || isMine(t.owner, person)) && (!hideDone || t.status !== "done"),
  );
  const groups = useMemo(() => {
    const m = new Map<string, TimelineTask[]>();
    for (const t of visible) {
      const k = t.dueDate.slice(0, 7);
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return [...m.entries()];
  }, [visible]);

  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="tabular font-semibold">{done}</span> of {tasks.length} done
          </span>
          <span className="tabular text-ink-soft">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ivory ring-1 ring-line">
          <motion.div
            className="h-full rounded-full bg-good"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={transition.data}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Whose tasks" className="inline-flex rounded-full border border-line bg-ivory p-0.5 text-sm">
            {(["all", "mine"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={who === k}
                onClick={() => setWho(k)}
                className={cx("rounded-full px-3 py-1 transition-brand", who === k ? "bg-ink text-ivory" : "text-ink-soft")}
              >
                {k === "all" ? "All" : "Mine"}
              </button>
            ))}
          </div>
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="h-4 w-4 accent-ember" />
            Hide done
          </label>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => setAdding((v) => !v)}>
              + Add task
            </Button>
            <Button
              variant="ghost"
              disabled={rebuild.pending}
              onClick={() =>
                rebuild.run(() => regenerateTimeline(clientId), {
                  confirm:
                    "Rebuild from the tier template? Missing template tasks are added and open tasks re-dated. Tasks you've dated by hand, started or finished are kept.",
                })
              }
            >
              {rebuild.pending ? "Rebuilding…" : "Rebuild from template"}
            </Button>
          </div>
        </div>
        {(rebuild.message || rebuild.error) && (
          <p role="status" className={cx("mt-2 text-sm", rebuild.error ? "text-over" : "text-good")}>
            {rebuild.error ?? rebuild.message}
          </p>
        )}
      </Card>

      <AnimatePresence initial={false}>
        {adding && (
          <motion.div key="add" {...reveal} className="overflow-hidden">
            <Card className="p-4">
              <h3 className="mb-3 text-lg">New task</h3>
              <ActionForm action={createTask.bind(null, clientId)} resetOnSuccess onSuccess={() => setAdding(false)}>
                {(e, pending) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Task" name="name" error={e.name} className="sm:col-span-2" required />
                    <TextField label="Due" name="dueDate" type="date" defaultValue={today} error={e.dueDate} required />
                    <SelectField label="Owner" name="owner" defaultValue={person} options={options(OWNERS, OWNER_LABELS)} />
                    <TextField label="Phase (optional)" name="phase" error={e.phase} placeholder="e.g. Final month" />
                    <div className="flex items-end justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                        Cancel
                      </Button>
                      <SubmitButton pending={pending}>Add task</SubmitButton>
                    </div>
                  </div>
                )}
              </ActionForm>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {groups.length === 0 ? (
        <EmptyState>{tasks.length ? "No tasks match these filters." : "No tasks yet."}</EmptyState>
      ) : (
        groups.map(([month, list]) => (
          <Card key={month} className="p-2 sm:p-3">
            <h3 className="px-2 pb-1 pt-2 font-display text-lg text-gold-ink">{monthLabel(list[0].dueDate)}</h3>
            <ul className="divide-y divide-line">
              {list.map((t) => (
                <TaskRow
                  // Re-key on status so local optimistic state resets when the server catches up.
                  key={`${t.id}:${t.status}`}
                  task={t}
                  today={today}
                  editing={editing === t.id}
                  onEdit={() => setEditing(editing === t.id ? null : t.id)}
                  onClose={() => setEditing(null)}
                />
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}

function TaskRow({
  task: t,
  today,
  editing,
  onEdit,
  onClose,
}: {
  task: TimelineTask;
  today: string;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [doneLocal, setDoneLocal] = useState<boolean | null>(null);
  const done = doneLocal ?? t.status === "done";
  const overdue = !done && t.dueDate < today;
  const del = useAction();

  return (
    <li className="px-1 py-1">
      <div className="flex items-start gap-3 px-1 py-1.5">
        <div className="pt-0.5">
          <TaskCheck taskId={t.id} status={t.status} label={t.name} onChange={setDoneLocal} />
        </div>
        <button type="button" onClick={onEdit} aria-expanded={editing} className="min-w-0 flex-1 text-left">
          <span
            className={cx(
              "block text-sm leading-snug transition-brand",
              done && "text-ink-soft line-through decoration-gold/70",
            )}
          >
            {t.name}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
            <span className={cx("tabular", overdue && "font-medium text-over")}>
              {t.dueDate === today ? "Today" : formatShortDate(t.dueDate)}
              {overdue && " · overdue"}
            </span>
            <OwnerChip owner={t.owner} />
            {t.status === "in_progress" && <Chip tone="gold">In progress</Chip>}
            <span className="hidden sm:inline">{t.phase}</span>
            {t.dueDateManual && t.templateKey && <span title="Date set by hand — rebuilds won't move it">📌</span>}
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div key="edit" {...reveal} className="overflow-hidden">
            <div className="mx-1 mb-2 rounded-xl bg-ivory p-3">
              <ActionForm action={updateTask.bind(null, t.id)} onSuccess={onClose}>
                {(e, pending) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Task" name="name" defaultValue={t.name} error={e.name} className="sm:col-span-2" />
                    <TextField label="Due" name="dueDate" type="date" defaultValue={t.dueDate} error={e.dueDate} />
                    <SelectField label="Owner" name="owner" defaultValue={t.owner} options={options(OWNERS, OWNER_LABELS)} />
                    <SelectField label="Status" name="status" defaultValue={t.status} options={options(TASK_STATUSES, TASK_STATUS_LABELS)} />
                    <TextField label="Phase" name="phase" defaultValue={t.phase} />
                    <TextAreaField label="Notes" name="notes" defaultValue={t.notes ?? ""} className="sm:col-span-2" />
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
                      <Button
                        type="button"
                        variant="danger"
                        disabled={del.pending}
                        onClick={() => del.run(() => deleteTask(t.id), { confirm: `Delete “${t.name}”?` })}
                      >
                        Delete
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
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
