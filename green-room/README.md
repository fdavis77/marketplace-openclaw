# Filmmaking Planner

A private production and career planner for screen creatives, by Aysha Scott — independent filmmaker
and founder of Filmmaking Planner. Writers, directors, producers, and editors track scripts through a
stage pipeline, a scene-by-scene revision tracker, a submission tracker, and writing goals. Actors run
an audition pipeline with sides, self-tape deadlines, an availability calendar, and a materials library.
Everything is private to the account that owns it — there's no public content or shared data.

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 + hand-rolled shadcn/ui-style primitives
- **Backend:** Supabase (Postgres, Auth, Storage), enforced end-to-end with owner-only Row Level Security
- **Deploy:** Vercel

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev
```

The schema and RLS policies live in `supabase/schema.sql`; seed data (fictional demo content) lives in
`supabase/seed.sql`. Both are already applied to the project referenced by `.env.local` if you were
handed one — otherwise, run them against a fresh Supabase project via the SQL editor or `supabase db push`.

## Seed accounts

Demo data ships with six seeded accounts, all sharing the password `GreenRoom!Seed1`:

| Email | Roles |
|---|---|
| `admin@thegreenroom.demo` | writer |
| `ava.whitfield@example.com` | writer, director |
| `marcus.reid@example.com` | director |
| `priya.nair@example.com` | writer |
| `tom.okafor@example.com` | actor |
| `lena.brandt@example.com` | actor, writer |

**Rotate or delete these before any real launch.** They exist to make every planner section testable
out of the box.

## Security notes

- Every table has Row Level Security enabled and is scoped to a single owner (`owner_id`, or one hop
  through `projects` for scenes/submissions) — there is no admin role and no shared/public data.
- The `media` storage bucket is public-read but scoped so a member can only write inside their own
  `<user_id>/...` folder; uploads are also validated for MIME type and size server-side before they
  ever reach storage.
- No service-role key is used anywhere in the app — all reads and writes go through the publishable
  key under the signed-in user's own RLS-scoped session.
- Before a real launch: enable **Leaked Password Protection** in the Supabase dashboard
  (Authentication → Policies) — this can't be set via SQL and is off by default.

## Project structure

```
src/app/                  routes (App Router)
src/app/actions/          Server Actions (mutations), grouped by domain
src/app/about/            founder page
src/app/projects/         writer/director/producer/editor: projects, scenes, submissions
src/app/goals/            writing goals + session log
src/app/auditions/        actor: audition pipeline, sides, self-tapes
src/app/availability/     actor: blocked date ranges
src/app/materials/        actor: headshots, reels, resumes
src/app/account/          edit own profile + roles
src/components/           shared UI + feature components
src/components/ui/        button/card/input/etc. primitives
src/lib/supabase/         browser + server Supabase clients, generated DB types
src/lib/dal.ts            single source of truth for "who is making this request"
src/proxy.ts              session-refresh proxy (Next 16's renamed middleware)
supabase/schema.sql       tables, RLS policies, triggers, storage policies
supabase/seed.sql         fictional demo data
```
