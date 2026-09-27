import { describe, expect, it } from "vitest";
import { addDays, addMonths, isISODate, todayISO } from "../dates";
import { formatGBP, parsePounds, penceToInput } from "../money";
import { calculateFee } from "../fees";
import { paymentStatus, summarisePayments } from "../payments";
import { lineVariance, summariseBudget } from "../budget";
import { buildTimeline, planTimelineSync, type ExistingTask } from "../timeline-templates";

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("clamps month arithmetic to month end", () => {
    expect(addMonths("2027-03-31", -1)).toBe("2027-02-28");
    expect(addMonths("2028-03-31", -1)).toBe("2028-02-29");
    expect(addMonths("2027-06-15", -12)).toBe("2026-06-15");
  });
  it("validates ISO dates strictly", () => {
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-2-3")).toBe(false);
    expect(isISODate("2026-02-28")).toBe(true);
  });
  it("uses London time for today", () => {
    // 23:30 UTC on 30 June is 00:30 on 1 July in London (BST).
    expect(todayISO(new Date("2026-06-30T23:30:00Z"))).toBe("2026-07-01");
    // In winter London is UTC.
    expect(todayISO(new Date("2026-12-30T23:30:00Z"))).toBe("2026-12-30");
  });
});

describe("money", () => {
  it("parses pounds to pence", () => {
    expect(parsePounds("£1,250.50")).toBe(125050);
    expect(parsePounds("1250.5")).toBe(125050);
    expect(parsePounds("0.07")).toBe(7);
    expect(parsePounds("")).toBeNull();
    expect(parsePounds("12.345")).toBeNaN();
    expect(parsePounds("abc")).toBeNaN();
  });
  it("round-trips for inputs", () => {
    expect(penceToInput(125050)).toBe("1250.50");
    expect(penceToInput(125000)).toBe("1250");
    expect(penceToInput(5)).toBe("0.05");
  });
  it("formats GBP", () => {
    expect(formatGBP(550000)).toBe("£5,500");
    expect(formatGBP(125050)).toBe("£1,250.50");
    expect(formatGBP(null)).toBe("—");
  });
});

describe("fees", () => {
  const base = { tier: "full" as const, flatFee: null, weddingBudget: null, destinationSurcharge: null };
  it("applies the £5,500 minimum on 10% pricing", () => {
    const r = calculateFee({ ...base, feeStructure: "percent_of_budget", weddingBudget: 40_000_00 });
    expect(r).toMatchObject({ ok: true, baseFee: 5_500_00, minimumApplied: true, totalFee: 5_500_00 });
  });
  it("uses 10% when above the minimum, plus surcharge", () => {
    const r = calculateFee({
      ...base,
      feeStructure: "percent_of_budget",
      weddingBudget: 80_000_00,
      destinationSurcharge: 1_000_00,
    });
    expect(r).toMatchObject({ ok: true, baseFee: 8_000_00, surcharge: 1_000_00, totalFee: 9_000_00 });
  });
  it("rejects percent pricing outside Tier 1", () => {
    const r = calculateFee({ ...base, tier: "partial", feeStructure: "percent_of_budget", weddingBudget: 1 });
    expect(r.ok).toBe(false);
  });
  it("handles flat fees", () => {
    const r = calculateFee({ ...base, tier: "day_of", feeStructure: "flat", flatFee: 1_800_00 });
    expect(r).toMatchObject({ ok: true, totalFee: 1_800_00 });
  });
});

describe("payments", () => {
  const today = "2026-09-27";
  it("derives status from dates", () => {
    expect(paymentStatus({ dueDate: "2026-09-26", paidDate: null }, today)).toBe("overdue");
    expect(paymentStatus({ dueDate: "2026-09-27", paidDate: null }, today)).toBe("due");
    expect(paymentStatus({ dueDate: "2026-10-04", paidDate: null }, today)).toBe("due");
    expect(paymentStatus({ dueDate: "2026-10-05", paidDate: null }, today)).toBe("upcoming");
    expect(paymentStatus({ dueDate: "2026-01-01", paidDate: "2026-01-02" }, today)).toBe("paid");
  });
  it("summarises", () => {
    const s = summarisePayments(
      [
        { amount: 100, dueDate: "2026-01-01", paidDate: "2026-01-01" },
        { amount: 200, dueDate: "2026-09-01", paidDate: null },
        { amount: 300, dueDate: "2027-01-01", paidDate: null },
      ],
      today,
    );
    expect(s).toEqual({ scheduled: 600, paid: 100, outstanding: 500, overdue: 200 });
  });
});

