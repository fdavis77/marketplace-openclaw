import type { Country, Owner, TaskStatus, Tier } from "./domain";
import { addDays, addMonths, type ISODate } from "./dates";

/**
 * Tier-specific delivery timelines.
 *
 * Each template task is anchored to either the booking date or the wedding
 * date. Where the brief gives a window ("months 6–4", "3–2 weeks out") the
 * task is due at the END of that window — the latest it can safely land.
 * The one exception is "Secure venue", due at the START of its window,
 * because every other supplier depends on it.
 *
 * Any due date that would fall before the booking date is pulled forward to
 * the booking date (short-notice bookings get a front-loaded list rather
 * than tasks that are overdue on day one). Recurring check-ins that fall
 * before booking are skipped instead.
 */

type Anchor =
  | { from: "booking"; days?: number; months?: number }
  | { from: "wedding"; days?: number; months?: number };

type Ctx = {
  tier: Tier;
  addonFoodWine: boolean;
  country: Country;
  bookedOn: ISODate;
  weddingDate: ISODate;
};

type TemplateTask = {
  key: string;
  name: string;
  owner: Owner;
  due: Anchor;
  /** Omit (rather than clamp) when the date falls before booking. */
  skipIfBeforeBooking?: boolean;
  when?: (ctx: Ctx) => boolean;
};

type Phase = { name: string; tasks: TemplateTask[] };

export type GeneratedTask = {
  templateKey: string;
  name: string;
  phase: string;
  phaseOrder: number;
  sortOrder: number;
  owner: Owner;
  dueDate: ISODate;
};

// ── Tier 3 — Day-of Coordination ─────────────────────────────────────────

function tier3Phases(embedded: boolean): Phase[] {
  return [
    {
      name: "Coordination handover",
      tasks: [
        embedded
          ? {
              key: "t3.collect",
              name: "Compile final vendor list, contracts and floor plan for the day",
              owner: "joint",
              due: { from: "wedding", days: -56 },
            }
          : {
              key: "t3.collect",
              name: "Collect existing vendor list, contracts and floor plan",
              owner: "joint",
              due: { from: "booking", days: 7 },
            },
      ],
    },
    {
      name: "Final month",
      tasks: [
        {
          key: "t3.walkthrough",
          name: "Walkthrough with couple — confirm layout, running order, special moments",
          owner: "joint",
          due: { from: "wedding", days: -28 },
        },
        {
          key: "t3.vendors",
          name: "Contact all vendors — confirm times, deliveries, requirements, payment status",
          owner: "joint",
          due: { from: "wedding", days: -14 },
        },
      ],
    },
    {
      name: "Final week",
      tasks: [
        {
          key: "t3.runsheet",
          name: "Finalise and circulate run sheet to vendors, wedding party and couple",
          owner: "joint",
          due: { from: "wedding", days: -7 },
        },
        {
          key: "t3.setup",
          name: "Site and setup check",
          owner: "joint",
          due: { from: "wedding", days: -1 },
        },
      ],
    },
    {
      name: "Wedding day",
      tasks: [
        {
          key: "t3.day",
          name: "Wedding day coordination",
          owner: "joint",
          due: { from: "wedding", days: 0 },
        },
      ],
    },
    {
      name: "After the wedding",
      tasks: [
        {
          key: "t3.debrief",
          name: "Debrief, testimonial request, photo/video consent",
          owner: "joint",
          due: { from: "wedding", days: 7 },
        },
      ],
    },
  ];
}

// ── Tier 2 — Partial Planning ────────────────────────────────────────────

const tier2Audit: Phase = {
  name: "Planning audit",
  tasks: [
    {
      key: "t2.audit",
      name: "Planning audit — confirm Schedule 1 vendor categories and set budget",
      owner: "joint",
      due: { from: "booking", days: 14 },
    },
  ],
};

