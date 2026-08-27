# The Green Room

A community and career platform for independent filmmakers and screen-industry creatives — events, opportunities, a resources directory, talent spotlight, and a native community feed.

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 + hand-rolled shadcn/ui-style primitives
- **Backend:** Supabase (Postgres, Auth, Storage), enforced end-to-end with Row Level Security
- **Deploy:** Vercel

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev
```

The schema and RLS policies live in `supabase/schema.sql`; seed data (fictional demo content) lives in `supabase/seed.sql`. Both are already applied to the project referenced by `.env.local` if you were handed one — otherwise, run them against a fresh Supabase project via the SQL editor or `supabase db push`.

## Seed accounts

Demo data ships with six seeded accounts, all sharing the password `GreenRoom!Seed1`:

| Email | Role |
|---|---|
| `admin@thegreenroom.demo` | admin |
| `ava.whitfield@example.com` | member |
| `marcus.reid@example.com` | member |
| `priya.nair@example.com` | member |
| `tom.okafor@example.com` | member |
| `lena.brandt@example.com` | member |

**Rotate or delete these before any real launch.** They exist to make the admin dashboard and community feed testable out of the box.

## Security notes

- Every table has Row Level Security enabled; the app's own auth checks (in Server Actions and page loads) are a second layer on top, not a substitute for it.
- Profile roles can't be self-escalated — a database trigger silently reverts any `role` change made by a non-admin.
- The `media` storage bucket is public-read but scoped so a member can only write inside their own `<user_id>/...` folder; uploads are also validated for MIME type and size server-side before they ever reach storage.
- No service-role key is used anywhere in the app — all reads and writes go through the publishable key under the signed-in user's own RLS-scoped session.
- Nominee contact details and subscriber emails are never publicly readable — only admins can select those rows.
- Before a real launch: enable **Leaked Password Protection** in the Supabase dashboard (Authentication → Policies) — this can't be set via SQL and is off by default.

## Project structure

```
src/app/                  routes (App Router)
src/app/actions/          Server Actions (mutations), grouped by domain
src/app/admin/            /admin dashboard, one file per tab
src/components/           shared UI + feature components
src/components/ui/        button/card/input/etc. primitives
src/lib/supabase/         browser + server Supabase clients, generated DB types
src/lib/dal.ts            single source of truth for "who is making this request"
src/proxy.ts              session-refresh proxy (Next 16's renamed middleware)
supabase/schema.sql       tables, RLS policies, triggers, storage policies
supabase/seed.sql         fictional demo data
```
