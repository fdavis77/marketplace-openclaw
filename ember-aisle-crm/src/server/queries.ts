import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  budgetLines,
  clients,
  payments,
  postWeddingRecords,
  timelineTasks,
  vendorAssignments,
  vendors,
} from "@/db/schema";
import {
  ACTIVE_STAGES,
  type Country,
  type Person,
  type Stage,
  type Tier,
  type VendorCategory,
  type VendorStatus,
} from "@/lib/domain";
import { addDays } from "@/lib/dates";

/** "Mine" = assigned to me or joint. */
const mineOwners = (p: Person) => [p, "joint"] as ("fabian" | "davinia" | "joint")[];

// ── Dashboard ────────────────────────────────────────────────────────────

export async function getDashboard(today: string, person: Person | null) {
  const weekAhead = addDays(today, 7);
  const leadFilter = person ? inArray(clients.lead, mineOwners(person)) : undefined;
  const ownerFilter = person ? inArray(timelineTasks.owner, mineOwners(person)) : undefined;

  const [weddings, tasks, duePayments, needsSignOff] = await Promise.all([
    db
      .select({
        id: clients.id,
        partnerOneName: clients.partnerOneName,
        partnerTwoName: clients.partnerTwoName,
        weddingDate: clients.weddingDate,
        venueName: clients.venueName,
        country: clients.country,
        tier: clients.tier,
        stage: clients.stage,
        lead: clients.lead,
        // Correlated subqueries reference the outer table explicitly: drizzle
        // renders table.col unqualified here, which would bind to the inner row.
        openTasks: sql<number>`(select count(*)::int from ${timelineTasks} t where t.client_id = "clients"."id" and t.status <> 'done')`,
      })
      .from(clients)
      .where(and(inArray(clients.stage, ACTIVE_STAGES), gte(clients.weddingDate, today), leadFilter))
      .orderBy(asc(clients.weddingDate))
      .limit(20),

    // Overdue + next 7 days, open only.
    db
      .select({
        id: timelineTasks.id,
        name: timelineTasks.name,
        dueDate: timelineTasks.dueDate,
        owner: timelineTasks.owner,
        status: timelineTasks.status,
        clientId: clients.id,
        partnerOneName: clients.partnerOneName,
        partnerTwoName: clients.partnerTwoName,
      })
      .from(timelineTasks)
      .innerJoin(clients, eq(clients.id, timelineTasks.clientId))
      .where(
        and(
          ne(timelineTasks.status, "done"),
          lte(timelineTasks.dueDate, weekAhead),
          ne(clients.stage, "lost"),
          ownerFilter,
        ),
      )
      .orderBy(asc(timelineTasks.dueDate), asc(timelineTasks.sortOrder))
      .limit(60),

    // Unpaid and either overdue or due within the week.
    db
      .select({
        id: payments.id,
        type: payments.type,
        label: payments.label,
        amountPence: payments.amountPence,
        dueDate: payments.dueDate,
        clientId: clients.id,
        partnerOneName: clients.partnerOneName,
        partnerTwoName: clients.partnerTwoName,
      })
      .from(payments)
      .innerJoin(clients, eq(clients.id, payments.clientId))
      .where(and(isNull(payments.paidDate), lte(payments.dueDate, weekAhead), leadFilter))
      .orderBy(asc(payments.dueDate)),

    // Wedding has happened but nobody has marked it delivered.
    db
      .select({
        id: clients.id,
        partnerOneName: clients.partnerOneName,
        partnerTwoName: clients.partnerTwoName,
        weddingDate: clients.weddingDate,
      })
      .from(clients)
      .where(and(inArray(clients.stage, ACTIVE_STAGES), lt(clients.weddingDate, today), leadFilter))
      .orderBy(asc(clients.weddingDate)),
  ]);

  return { weddings, tasks, duePayments, needsSignOff };
}

// ── Clients ──────────────────────────────────────────────────────────────

export async function listClients(filters: {
  q?: string;
  stage?: Stage | "active" | "all";
  tier?: Tier;
  country?: Country;
}) {
  const where: (SQL | undefined)[] = [];
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    where.push(
      or(
        ilike(clients.partnerOneName, term),
        ilike(clients.partnerTwoName, term),
        ilike(clients.venueName, term),
      ),
    );
  }
  if (!filters.stage || filters.stage === "active") where.push(inArray(clients.stage, ACTIVE_STAGES));
  else if (filters.stage !== "all") where.push(eq(clients.stage, filters.stage));
  if (filters.tier) where.push(eq(clients.tier, filters.tier));
  if (filters.country) where.push(eq(clients.country, filters.country));

  return db
    .select({
      id: clients.id,
      partnerOneName: clients.partnerOneName,
      partnerTwoName: clients.partnerTwoName,
      weddingDate: clients.weddingDate,
      venueName: clients.venueName,
      country: clients.country,
      tier: clients.tier,
      stage: clients.stage,
      lead: clients.lead,
      totalFeePence: clients.totalFeePence,
    })
    .from(clients)
    .where(and(...where))
    .orderBy(filters.stage === "delivered" ? desc(clients.weddingDate) : asc(clients.weddingDate))
    .limit(500);
}

