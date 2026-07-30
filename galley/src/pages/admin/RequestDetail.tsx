import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOwnerRequest } from "../../services/ownerRequests";
import { listChefs } from "../../services/chefs";
import { createMatch, listMatchesForRequest } from "../../services/matches";
import { useAuth } from "../../context/AuthContext";
import { TextArea } from "../../components/inputs";
import { Button } from "../../components/Button";
import type { Chef, MatchWithChefs, OwnerRequest } from "../../types/database";

export function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const [request, setRequest] = useState<OwnerRequest | null>(null);
  const [vettedChefs, setVettedChefs] = useState<Chef[]>([]);
  const [matches, setMatches] = useState<MatchWithChefs[]>([]);
  const [selectedChefIds, setSelectedChefIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!id) return;
    setLoading(true);
    const [req, chefs, existingMatches] = await Promise.all([
      getOwnerRequest(id),
      listChefs({ status: "vetted" }),
      listMatchesForRequest(id),
    ]);
    setRequest(req);
    setVettedChefs(chefs);
    setMatches(existingMatches);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toggleChef(chefId: string) {
    setSelectedChefIds((prev) =>
      prev.includes(chefId) ? prev.filter((c) => c !== chefId) : [...prev, chefId],
    );
  }

  async function handleRecordMatch() {
    if (!id || !session?.user.id || selectedChefIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await createMatch({
        requestId: id,
        chefIds: selectedChefIds,
        notes,
        createdBy: session.user.id,
      });
      setSelectedChefIds([]);
      setNotes("");
      await reload();
    } catch {
      setError("Couldn't record the match. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !request) {
    return <p className="text-navy/60">Loading…</p>;
  }

  return (
    <div>
      <Link to="/admin" className="mb-4 inline-block text-sm text-brass-dark hover:underline">
        ← Back to all requests
      </Link>
      <h1 className="mb-1 text-3xl text-navy">{request.owner_name}</h1>
      <p className="mb-6 text-navy/60">{request.email}</p>

      <div className="mb-8 grid gap-6 rounded-lg border border-navy/10 bg-white p-6 sm:grid-cols-2">
        <Detail label="Vessel" value={request.vessel_name} />
        <Detail label="Length" value={request.vessel_length_m ? `${request.vessel_length_m} m` : null} />
        <Detail label="Region" value={request.region} />
        <Detail label="Crew / guests" value={`${request.crew_size ?? "—"} / ${request.guests_size ?? "—"}`} />
        <Detail
          label="Season"
          value={
            request.season_start && request.season_end
              ? `${request.season_start} → ${request.season_end}`
              : null
          }
        />
        <Detail label="Chef type" value={request.chef_type} />
        <Detail label="Budget" value={request.budget_range} />
        <Detail label="Cuisine preferences" value={request.cuisine_preferences.join(", ")} />
        <Detail label="Dietary requirements" value={request.dietary_requirements} />
        <Detail label="Phone" value={request.phone} />
        <div className="sm:col-span-2">
          <Detail label="Notes" value={request.additional_notes} />
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xl text-navy">Recorded matches</h2>
          <ul className="flex flex-col gap-3">
            {matches.map((m) => (
              <li key={m.id} className="rounded-lg border border-bottle/30 bg-bottle/5 p-4">
                <p className="font-semibold text-bottle">
                  {m.chefs.map((c) => c.full_name).join(", ")}
                </p>
                {m.notes && <p className="mt-1 text-sm text-navy/70">{m.notes}</p>}
                <p className="mt-1 text-xs text-navy/40">
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-xl text-navy">Vetted chefs</h2>
        {vettedChefs.length === 0 ? (
          <p className="text-navy/60">No vetted chefs yet.</p>
        ) : (
          <div className="mb-4 flex flex-col gap-2">
            {vettedChefs.map((chef) => (
              <label
                key={chef.id}
                className="flex items-center justify-between rounded-lg border border-navy/10 bg-white p-4"
              >
                <span>
                  <Link to={`/admin/chefs/${chef.id}`} className="font-semibold text-navy hover:text-brass">
                    {chef.full_name}
                  </Link>
                  <span className="ml-2 text-sm text-navy/60">
                    {chef.cuisine_specialties.join(", ")} · {chef.regions_available.join(", ")}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={selectedChefIds.includes(chef.id)}
                  onChange={() => toggleChef(chef.id)}
                  className="h-4 w-4 rounded border-navy/30 text-brass focus:ring-brass"
                />
              </label>
            ))}
          </div>
        )}

        <TextArea
          placeholder="Notes on why this is a good fit…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mb-3"
        />
        {error && (
          <p role="alert" className="mb-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button
          onClick={handleRecordMatch}
          disabled={selectedChefIds.length === 0 || saving}
        >
          {saving ? "Recording…" : "Record match"}
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">{label}</p>
      <p className="text-navy">{value || "—"}</p>
    </div>
  );
}
