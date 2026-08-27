import { createClient } from "@/lib/supabase/server";
import { createResource, updateResource, toggleResourcePublished, deleteResource } from "@/app/actions/admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/app/admin/field";

export async function ResourcesSection() {
  const supabase = await createClient();
  const { data: resources } = await supabase.from("resources").select("*").order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ Add resource</summary>
        <form action={createResource} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Name"><Input name="name" required maxLength={200} /></Field>
          <Field label="Category"><Input name="category" required maxLength={80} /></Field>
          <Field label="External URL" full><Input name="externalUrl" type="url" required /></Field>
          <Field label="Description" full><Textarea name="description" maxLength={2000} /></Field>
          <Button type="submit" className="sm:col-span-2 self-start">Create resource</Button>
        </form>
      </details>

      <div className="flex flex-col gap-3">
        {resources?.map((resource) => (
          <div key={resource.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{resource.name}</p>
                <p className="text-xs text-muted">{resource.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={resource.is_published ? "default" : "outline"}>
                  {resource.is_published ? "Published" : "Draft"}
                </Badge>
                <form action={toggleResourcePublished}>
                  <input type="hidden" name="id" value={resource.id} />
                  <input type="hidden" name="published" value={(!resource.is_published).toString()} />
                  <Button type="submit" size="sm" variant="outline">
                    {resource.is_published ? "Unpublish" : "Publish"}
                  </Button>
                </form>
                <form action={deleteResource}>
                  <input type="hidden" name="id" value={resource.id} />
                  <Button type="submit" size="sm" variant="ghost">Delete</Button>
                </form>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Edit</summary>
              <form action={updateResource} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={resource.id} />
                <Field label="Name"><Input name="name" required defaultValue={resource.name} maxLength={200} /></Field>
                <Field label="Category"><Input name="category" required defaultValue={resource.category} maxLength={80} /></Field>
                <Field label="External URL" full><Input name="externalUrl" type="url" required defaultValue={resource.external_url} /></Field>
                <Field label="Description" full><Textarea name="description" defaultValue={resource.description} maxLength={2000} /></Field>
                <Button type="submit" size="sm" className="sm:col-span-2 self-start">Save changes</Button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
