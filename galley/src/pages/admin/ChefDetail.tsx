import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getChef, updateChefStatus } from "../../services/chefs";
import { getSignedUrl } from "../../services/storage";
import { Button } from "../../components/Button";
import type { Chef } from "../../types/database";

export function ChefDetail() {
  const { id } = useParams<{ id: string }>();
  const [chef, setChef] = useState<Chef | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function reload() {
    if (!id) return;
    setLoading(true);
    const c = await getChef(id);
    setChef(c);
    if (c.photo_path) setPhotoUrl(await getSignedUrl("chef-photos", c.photo_path));
    if (c.cv_path) setCvUrl(await getSignedUrl("chef-documents", c.cv_path));
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatus(status: "vetted" | "rejected") {
    if (!id) return;
    setUpdating(true);
    try {
      await updateChefStatus(id, status);
      await reload();
    } finally {
      setUpdating(false);
    }
  }

  if (loading || !chef) {
    return <p className="text-navy/60">Loading…</p>;
  }

  return (
    <div>
      <Link to="/admin" className="mb-4 inline-block text-sm text-brass-dark hover:underline">
        ← Back to all applications
      </Link>

      <div className="flex flex-col gap-6 rounded-lg border border-navy/10 bg-white p-6 sm:flex-row">
        {photoUrl && (
          <img
            src={photoUrl}
            alt={chef.full_name}
            className="h-40 w-40 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h1 className="mb-1 text-3xl text-navy">{chef.full_name}</h1>
          <p className="mb-4 text-navy/60">
            {chef.email} {chef.phone && `· ${chef.phone}`}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Experience" value={`${chef.years_experience ?? "—"} years`} />
            <Detail label="Regions" value={chef.regions_available.join(", ")} />
            <Detail label="Specialties" value={chef.cuisine_specialties.join(", ")} />
            <Detail label="Day rate" value={chef.day_rate_expectation} />
            <Detail label="Available from" value={chef.availability_start} />
            <Detail label="Certifications" value={chef.certifications} />
          </div>

          <div className="mt-4">
            <Detail label="Cover letter" value={chef.cover_letter} />
          </div>

          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-brass-dark hover:underline"
            >
              View CV / references →
            </a>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={() => handleStatus("vetted")} disabled={updating || chef.status === "vetted"}>
              Mark vetted
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleStatus("rejected")}
              disabled={updating || chef.status === "rejected"}
            >
              Reject
            </Button>
          </div>
        </div>
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
