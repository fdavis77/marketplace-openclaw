import { supabase } from "../lib/supabase";
import type { OwnerRequest, RequestStatus } from "../types/database";

export type NewOwnerRequest = Omit<OwnerRequest, "id" | "status" | "created_at">;

export async function submitOwnerRequest(input: NewOwnerRequest) {
  const { data, error } = await supabase
    .from("owner_requests")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as OwnerRequest;
}

export async function listOwnerRequests(filters?: {
  status?: RequestStatus;
  region?: string;
}) {
  let query = supabase
    .from("owner_requests")
    .select()
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.region) query = query.eq("region", filters.region);

  const { data, error } = await query;
  if (error) throw error;
  return data as OwnerRequest[];
}

export async function getOwnerRequest(id: string) {
  const { data, error } = await supabase
    .from("owner_requests")
    .select()
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as OwnerRequest;
}

export async function updateOwnerRequestStatus(id: string, status: RequestStatus) {
  const { error } = await supabase
    .from("owner_requests")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
