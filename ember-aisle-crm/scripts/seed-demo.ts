/**
 * Fills a LOCAL database with fictional demo data for development and demos.
 * Refuses to run against anything that isn't localhost, so it can never
 * touch real client data.
 *
 *   npm run db:seed-demo
 *
 * Creates two logins (password: "ember-and-aisle-demo"):
 *   fabian@demo.local, davinia@demo.local
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as s from "../src/db/schema";
import { addDays, todayISO, addMonths } from "../src/lib/dates";
import { buildTimeline } from "../src/lib/timeline-templates";
import { calculateFee } from "../src/lib/fees";

const url = process.env.DATABASE_URL ?? "";
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
})();
if (!["localhost", "127.0.0.1"].includes(host)) {
  console.error(`Refusing to seed demo data into a non-local database (${host || "unknown host"}).`);
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });
const db = drizzle(sql, { schema: s });
const today = todayISO();

async function main() {
  await db.delete(s.clients);
  await db.delete(s.vendors);
  await db.delete(s.users);
  await db.delete(s.loginAttempts);

  const hash = await bcrypt.hash("ember-and-aisle-demo", 12);
  await db.insert(s.users).values([
    { name: "Fabian", email: "fabian@demo.local", passwordHash: hash, person: "fabian" },
    { name: "Davinia", email: "davinia@demo.local", passwordHash: hash, person: "davinia" },
  ]);

  const vendorRows = await db
    .insert(s.vendors)
    .values([
      { name: "Villa Aurelia", category: "venue", country: "italy", region: "Lake Como", status: "approved", contactName: "Giulia R.", email: "events@villa-aurelia.example", publicLiabilityConfirmedOn: "2026-03-02", referencesCheckedOn: "2026-03-10", responseTimeTestedOn: "2026-02-20", pricingTerms: "Exclusive use from €18,000. 30% deposit." },
      { name: "Cucina di Lago", category: "catering", country: "italy", region: "Lake Como", status: "approved", publicLiabilityConfirmedOn: "2026-03-05", tastingAttendedOn: "2026-04-12", referencesCheckedOn: "2026-03-15", responseTimeTestedOn: "2026-03-01", pricingTerms: "€145 pp, 3 courses. 10% trade discount." },
      { name: "Luce Studio", category: "photo_video", country: "italy", region: "Milan", status: "prospective", referencesCheckedOn: "2026-05-01" },
      { name: "Adriatic Table", category: "catering", country: "croatia", region: "Dubrovnik", status: "approved", tastingAttendedOn: "2026-05-20", publicLiabilityConfirmedOn: "2026-05-02" },
      { name: "Kotor Bay Estate", category: "venue", country: "montenegro", region: "Kotor", status: "prospective" },
      { name: "Petal & Brush", category: "hair_makeup", country: "uk", region: "London", status: "approved", publicLiabilityConfirmedOn: "2026-01-12", referencesCheckedOn: "2026-01-20", responseTimeTestedOn: "2026-01-08" },
      { name: "Savile Tailoring Co.", category: "suits_dresswear", country: "uk", region: "London", status: "approved", referencesCheckedOn: "2026-02-02" },
      { name: "Bodega Sol", category: "wine_drinks", country: "spain", region: "Mallorca", status: "approved", tastingAttendedOn: "2026-06-03" },
      { name: "Sugar Loaf Cakes", category: "cake", country: "uk", region: "Bath", status: "do_not_use", notes: "Missed a delivery slot in 2025. Do not rebook." },
    ])
    .returning();
  const v = Object.fromEntries(vendorRows.map((r) => [r.name, r]));

  const couples = [
    { a: "Sofia", b: "James", tier: "full" as const, country: "italy" as const, venue: "Villa Aurelia", wedding: addMonths(today, 10), booked: addMonths(today, -3), lead: "joint" as const, budget: 85_000_00, fw: true, stage: "planning" as const, guests: 110 },
    { a: "Amara", b: "Luca", tier: "partial" as const, country: "croatia" as const, venue: "Lokrum Terrace", wedding: addDays(today, 50), booked: addMonths(today, -5), lead: "davinia" as const, budget: 40_000_00, fw: false, stage: "planning" as const, guests: 70 },
    { a: "Hannah", b: "Omar", tier: "day_of" as const, country: "uk" as const, venue: "The Old Rectory, Bath", wedding: addDays(today, 12), booked: addDays(today, -45), lead: "fabian" as const, budget: null, fw: true, stage: "booked" as const, guests: 90 },
    { a: "Elena", b: "Marco", tier: "full" as const, country: "spain" as const, venue: "Finca Es Molí", wedding: addDays(today, -5), booked: addMonths(today, -14), lead: "joint" as const, budget: 60_000_00, fw: true, stage: "planning" as const, guests: 140 },
  ];

  for (const c of couples) {
    const fee = calculateFee({
      tier: c.tier,
      feeStructure: c.tier === "full" ? "percent_of_budget" : "flat",
      flatFee: c.tier === "partial" ? 3_800_00 : 1_650_00,
      weddingBudget: c.budget,
      destinationSurcharge: c.country === "uk" ? 0 : 750_00,
    });
    if (!fee.ok) throw new Error(fee.error);
    const [client] = await db
      .insert(s.clients)
      .values({
        partnerOneName: c.a,
        partnerTwoName: c.b,
        email: `${c.a.toLowerCase()}@example.com`,
        phone: "+44 7700 900000",
        weddingDate: c.wedding,
        bookedOn: c.booked,
        venueName: c.venue,
        country: c.country,
        guestCount: c.guests,
        tier: c.tier,
        addonFoodWine: c.fw,
        feeStructure: c.tier === "full" ? "percent_of_budget" : "flat",
        weddingBudgetPence: c.budget,
        baseFeePence: fee.baseFee,
        destinationSurchargePence: fee.surcharge,
        totalFeePence: fee.totalFee,
        stage: c.stage,
        lead: c.lead,
      })
      .returning();

    const tasks = buildTimeline({
      tier: c.tier,
      addonFoodWine: c.fw,
      country: c.country,
      bookedOn: c.booked,
      weddingDate: c.wedding,
    });
    await db.insert(s.timelineTasks).values(
      tasks.map((t) => ({
        ...t,
        clientId: client.id,
        // Pretend work up to ~3 weeks ago is done, so there's a realistic mix.
        status: (t.dueDate < addDays(today, -21) ? "done" : "not_started") as "done" | "not_started",
        completedAt: t.dueDate < addDays(today, -21) ? new Date() : null,
      })),
    );

    const third = Math.round(fee.totalFee / 3);
    await db.insert(s.payments).values([
      { clientId: client.id, type: "deposit", amountPence: third, dueDate: c.booked, paidDate: c.booked, method: "bank_transfer" },
      { clientId: client.id, type: "milestone", amountPence: third, dueDate: addDays(today, c.a === "Amara" ? -6 : 30) },
      { clientId: client.id, type: "balance", amountPence: fee.totalFee - 2 * third, dueDate: addDays(c.wedding, -28) },
    ]);
  }

  const [sofia] = await db.select().from(s.clients).where(eq(s.clients.partnerOneName, "Sofia"));
  await db.insert(s.vendorAssignments).values([
    { clientId: sofia.id, vendorId: v["Villa Aurelia"].id, category: "venue", status: "confirmed", owner: "joint", contractRef: "VA-2027-014", depositRef: "DEP-8812" },
    { clientId: sofia.id, vendorId: v["Cucina di Lago"].id, category: "catering", status: "booked", owner: "fabian" },
    { clientId: sofia.id, vendorId: v["Luce Studio"].id, category: "photo_video", status: "shortlisted", owner: "joint" },
  ]);
  await db.insert(s.budgetLines).values([
    { clientId: sofia.id, category: "venue", description: "Exclusive use, 2 nights", committedPence: 21_000_00, actualPence: 21_000_00, vendorId: v["Villa Aurelia"].id },
    { clientId: sofia.id, category: "catering", description: "110 guests, 3 courses", committedPence: 16_500_00, actualPence: 17_600_00, vendorId: v["Cucina di Lago"].id },
    { clientId: sofia.id, category: "photo_video", committedPence: 6_000_00 },
    { clientId: sofia.id, category: "florals_styling", committedPence: 8_000_00, actualPence: 7_450_00 },
  ]);

  console.log("Demo data ready. Sign in as fabian@demo.local / ember-and-aisle-demo");
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