// Shortlists are split by who leads each category so "mine" means something.
const tier2Shortlists: Phase = {
  name: "Shortlists (months 6–4)",
  tasks: [
    {
      key: "t2.shortlist.venue_photo",
      name: "Source and present shortlists — venue, photography/videography",
      owner: "joint",
      due: { from: "wedding", months: -4 },
    },
    {
      key: "t2.shortlist.food",
      name: "Source and present shortlists — catering, cake, wine & drinks",
      owner: "fabian",
      due: { from: "wedding", months: -4 },
    },
    {
      key: "t2.shortlist.bride",
      name: "Source and present shortlists — dress, hair & makeup",
      owner: "davinia",
      due: { from: "wedding", months: -4 },
    },
    {
      key: "t2.shortlist.groom",
      name: "Source and present shortlists — suits and grooming",
      owner: "fabian",
      due: { from: "wedding", months: -4 },
    },
  ],
};

const tier2Confirmation: Phase[] = [
  {
    name: "Confirmation (months 4–3)",
    tasks: [
      {
        key: "t2.confirm",
        name: "Confirm bookings and collect vendor contracts",
        owner: "joint",
        due: { from: "wedding", months: -3 },
      },
    ],
  },
  {
    name: "Styling & timeline (months 3–2)",
    tasks: [
      {
        key: "t2.styling",
        name: "Build styling plan",
        owner: "davinia",
        due: { from: "wedding", months: -2 },
      },
      {
        key: "t2.timeline",
        name: "Draft wedding-day timeline",
        owner: "joint",
        due: { from: "wedding", months: -2 },
      },
    ],
  },
];

// ── Tier 1 — Full Planning ───────────────────────────────────────────────

const tier1Phases: Phase[] = [
  {
    name: "Discovery",
    tasks: [
      {
        key: "t1.discovery",
        name: "Discovery consultation — concept, budget, guest count, destination legal/travel notes",
        owner: "joint",
        due: { from: "booking", months: 1 },
      },
    ],
  },
  {
    name: "Venue & core suppliers (months 12–9)",
    tasks: [
      {
        key: "t1.venue",
        name: "Secure venue",
        owner: "joint",
        due: { from: "wedding", months: -12 },
      },
      {
        key: "t1.catering",
        name: "Begin catering sourcing",
        owner: "fabian",
        due: { from: "wedding", months: -9 },
      },
      {
        key: "t1.photo",
        name: "Begin photography/videography sourcing",
        owner: "joint",
        due: { from: "wedding", months: -9 },
      },
      {
        key: "t1.cake",
        name: "Begin cake sourcing",
        owner: "fabian",
        due: { from: "wedding", months: -9 },
      },
    ],
  },
  {
    name: "Remaining suppliers & design (months 9–6)",
    tasks: [
      {
        key: "t1.bride",
        name: "Source bride-side — dress, hair & makeup",
        owner: "davinia",
        due: { from: "wedding", months: -6 },
      },
      {
        key: "t1.groom",
        name: "Source groom-side — suits and grooming",
        owner: "fabian",
        due: { from: "wedding", months: -6 },
      },
      {
        key: "t1.wine",
        name: "Source wine & drinks",
        owner: "fabian",
        due: { from: "wedding", months: -6 },
      },
      {
        key: "t1.design",
        name: "Set design and styling direction",
        owner: "davinia",
        due: { from: "wedding", months: -6 },
      },
      ...[8, 7, 6].map(
        (m): TemplateTask => ({
          key: `t1.checkin.${m}`,
          name: `Monthly check-in with couple (${m} months out)`,
          owner: "joint",
          due: { from: "wedding", months: -m },
          skipIfBeforeBooking: true,
        }),
      ),
    ],
  },
  {
    name: "Budget & logistics (months 6–3)",
    tasks: [
      {
        key: "t1.budget",
        name: "Budget review — committed vs actual across all categories",
        owner: "joint",
        due: { from: "wedding", months: -3 },
      },
      {
        key: "t1.accommodation",
        name: "Destination logistics — guest and couple accommodation",
        owner: "joint",
        due: { from: "wedding", months: -3 },
      },
      {
        key: "t1.transport",
        name: "Destination logistics — transport",
        owner: "joint",
        due: { from: "wedding", months: -3 },
      },
      {
        key: "t1.permits",
        name: "Destination logistics — permits and legal paperwork",
        owner: "joint",
        due: { from: "wedding", months: -3 },
        when: (ctx) => ctx.country !== "uk",
      },
    ],
  },
];

// ── Add-on — Food & Wine Curation (Fabian) ───────────────────────────────

