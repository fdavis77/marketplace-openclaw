import { createClient } from "@/lib/supabase/server";
import { createEvent, updateEvent, toggleEventPublished, deleteEvent } from "@/app/actions/admin-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/app/admin/field";
import { toLocalInput } from "@/lib/format";
import { format } from "date-fns";

export async function EventsSection() {
  const supabase = await createClient();
  const { data: events } = await supabase.from("events").select("*").order("start_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="cursor-pointer font-display font-semibold">+ Add event</summary>
        <form action={createEvent} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Title"><Input name="title" required maxLength={200} /></Field>
          <Field label="Location"><Input name="location" maxLength={200} /></Field>
          <Field label="Price note"><Input name="priceNote" required defaultValue="Free" maxLength={80} /></Field>
          <Field label="External URL"><Input name="externalUrl" type="url" /></Field>
          <Field label="Starts at"><Input name="startAt" type="datetime-local" required /></Field>
          <Field label="Ends at"><Input name="endAt" type="datetime-local" /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="isOnline" /> Online event
          </label>
          <Field label="Description" full><Textarea name="description" maxLength={4000} /></Field>
          <Button type="submit" className="sm:col-span-2 self-start">Create event</Button>
        </form>
      </details>

      <div className="flex flex-col gap-3">
        {events?.map((event) => (
          <div key={event.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted">
                  {format(new Date(event.start_at), "d MMM yyyy HH:mm")} · {event.is_online ? "Online" : event.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={event.is_published ? "default" : "outline"}>
                  {event.is_published ? "Published" : "Draft"}
                </Badge>
                <form action={toggleEventPublished}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="published" value={(!event.is_published).toString()} />
                  <Button type="submit" size="sm" variant="outline">
                    {event.is_published ? "Unpublish" : "Publish"}
                  </Button>
                </form>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={event.id} />
                  <Button type="submit" size="sm" variant="ghost">Delete</Button>
                </form>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Edit</summary>
              <form action={updateEvent} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={event.id} />
                <Field label="Title"><Input name="title" required defaultValue={event.title} maxLength={200} /></Field>
                <Field label="Location"><Input name="location" defaultValue={event.location ?? ""} maxLength={200} /></Field>
                <Field label="Price note"><Input name="priceNote" required defaultValue={event.price_note} maxLength={80} /></Field>
                <Field label="External URL"><Input name="externalUrl" type="url" defaultValue={event.external_url ?? ""} /></Field>
                <Field label="Starts at">
                  <Input name="startAt" type="datetime-local" required defaultValue={toLocalInput(event.start_at)} />
                </Field>
                <Field label="Ends at">
                  <Input name="endAt" type="datetime-local" defaultValue={event.end_at ? toLocalInput(event.end_at) : ""} />
                </Field>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="isOnline" defaultChecked={event.is_online} /> Online event
                </label>
                <Field label="Description" full>
                  <Textarea name="description" defaultValue={event.description} maxLength={4000} />
                </Field>
                <Button type="submit" size="sm" className="sm:col-span-2 self-start">Save changes</Button>
              </form>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
