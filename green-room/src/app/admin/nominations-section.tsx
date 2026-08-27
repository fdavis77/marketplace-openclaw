import { createClient } from "@/lib/supabase/server";
import { reviewNomination } from "@/app/actions/admin-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export async function NominationsSection() {
  const supabase = await createClient();
  const { data: nominations } = await supabase
    .from("nominations")
    .select("*, nominator:profiles(display_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-3">
      {nominations?.length ? (
        nominations.map((nomination) => (
          <div key={nomination.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{nomination.nominee_name}</p>
                <p className="text-xs text-muted">
                  Nominated by {nomination.nominator?.display_name ?? "a member"} ·{" "}
                  {format(new Date(nomination.created_at), "d MMM yyyy")}
                </p>
                {nomination.nominee_contact ? (
                  <p className="text-xs text-muted">Contact: {nomination.nominee_contact}</p>
                ) : null}
              </div>
              <Badge
                variant={
                  nomination.status === "approved"
                    ? "default"
                    : nomination.status === "rejected"
                      ? "warning"
                      : "outline"
                }
              >
                {nomination.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm">{nomination.reason}</p>
            {nomination.status === "pending" ? (
              <div className="mt-3 flex gap-2">
                <form action={reviewNomination}>
                  <input type="hidden" name="id" value={nomination.id} />
                  <input type="hidden" name="status" value="approved" />
                  <Button type="submit" size="sm">Approve</Button>
                </form>
                <form action={reviewNomination}>
                  <input type="hidden" name="id" value={nomination.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <Button type="submit" size="sm" variant="ghost">Reject</Button>
                </form>
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <p className="text-muted">No nominations yet.</p>
      )}
    </div>
  );
}