const foodWinePhase: Phase = {
  name: "Food & wine curation",
  tasks: [
    {
      key: "fw.brief",
      name: "Food & wine brief with couple — tastes, dietary needs, service style",
      owner: "fabian",
      due: { from: "wedding", days: -84 },
    },
    {
      key: "fw.tasting",
      name: "Menu tasting and wine pairing session",
      owner: "fabian",
      due: { from: "wedding", days: -56 },
    },
    {
      key: "fw.final",
      name: "Sign off final menu, wine list and quantities with caterer",
      owner: "fabian",
      due: { from: "wedding", days: -28 },
    },
  ],
};

function phasesFor(ctx: Ctx): Phase[] {
  const phases: Phase[] =
    ctx.tier === "day_of"
      ? tier3Phases(false)
      : ctx.tier === "partial"
        ? [tier2Audit, tier2Shortlists, ...tier2Confirmation, ...tier3Phases(true)]
        : [...tier1Phases, ...tier2Confirmation, ...tier3Phases(true)];
  if (ctx.addonFoodWine) phases.push(foodWinePhase);
  return phases;
}

function resolve(anchor: Anchor, ctx: Ctx): ISODate {
  const base = anchor.from === "booking" ? ctx.bookedOn : ctx.weddingDate;
  let d = base;
  if (anchor.months) d = addMonths(d, anchor.months);
  if (anchor.days) d = addDays(d, anchor.days);
  return d;
}

export function buildTimeline(ctx: Ctx): GeneratedTask[] {
  const out: GeneratedTask[] = [];
  let sortOrder = 0;
  phasesFor(ctx).forEach((phase, phaseOrder) => {
    for (const t of phase.tasks) {
      if (t.when && !t.when(ctx)) continue;
      const raw = resolve(t.due, ctx);
      if (raw < ctx.bookedOn && t.skipIfBeforeBooking) continue;
      out.push({
        templateKey: t.key,
        name: t.name,
        phase: phase.name,
        phaseOrder,
        sortOrder: sortOrder++,
        owner: t.owner,
        // Never due before the booking existed.
        dueDate: raw < ctx.bookedOn ? ctx.bookedOn : raw,
      });
    }
  });
  return out;
}

// ── Syncing a regenerated timeline onto existing tasks ───────────────────

export type ExistingTask = {
  id: string;
  templateKey: string | null;
  status: TaskStatus;
  dueDateManual: boolean;
  dueDate: ISODate;
};

export type TimelineSyncPlan = {
  inserts: GeneratedTask[];
  updates: { id: string; dueDate: ISODate; phase: string; phaseOrder: number; sortOrder: number }[];
  deleteIds: string[];
};

/**
 * Brings a booking's tasks in line with its current tier / dates / add-ons
 * without losing anyone's work:
 *  - custom tasks (no template key) are never touched;
 *  - new template tasks are added;
 *  - open template tasks get fresh due dates, unless someone set the date by hand;
 *  - template tasks no longer in the plan are removed only if not started —
 *    anything in progress or done stays, because it records real work.
 *  - names and owners are never overwritten, so edits survive.
 */
export function planTimelineSync(
  existing: ExistingTask[],
  generated: GeneratedTask[],
): TimelineSyncPlan {
  const byKey = new Map<string, ExistingTask>();
  for (const t of existing) if (t.templateKey) byKey.set(t.templateKey, t);

  const wanted = new Set(generated.map((g) => g.templateKey));
  const plan: TimelineSyncPlan = { inserts: [], updates: [], deleteIds: [] };

  for (const g of generated) {
    const cur = byKey.get(g.templateKey);
    if (!cur) {
      plan.inserts.push(g);
    } else if (cur.status !== "done") {
      plan.updates.push({
        id: cur.id,
        dueDate: cur.dueDateManual ? cur.dueDate : g.dueDate,
        phase: g.phase,
        phaseOrder: g.phaseOrder,
        sortOrder: g.sortOrder,
      });
    }
  }

  for (const t of existing) {
    if (t.templateKey && !wanted.has(t.templateKey) && t.status === "not_started") {
      plan.deleteIds.push(t.id);
    }
  }
  return plan;
}