describe("budget", () => {
  it("classifies variance with a 2% tolerance", () => {
    expect(lineVariance(10000, null)).toBe("pending");
    expect(lineVariance(10000, 10150)).toBe("on_track");
    expect(lineVariance(10000, 10300)).toBe("over");
    expect(lineVariance(10000, 9000)).toBe("under");
  });
  it("compares actuals only against lines that have actuals", () => {
    const s = summariseBudget(
      [
        { committed: 10000, actual: 11000 },
        { committed: 50000, actual: null },
      ],
      100000,
    );
    expect(s.committed).toBe(60000);
    expect(s.committedWithActuals).toBe(10000);
    expect(s.variance).toBe("over");
    expect(s.targetVariance).toBe("under");
  });
});

describe("timeline templates", () => {
  const ctx = {
    addonFoodWine: false,
    country: "italy" as const,
    bookedOn: "2026-09-27",
  };

  it("Tier 3 produces the seven day-of steps", () => {
    const t = buildTimeline({ ...ctx, tier: "day_of", weddingDate: "2026-11-21" });
    expect(t.map((x) => x.templateKey)).toEqual([
      "t3.collect",
      "t3.walkthrough",
      "t3.vendors",
      "t3.runsheet",
      "t3.setup",
      "t3.day",
      "t3.debrief",
    ]);
    const due = Object.fromEntries(t.map((x) => [x.templateKey, x.dueDate]));
    expect(due["t3.collect"]).toBe("2026-10-04"); // booking + 1 week
    expect(due["t3.walkthrough"]).toBe("2026-10-24"); // 4 weeks out
    expect(due["t3.vendors"]).toBe("2026-11-07"); // 2 weeks out (end of 3–2 window)
    expect(due["t3.runsheet"]).toBe("2026-11-14");
    expect(due["t3.setup"]).toBe("2026-11-20");
    expect(due["t3.day"]).toBe("2026-11-21");
    expect(due["t3.debrief"]).toBe("2026-11-28");
  });

  it("Tier 2 = audit, shortlists, confirmation, styling, then Tier 3 from 8 weeks", () => {
    const t = buildTimeline({ ...ctx, tier: "partial", weddingDate: "2027-06-12" });
    const keys = t.map((x) => x.templateKey);
    expect(keys[0]).toBe("t2.audit");
    expect(keys).toContain("t2.confirm");
    expect(keys).toContain("t2.styling");
    expect(keys.filter((k) => k.startsWith("t3."))).toHaveLength(7);
    const collect = t.find((x) => x.templateKey === "t3.collect")!;
    expect(collect.dueDate).toBe("2027-04-17"); // 8 weeks before
    expect(t.find((x) => x.templateKey === "t2.audit")!.dueDate).toBe("2026-10-11");
    expect(t.find((x) => x.templateKey === "t2.confirm")!.dueDate).toBe("2027-03-12");
  });

  it("Tier 1 includes discovery, Tier 2 confirmation and Tier 3, but not Tier 2 shortlists", () => {
    const t = buildTimeline({ ...ctx, tier: "full", weddingDate: "2027-09-18" });
    const keys = t.map((x) => x.templateKey);
    expect(keys[0]).toBe("t1.discovery");
    expect(keys).toContain("t2.confirm");
    expect(keys).not.toContain("t2.audit");
    expect(keys.some((k) => k.startsWith("t2.shortlist"))).toBe(false);
    expect(keys).toContain("t3.day");
    expect(keys).toContain("t1.permits"); // destination wedding
  });

  it("drops destination permits for UK weddings", () => {
    const t = buildTimeline({ ...ctx, country: "uk", tier: "full", weddingDate: "2027-09-18" });
    expect(t.map((x) => x.templateKey)).not.toContain("t1.permits");
  });

  it("clamps to booking date and skips past check-ins on short-notice Tier 1", () => {
    // 7 months' notice: venue (-12m) clamps to booking, 8-month check-in is skipped.
    const t = buildTimeline({ ...ctx, tier: "full", weddingDate: "2027-04-27" });
    expect(t.find((x) => x.templateKey === "t1.venue")!.dueDate).toBe("2026-09-27");
    expect(t.map((x) => x.templateKey)).not.toContain("t1.checkin.8");
    expect(t.map((x) => x.templateKey)).toContain("t1.checkin.6");
    for (const task of t) expect(task.dueDate >= ctx.bookedOn).toBe(true);
  });

  it("adds Food & Wine Curation tasks owned by Fabian", () => {
    const t = buildTimeline({ ...ctx, addonFoodWine: true, tier: "day_of", weddingDate: "2026-12-19" });
    const fw = t.filter((x) => x.templateKey.startsWith("fw."));
    expect(fw).toHaveLength(3);
    expect(fw.every((x) => x.owner === "fabian")).toBe(true);
  });

  it("gives every task a unique key", () => {
    for (const tier of ["full", "partial", "day_of"] as const) {
      const t = buildTimeline({ ...ctx, addonFoodWine: true, tier, weddingDate: "2028-06-01" });
      expect(new Set(t.map((x) => x.templateKey)).size).toBe(t.length);
    }
  });
});

