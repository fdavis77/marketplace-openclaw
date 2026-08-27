import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchParams = { q?: string; category?: string };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("resources").select("*").eq("is_published", true);
  if (params.q) query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  if (params.category && params.category !== "all") query = query.eq("category", params.category);

  const [{ data: resources }, { data: allResources }] = await Promise.all([
    query.order("name", { ascending: true }),
    supabase.from("resources").select("category").eq("is_published", true),
  ]);

  const categories = Array.from(new Set((allResources ?? []).map((r) => r.category))).sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Resources</h1>
      <p className="mt-2 text-muted">
        Training, jobs, funding, and community &amp; representation bodies worth knowing about.
      </p>

      <form className="mt-8 flex flex-wrap items-end gap-4 rounded-card border border-border bg-surface p-4">
        <div className="flex flex-1 min-w-48 flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-muted">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={params.q}
            placeholder="Search resources…"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-xs font-medium text-muted">Category</label>
          <select
            id="category"
            name="category"
            defaultValue={params.category ?? "all"}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources?.length ? (
          resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <Badge variant="outline">{resource.category}</Badge>
                <CardTitle className="text-base">{resource.name}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" size="sm" asChild className="px-0">
                  <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                    Visit →
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted">No resources match your search.</p>
        )}
      </div>
    </div>
  );
}
