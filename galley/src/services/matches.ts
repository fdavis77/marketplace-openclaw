import { supabase } from "../lib/supabase";
import type { Chef, Match, MatchWithChefs } from "../types/database";

interface MatchRow extends Match {
  match_chefs: { chef_id: string; chefs: Chef }[];
}

export async function createMatch(input: {
  requestId: string;
  chefIds: string[];
  notes: string;
  createdBy: string;
}) {
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      request_id: input.requestId,
      notes: input.notes,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (matchError) throw matchError;

  const { error: chefsError } = await supabase
    .from("match_chefs")
    .insert(input.chefIds.map((chef_id) => ({ match_id: match.id, chef_id })));

  if (chefsError) throw chefsError;

  return match;
}

export async function listMatchesForRequest(requestId: string): Promise<MatchWithChefs[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*, match_chefs(chef_id, chefs(*))")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as MatchRow[]).map(({ match_chefs, ...match }) => ({
    ...match,
    chefs: match_chefs.map((mc) => mc.chefs),
  }));
}