describe("timeline sync", () => {
  const ctx = { addonFoodWine: false, country: "italy" as const, bookedOn: "2026-09-27" };

  it("re-dates open tasks, respects manual dates and keeps done tasks", () => {
    const before = buildTimeline({ ...ctx, tier: "day_of", weddingDate: "2026-11-21" });
    const existing: ExistingTask[] = before.map((g, i) => ({
      id: `id${i}`,
      templateKey: g.templateKey,
      status: g.templateKey === "t3.collect" ? "done" : "not_started",
      dueDateManual: g.templateKey === "t3.setup",
      dueDate: g.dueDate,
    }));
    const after = buildTimeline({ ...ctx, tier: "day_of", weddingDate: "2026-11-28" });
    const plan = planTimelineSync(existing, after);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.deleteIds).toHaveLength(0);
    const upd = Object.fromEntries(plan.updates.map((u) => [u.id, u.dueDate]));
    const idOf = (k: string) => existing.find((e) => e.templateKey === k)!.id;
    expect(upd[idOf("t3.collect")]).toBeUndefined(); // done → untouched
    expect(upd[idOf("t3.day")]).toBe("2026-11-28");
    expect(upd[idOf("t3.setup")]).toBe("2026-11-20"); // manual date kept
  });

  it("on tier change, removes only not-started obsolete template tasks and keeps custom tasks", () => {
    const t3 = buildTimeline({ ...ctx, tier: "day_of", weddingDate: "2027-06-12" });
    const existing: ExistingTask[] = [
      ...t3.map((g, i) => ({
        id: `id${i}`,
        templateKey: g.templateKey,
        status: (g.templateKey === "t3.collect" ? "in_progress" : "not_started") as ExistingTask["status"],
        dueDateManual: false,
        dueDate: g.dueDate,
      })),
      { id: "custom", templateKey: null, status: "not_started", dueDateManual: false, dueDate: "2027-01-01" },
    ];
    const t2 = buildTimeline({ ...ctx, tier: "partial", weddingDate: "2027-06-12" });
    const plan = planTimelineSync(existing, t2);
    expect(plan.deleteIds).not.toContain("custom");
    expect(plan.inserts.map((i) => i.templateKey)).toContain("t2.audit");
    // t3 keys still exist in tier 2, so nothing is deleted.
    expect(plan.deleteIds).toHaveLength(0);

    // Downgrade Tier 2 → Tier 3: t2 tasks not started get removed.
    const t2Existing: ExistingTask[] = t2.map((g, i) => ({
      id: `x${i}`,
      templateKey: g.templateKey,
      status: g.templateKey === "t2.audit" ? "done" : "not_started",
      dueDateManual: false,
      dueDate: g.dueDate,
    }));
    const down = planTimelineSync(t2Existing, t3);
    const deletedKeys = down.deleteIds.map((id) => t2Existing.find((e) => e.id === id)!.templateKey);
    expect(deletedKeys).toContain("t2.confirm");
    expect(deletedKeys).not.toContain("t2.audit"); // done work is kept
  });
});
