import { expect, test, type Page } from "@playwright/test";

const SHOTS = process.env.E2E_SCREENSHOTS; // optional folder for screenshots

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${test.info().project.name}-${name}.png`, fullPage: true });
}

async function signIn(page: Page, email = "fabian@demo.local") {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("ember-and-aisle-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Fabian");
}

test("rejects a wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("fabian@demo.local");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("don't match");
});

test("MVP: book, auto-timeline, vendor, budget, payment, dashboard, delivered", async ({ page }) => {
  const project = test.info().project.name;
  const partner = `Test${project}${Date.now() % 100000}`;

  await signIn(page);
  await shot(page, "01-dashboard");
  // Dashboard sections are present.
  await expect(page.getByText("Upcoming weddings").first()).toBeVisible();
  await expect(page.getByText("Tasks this week")).toBeVisible();
  await expect(page.getByText("Overdue payments").first()).toBeVisible();
  await expect(page.getByText(/Tier 3 · [1-9]\d* open/)).toBeVisible();

  // ── Create a booking ────────────────────────────────────────────────
  await page.goto("/clients/new");
  await page.getByLabel("Partner one").fill(partner);
  await page.getByLabel("Partner two").fill("Rowan");
  await page.getByLabel("Email", { exact: true }).fill("couple@example.com");
  const wedding = new Date(Date.now() + 200 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Wedding date").fill(wedding);
  await page.getByLabel("Country").selectOption("italy");
  await page.getByLabel("Venue").fill("Villa Aurelia");
  await page.getByText("Partial Planning").click();
  await page.getByLabel("Food & Wine Curation", { exact: false }).check();

  // Validation keeps typed input when the fee is missing.
  await page.getByRole("button", { name: "Create booking" }).click();
  await expect(page.getByText("Enter the flat fee.").first()).toBeVisible();
  await expect(page.getByLabel("Partner one")).toHaveValue(partner);

  await page.getByLabel("Fee (£)").fill("3800");
  await page.getByLabel("Destination surcharge (£)").fill("750");
  await expect(page.getByText("Total fee £4,550")).toBeVisible();
  await shot(page, "02-new-booking");
  await page.getByRole("button", { name: "Create booking" }).click();

  // ── Timeline auto-populated ─────────────────────────────────────────
  await expect(page.getByRole("heading", { level: 1 })).toContainText(`${partner} & Rowan`);
  await expect(page.getByRole("status").first()).toContainText("Partial Planning tasks added");
  await expect(page.getByText("Planning audit — confirm Schedule 1 vendor categories and set budget")).toBeVisible();
  await expect(page.getByText("Wedding day coordination")).toBeVisible();
  await expect(page.getByText("Menu tasting and wine pairing session")).toBeVisible();
  await shot(page, "03-timeline");

  // Tick a task done.
  const audit = page.getByRole("checkbox", { name: /Planning audit/ });
  await audit.click();
  await expect(audit).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Planning audit/ })).toHaveAttribute("aria-checked", "true");

  // ── Assign a vendor from the directory ──────────────────────────────
  await page.getByRole("tab", { name: "Vendors" }).click();
  const venueCard = page.locator("section", { has: page.getByRole("heading", { name: "Venue", exact: true }) });
  await venueCard.getByRole("button", { name: "+ Assign" }).click();
  await venueCard.getByLabel("Vendor").selectOption({ label: "Villa Aurelia" });
  await venueCard.getByLabel("Status").selectOption("booked");
  await venueCard.getByLabel("Contract ref").fill("VA-TEST-1");
  await venueCard.getByRole("button", { name: "Assign vendor" }).click();
  await expect(venueCard.getByRole("link", { name: "Villa Aurelia" })).toBeVisible();
  await expect(venueCard.getByText("Contract VA-TEST-1")).toBeVisible();
  await shot(page, "04-vendors");

  // ── Budget line ─────────────────────────────────────────────────────
  await page.getByRole("tab", { name: "Budget" }).click();
  await page.getByRole("button", { name: "+ Add budget line" }).click();
  await page.getByLabel("Category").selectOption("venue");
  await page.getByLabel("Committed (£)").fill("20000");
  await page.getByLabel("Actual (£)").fill("21500");
  await page.getByRole("button", { name: "Add line" }).click();
  await expect(page.getByText("£20,000 → £21,500")).toBeVisible();
  await expect(page.getByText("Over", { exact: true }).first()).toBeVisible();
  await shot(page, "05-budget");

  // ── Payments: one overdue, one paid ─────────────────────────────────
  await page.getByRole("tab", { name: "Payments" }).click();
  await page.getByRole("button", { name: "+ Add payment" }).click();
  await page.getByLabel("Amount (£)").fill("1000");
  const past = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Due date").fill(past);
  await page.getByRole("button", { name: "Add payment" }).click();
  await expect(page.getByText("Overdue", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/short of the £4,550 fee/)).toBeVisible();
  await shot(page, "06-payments");

  // ── Dashboard shows it (All view) ───────────────────────────────────
  await page.goto("/?view=all");
  await expect(page.getByRole("link", { name: new RegExp(`${partner} & Rowan`) }).first()).toBeVisible();
  await expect(page.getByText(`${partner} & Rowan`).first()).toBeVisible();

  // ── Mark paid, then delivered → wrap-up ─────────────────────────────
  await page.goto("/clients");
  await page.getByRole("link", { name: `${partner} & Rowan` }).first().click();
  await page.getByRole("tab", { name: "Payments" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "✓ Mark paid today" }).click();
  await expect(page.getByText("Paid", { exact: true }).first()).toBeVisible();

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "✦ Mark delivered" }).click();
  await expect(page.getByText("Another wedding beautifully done")).toBeVisible();
  await shot(page, "07-delivered-moment");
  await page.getByText("Tap anywhere to continue").click();
  await expect(page.getByRole("heading", { name: "Post-wedding wrap-up" })).toBeVisible();

  // Consent guard: opted-out couples can't be published.
  await page.getByLabel("Photo/video consent").selectOption("opted_out");
  await page.getByLabel("Portfolio").selectOption("published");
  await page.getByRole("button", { name: "Save wrap-up" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("opted out");
  await shot(page, "08-wrapup");

  // ── GDPR erase ──────────────────────────────────────────────────────
  await page.getByRole("tab", { name: "Details" }).click();
  const exp = await page.request.get(page.url().replace(/\?.*$/, "") + "/export");
  expect(exp.status()).toBe(200);
  expect((await exp.json()).client.partnerOneName).toBe(partner);
  await page.getByRole("button", { name: "Delete permanently…" }).click();
  await page.getByLabel(/to confirm/).fill(partner);
  await page.getByRole("button", { name: "Delete all data for this couple" }).click();
  await expect(page.getByText("permanently deleted")).toBeVisible();
});

test("vendor directory filters and vetting", async ({ page }) => {
  await signIn(page);
  await page.goto("/vendors?country=italy");
  await expect(page.getByText("Villa Aurelia")).toBeVisible();
  await expect(page.getByText("Adriatic Table")).toHaveCount(0);
  // Regression: correlated count once bound to the wrong row and always showed 0.
  await expect(page.getByText(/Lake Como, Italy · 1 booking/).first()).toBeVisible();
  await page.goto("/vendors?category=catering");
  await expect(page.getByText("Adriatic Table")).toBeVisible();
  await expect(page.getByText("Villa Aurelia")).toHaveCount(0);
  await page.getByText("Adriatic Table").click();
  await expect(page.getByRole("heading", { name: "Adriatic Table" })).toBeVisible();
  await shot(page, "09-vendor");
});

test("signed-out requests can't reach data", async ({ request }) => {
  const r = await request.get("/clients", { maxRedirects: 0 });
  expect(r.status()).toBe(307);
});
