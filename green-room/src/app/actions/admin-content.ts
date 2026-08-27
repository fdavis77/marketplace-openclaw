"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/dal";

const idSchema = z.object({ id: z.uuid() });

// ---------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------
const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).default(""),
  location: z.string().trim().max(200).optional(),
  isOnline: z.boolean(),
  priceNote: z.string().trim().min(1).max(80),
  startAt: z.string().min(1),
  endAt: z.string().optional(),
  externalUrl: z.union([z.url(), z.literal("")]).optional(),
});

function readEventForm(formData: FormData) {
  return eventSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    location: formData.get("location") || undefined,
    isOnline: formData.get("isOnline") === "on",
    priceNote: formData.get("priceNote"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || undefined,
    externalUrl: formData.get("externalUrl") || "",
  });
}

export async function createEvent(formData: FormData) {
  const admin = await assertAdmin();
  const data = readEventForm(formData);
  const supabase = await createClient();
  await supabase.from("events").insert({
    title: data.title,
    description: data.description,
    location: data.location ?? null,
    is_online: data.isOnline,
    price_note: data.priceNote,
    start_at: new Date(data.startAt).toISOString(),
    end_at: data.endAt ? new Date(data.endAt).toISOString() : null,
    external_url: data.externalUrl || null,
    created_by: admin.id,
  });
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function updateEvent(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = readEventForm(formData);
  const supabase = await createClient();
  await supabase
    .from("events")
    .update({
      title: data.title,
      description: data.description,
      location: data.location ?? null,
      is_online: data.isOnline,
      price_note: data.priceNote,
      start_at: new Date(data.startAt).toISOString(),
      end_at: data.endAt ? new Date(data.endAt).toISOString() : null,
      external_url: data.externalUrl || null,
    })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function toggleEventPublished(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const published = formData.get("published") === "true";
  const supabase = await createClient();
  await supabase.from("events").update({ is_published: published }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
}

export async function deleteEvent(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// opportunities
// ---------------------------------------------------------------------------
const opportunitySchema = z.object({
  title: z.string().trim().min(1).max(200),
  organizer: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).default(""),
  category: z.string().trim().min(1).max(80),
  deadlineAt: z.string().min(1),
  externalUrl: z.union([z.url(), z.literal("")]).optional(),
});

function readOpportunityForm(formData: FormData) {
  return opportunitySchema.parse({
    title: formData.get("title"),
    organizer: formData.get("organizer"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    deadlineAt: formData.get("deadlineAt"),
    externalUrl: formData.get("externalUrl") || "",
  });
}

export async function createOpportunity(formData: FormData) {
  const admin = await assertAdmin();
  const data = readOpportunityForm(formData);
  const supabase = await createClient();
  await supabase.from("opportunities").insert({
    title: data.title,
    organizer: data.organizer,
    description: data.description,
    category: data.category,
    deadline_at: new Date(data.deadlineAt).toISOString(),
    external_url: data.externalUrl || null,
    created_by: admin.id,
  });
  revalidatePath("/admin");
  revalidatePath("/opportunities");
  revalidatePath("/");
}

export async function updateOpportunity(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = readOpportunityForm(formData);
  const supabase = await createClient();
  await supabase
    .from("opportunities")
    .update({
      title: data.title,
      organizer: data.organizer,
      description: data.description,
      category: data.category,
      deadline_at: new Date(data.deadlineAt).toISOString(),
      external_url: data.externalUrl || null,
    })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/opportunities");
  revalidatePath("/");
}

export async function toggleOpportunityPublished(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const published = formData.get("published") === "true";
  const supabase = await createClient();
  await supabase.from("opportunities").update({ is_published: published }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/opportunities");
}

export async function deleteOpportunity(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase.from("opportunities").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/opportunities");
}

// ---------------------------------------------------------------------------
// resources
// ---------------------------------------------------------------------------
const resourceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  category: z.string().trim().min(1).max(80),
  externalUrl: z.url(),
});

function readResourceForm(formData: FormData) {
  return resourceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    externalUrl: formData.get("externalUrl"),
  });
}

export async function createResource(formData: FormData) {
  await assertAdmin();
  const data = readResourceForm(formData);
  const supabase = await createClient();
  await supabase.from("resources").insert({
    name: data.name,
    description: data.description,
    category: data.category,
    external_url: data.externalUrl,
  });
  revalidatePath("/admin");
  revalidatePath("/resources");
}

export async function updateResource(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = readResourceForm(formData);
  const supabase = await createClient();
  await supabase
    .from("resources")
    .update({
      name: data.name,
      description: data.description,
      category: data.category,
      external_url: data.externalUrl,
    })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/resources");
}

export async function toggleResourcePublished(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const published = formData.get("published") === "true";
  const supabase = await createClient();
  await supabase.from("resources").update({ is_published: published }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/resources");
}

export async function deleteResource(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase.from("resources").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/resources");
}

// ---------------------------------------------------------------------------
// spotlights
// ---------------------------------------------------------------------------
const spotlightSchema = z.object({
  profileId: z.uuid(),
  headline: z.string().trim().min(1).max(200),
  story: z.string().trim().max(4000).default(""),
  isCurrent: z.boolean(),
});

function readSpotlightForm(formData: FormData) {
  return spotlightSchema.parse({
    profileId: formData.get("profileId"),
    headline: formData.get("headline"),
    story: formData.get("story") ?? "",
    isCurrent: formData.get("isCurrent") === "on",
  });
}

export async function createSpotlight(formData: FormData) {
  await assertAdmin();
  const data = readSpotlightForm(formData);
  const supabase = await createClient();
  await supabase.from("spotlights").insert({
    profile_id: data.profileId,
    headline: data.headline,
    story: data.story,
    is_current: data.isCurrent,
    published_at: new Date().toISOString(),
  });
  revalidatePath("/admin");
  revalidatePath("/spotlight");
}

export async function updateSpotlight(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const data = readSpotlightForm(formData);
  const supabase = await createClient();
  await supabase
    .from("spotlights")
    .update({
      profile_id: data.profileId,
      headline: data.headline,
      story: data.story,
      is_current: data.isCurrent,
    })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/spotlight");
}

export async function deleteSpotlight(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase.from("spotlights").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/spotlight");
}

// ---------------------------------------------------------------------------
// nominations
// ---------------------------------------------------------------------------
export async function reviewNomination(formData: FormData) {
  await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const status = z.enum(["pending", "approved", "rejected"]).parse(formData.get("status"));
  const supabase = await createClient();
  await supabase.from("nominations").update({ status }).eq("id", id);
  revalidatePath("/admin");
}
