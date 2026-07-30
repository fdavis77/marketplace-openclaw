import { supabase } from "../lib/supabase";
import type { Chef, ChefStatus } from "../types/database";

export type NewChefApplication = Omit<Chef, "id" | "status" | "created_at">;

export async function submitChefApplication(input: NewChefApplication) {
  const { data, error } = await supabase
    .from("chefs")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Chef;
}

export async function listChefs(filters?: {
  status?: ChefStatus;
  region?: string;
  cuisine?: string;
}) {
  let query = supabase.from("chefs").select().order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.region) query = query.contains("regions_available", [filters.region]);
  if (filters?.cuisine) query = query.contains("cuisine_specialties", [filters.cuisine]);

  const { data, error } = await query;
  if (error) throw error;
  return data as Chef[];
}

export async function getChef(id: string) {
  const { data, error } = await supabase.from("chefs").select().eq("id", id).single();
  if (error) throw error;
  return data as Chef;
}

export async function updateChefStatus(id: string, status: ChefStatus) {
  const { error } = await supabase.from("chefs").update({ status }).eq("id", id);
  if (error) throw error;
}
