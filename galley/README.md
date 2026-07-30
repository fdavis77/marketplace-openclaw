# Project Galley (working codename)

A concierge introduction service connecting private yacht owners/captains with vetted
private chefs. Month-1 MVP: intake forms + an internal review console. No automated
matching, no in-app payments — the founder makes every introduction by hand.

The product name is a placeholder (see `APP_NAME` in `src/config.ts`) — swap that one
constant when the real brand lands.

## Stack

- React + Vite + TypeScript + Tailwind CSS v4
- Supabase (Postgres, Auth, Storage) via `@supabase/supabase-js`
- React Hook Form + Zod for the intake forms
- React Router for client-side routing

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Run the migration in `supabase/migrations/0001_init.sql` (SQL editor, or `supabase db push`
   if you have the CLI linked).
3. Create an auth user for yourself (Authentication → Users → Add user), then grant it
   console access:
   ```sql
   insert into admins (user_id) values ('<uuid from auth.users>');
   ```
4. Storage buckets `chef-photos` and `chef-documents` are created by the migration as
   private buckets — no manual setup needed.

## Structure

- `src/services/*` — all Supabase reads/writes live here, not in components. This is
  also where match-creation logic sits (`services/matches.ts`), kept separate from the
  UI so an automated matching workflow (e.g. an n8n job) could call into or replace it
  later without touching the admin console.
- `src/pages/admin/*` — the concierge console (auth-gated via `admins` table + RLS).
- `src/components/RouteLine.tsx` / `WaypointProgress.tsx` — the nautical-chart motif
  used in the hero and as multi-step form progress.

## Assumptions made (brief left these open)

- Exact field sets for the owner request and chef application forms — built out a
  reasonable set (vessel details, season, budget, cuisine, dietary needs for owners;
  experience, specialties, availability, rate, cover letter for chefs) rather than
  blocking on a fixed spec.
- Admin allowlist is a simple `admins` table keyed by Supabase Auth user id, checked in
  RLS policies — no roles/permissions beyond "is an admin."
- Waitlist captures an optional `role` (owner/chef) alongside region, for segmentation.
- Budget and day-rate fields are free text rather than fixed bands, since ranges vary a
  lot by vessel size and season.

## Deploying

Point a Vercel project at this `galley/` subdirectory (Project Settings → Root
Directory), set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment
variables, and deploy. `npm run build` outputs a static `dist/` — no server runtime
needed.