export async function getClientDetail(id: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return null;

  const [tasks, assignments, budget, pays, wrapUp, vendorOptions] = await Promise.all([
    db
      .select()
      .from(timelineTasks)
      .where(eq(timelineTasks.clientId, id))
      .orderBy(asc(timelineTasks.dueDate), asc(timelineTasks.sortOrder), asc(timelineTasks.createdAt)),
    db
      .select({
        id: vendorAssignments.id,
        category: vendorAssignments.category,
        status: vendorAssignments.status,
        owner: vendorAssignments.owner,
        contractRef: vendorAssignments.contractRef,
        depositRef: vendorAssignments.depositRef,
        notes: vendorAssignments.notes,
        vendorId: vendors.id,
        vendorName: vendors.name,
        vendorStatus: vendors.status,
        vendorCountry: vendors.country,
        vendorEmail: vendors.email,
        vendorPhone: vendors.phone,
      })
      .from(vendorAssignments)
      .innerJoin(vendors, eq(vendors.id, vendorAssignments.vendorId))
      .where(eq(vendorAssignments.clientId, id))
      .orderBy(asc(vendorAssignments.createdAt)),
    db
      .select({
        id: budgetLines.id,
        category: budgetLines.category,
        description: budgetLines.description,
        committedPence: budgetLines.committedPence,
        actualPence: budgetLines.actualPence,
        vendorId: budgetLines.vendorId,
        vendorName: vendors.name,
        notes: budgetLines.notes,
      })
      .from(budgetLines)
      .leftJoin(vendors, eq(vendors.id, budgetLines.vendorId))
      .where(eq(budgetLines.clientId, id))
      .orderBy(asc(budgetLines.createdAt)),
    db.select().from(payments).where(eq(payments.clientId, id)).orderBy(asc(payments.dueDate)),
    db.select().from(postWeddingRecords).where(eq(postWeddingRecords.clientId, id)).limit(1),
    db
      .select({
        id: vendors.id,
        name: vendors.name,
        category: vendors.category,
        country: vendors.country,
        status: vendors.status,
      })
      .from(vendors)
      .orderBy(asc(vendors.name)),
  ]);

  return { client, tasks, assignments, budget, payments: pays, wrapUp: wrapUp[0] ?? null, vendorOptions };
}

/** Everything held about a client — for subject access requests. */
export async function exportClientData(id: string) {
  const detail = await getClientDetail(id);
  if (!detail) return null;
  const { vendorOptions: _unused, ...rest } = detail;
  void _unused;
  return rest;
}

// ── Vendors ──────────────────────────────────────────────────────────────

export async function listVendors(filters: {
  q?: string;
  country?: Country;
  category?: VendorCategory;
  status?: VendorStatus;
}) {
  const where: (SQL | undefined)[] = [];
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    where.push(or(ilike(vendors.name, term), ilike(vendors.region, term), ilike(vendors.contactName, term)));
  }
  if (filters.country) where.push(eq(vendors.country, filters.country));
  if (filters.category) where.push(eq(vendors.category, filters.category));
  if (filters.status) where.push(eq(vendors.status, filters.status));

  return db
    .select({
      id: vendors.id,
      name: vendors.name,
      category: vendors.category,
      country: vendors.country,
      region: vendors.region,
      status: vendors.status,
      publicLiabilityConfirmedOn: vendors.publicLiabilityConfirmedOn,
      tastingAttendedOn: vendors.tastingAttendedOn,
      referencesCheckedOn: vendors.referencesCheckedOn,
      responseTimeTestedOn: vendors.responseTimeTestedOn,
      bookings: sql<number>`(select count(*)::int from ${vendorAssignments} va where va.vendor_id = "vendors"."id")`,
    })
    .from(vendors)
    .where(and(...where))
    .orderBy(asc(vendors.country), asc(vendors.category), asc(vendors.name))
    .limit(1000);
}

export async function getVendorDetail(id: string) {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) return null;
  const bookings = await db
    .select({
      assignmentId: vendorAssignments.id,
      category: vendorAssignments.category,
      status: vendorAssignments.status,
      clientId: clients.id,
      partnerOneName: clients.partnerOneName,
      partnerTwoName: clients.partnerTwoName,
      weddingDate: clients.weddingDate,
    })
    .from(vendorAssignments)
    .innerJoin(clients, eq(clients.id, vendorAssignments.clientId))
    .where(eq(vendorAssignments.vendorId, id))
    .orderBy(desc(clients.weddingDate));
  return { vendor, bookings };
}
