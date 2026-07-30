import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listOwnerRequests } from "../../services/ownerRequests";
import { listChefs } from "../../services/chefs";
import { CUISINES } from "../../constants";
import type { Chef, ChefStatus, OwnerRequest, RequestStatus } from "../../types/database";
import { Select } from "../../components/inputs";

const REQUEST_STATUSES: RequestStatus[] = ["new", "in_review", "matched", "closed"];
const CHEF_STATUSES: ChefStatus[] = ["pending_review", "vetted", "rejected"];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-brass/20 text-brass-dark",
    in_review: "bg-navy/10 text-navy",
    matched: "bg-bottle/15 text-bottle",
    closed: "bg-navy/5 text-navy/50",
    pending_review: "bg-brass/20 text-brass-dark",
    vetted: "bg-bottle/15 text-bottle",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] ?? ""}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<"requests" | "chefs">("requests");

  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [requestStatus, setRequestStatus] = useState("");
  const [requestRegion, setRequestRegion] = useState("");

  const [chefs, setChefs] = useState<Chef[]>([]);
  const [chefStatus, setChefStatus] = useState("");
  const [chefRegion, setChefRegion] = useState("");
  const [chefCuisine, setChefCuisine] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab !== "requests") return;
    setLoading(true);
    listOwnerRequests({
      status: (requestStatus || undefined) as RequestStatus | undefined,
      region: requestRegion || undefined,
    })
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [tab, requestStatus, requestRegion]);

  useEffect(() => {
    if (tab !== "chefs") return;
    setLoading(true);
    listChefs({
      status: (chefStatus || undefined) as ChefStatus | undefined,
      region: chefRegion || undefined,
      cuisine: chefCuisine || undefined,
    })
      .then(setChefs)
      .finally(() => setLoading(false));
  }, [tab, chefStatus, chefRegion, chefCuisine]);

  return (
    <div>
      <h1 className="mb-6 text-3xl text-navy">Requests &amp; applications</h1>

      <div className="mb-6 flex gap-2 border-b border-navy/10">
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "requests" ? "border-b-2 border-brass text-navy" : "text-navy/50"
          }`}
        >
          Owner requests
        </button>
        <button
          onClick={() => setTab("chefs")}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "chefs" ? "border-b-2 border-brass text-navy" : "text-navy/50"
          }`}
        >
          Chef applications
        </button>
      </div>

      {tab === "requests" && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <Select
              value={requestStatus}
              onChange={(e) => setRequestStatus(e.target.value)}
              className="w-auto"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Select
              value={requestRegion}
              onChange={(e) => setRequestRegion(e.target.value)}
              className="w-auto"
              aria-label="Filter by region"
            >
              <option value="">All regions</option>
              <option value="mediterranean">Mediterranean</option>
              <option value="caribbean">Caribbean</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-navy/10 text-navy/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Vessel</th>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {!loading && requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-navy/50">
                      No requests match those filters.
                    </td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-navy/5 last:border-0 hover:bg-linen">
                    <td className="px-4 py-3">
                      <Link to={`/admin/requests/${r.id}`} className="font-semibold text-navy hover:text-brass">
                        {r.owner_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{r.vessel_name}</td>
                    <td className="px-4 py-3 capitalize">{r.region}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-navy/60">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "chefs" && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <Select
              value={chefStatus}
              onChange={(e) => setChefStatus(e.target.value)}
              className="w-auto"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {CHEF_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Select
              value={chefRegion}
              onChange={(e) => setChefRegion(e.target.value)}
              className="w-auto"
              aria-label="Filter by region"
            >
              <option value="">All regions</option>
              <option value="mediterranean">Mediterranean</option>
              <option value="caribbean">Caribbean</option>
            </Select>
            <Select
              value={chefCuisine}
              onChange={(e) => setChefCuisine(e.target.value)}
              className="w-auto"
              aria-label="Filter by cuisine"
            >
              <option value="">All cuisines</option>
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-navy/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-navy/10 text-navy/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Experience</th>
                  <th className="px-4 py-3 font-medium">Regions</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {!loading && chefs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-navy/50">
                      No applications match those filters.
                    </td>
                  </tr>
                )}
                {chefs.map((c) => (
                  <tr key={c.id} className="border-b border-navy/5 last:border-0 hover:bg-linen">
                    <td className="px-4 py-3">
                      <Link to={`/admin/chefs/${c.id}`} className="font-semibold text-navy hover:text-brass">
                        {c.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.years_experience} yrs</td>
                    <td className="px-4 py-3 capitalize">{c.regions_available.join(", ")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-navy/60">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
