# Handoff — Filmmaking Planner

Written for whoever (human or a fresh Claude Code session) picks this up next, most
likely in a local IDE instead of this cloud session. Read this before diving into
the code — it covers what exists, why, and what's genuinely still open.

## What this is

A private production and career planner for screen creatives — writers, directors,
producers, editors, actors, and now crew (gaffers, sound, composers, etc.) — built
for and branded as **Aysha Scott's Filmmaking Planner**, a real business
(filmmakingplanner.com). It started as a generic "Green Room" community-hub concept,
was pivoted to a private planner, then rebranded as Aysha's actual product. The repo
name and some internal identifiers (`the-green-room` Supabase project, `green-room`
package name) still say "green room" — that's legacy naming, not a product name.

Everything lives in this `green-room/` subfolder of the `marketplace-openclaw` repo,
on branch `claude/green-room-platform-c0hrs8`. Nothing has been merged to `main`.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
- Supabase (Postgres + Auth + Storage), project **`the-green-room`**
  (ref `bzojafypkqqsbpjiiwzr`, region eu-west-2) — accessed via the Supabase MCP
  tools in this session; locally you'd use the Supabase dashboard/CLI directly.
- Deployed via Vercel git integration, project **`green-room-app`**
  (`prj_cIiHQrgh65KTegFhBWwRESTYxT7G`, team `fdavis77-5835s-projects`). Pushes to
  this branch auto-deploy as **Preview** builds (the linked project's Production
  Branch is `main`, owned by an unrelated project). The stable URL that updates on
  every push is the branch alias:
  `https://green-room-app-git-claude-green-e95343-fdavis77-5835s-projects.vercel.app`

## Security model

Every table is owner-only Row Level Security — no admin role, no service-role key
used client-side anywhere. `src/lib/supabase/config.ts` has a hardcoded fallback
publishable key/URL (safe — it's the anon key, RLS is the real boundary) so the app
runs with zero env setup. The one exception is the network/messaging feature: a
`start_conversation()` Postgres function (SECURITY DEFINER, in `public` schema so
it's callable via RPC) lets a user start a DM only with a profile that has opted
into `is_public = true`; it's intentionally flagged by Supabase's advisor as
"callable by authenticated" — that's by design, not a bug. Run
`mcp__Supabase__get_advisors` (or the dashboard's linter) after any schema change.

## What's built, in order

1. **Core planner** — projects (stage pipeline: idea → outline → drafting →
   revision → polish → locked → in_production → delivered), scenes,
   submissions, writing goals + session log, auditions pipeline, availability
   blocks, materials library (headshots/reels/resumes).
2. **Design system** — see `src/app/globals.css`. Currently the *real* Aysha
   Scott brand: white paper, black ink, gold accent (`#E3B848`), sage
   (`#65897F`) reserved exclusively for "locked"/"booked" states. Caprasimo
   (display) + Figtree (body), pill-shaped buttons/inputs/tags. This came from
   two rounds: an initial self-authored "Organic" cream/terracotta palette
   (superseded), then the user uploaded Aysha's actual Claude Design canvas
   (`Filmmaking Planner.dc.html`, white/gold/black) which is what's live now.
   The app icon (`src/app/icon.svg`, `src/app/apple-icon.png`) is the identity
   sheet's specified inverted mark: black tile, gold sprocket holes.
3. **90-day challenge** — `challenge_milestones` table, a fixed 16-milestone
   template (`src/app/actions/challenge.ts`) seeded when a project starts the
   challenge, shown on `/projects/[id]`.
4. **Screenwriting beat sheet** — `story_beats` table, an 11-beat
   Save-the-Cat-lite template (`src/app/actions/beats.ts`), also on
   `/projects/[id]`.
5. **Industry network + messaging** — opt-in directory (`profiles.is_public`)
   spanning all roles including crew (see `src/lib/roles.ts` for the full
   list), `/network` to browse/filter and start a conversation, `/messages`
   inbox + thread view (`conversations`/`conversation_participants`/`messages`
   tables). "Meetings" is a pragmatic stand-in for real Zoom API integration
   (no credentials available): each profile can paste a personal
   Zoom/Meet link (`profiles.meeting_url`) that surfaces as a "Join call"
   button in a conversation.

`supabase/schema.sql` and `supabase/seed.sql` are kept as the readable source of
truth and mirror what's actually applied to the live database — if you change the
schema locally, apply it to the Supabase project directly (dashboard SQL editor or
CLI) *and* update these files, in that order, so they never drift.

## Explicitly still open

- **Course and Shopify links are placeholders** (`src/lib/external-links.ts`,
  both currently point at `filmmakingplanner.com`). Swap in the real URLs
  whenever Aysha sends them.
- **No desktop-specific layout exists in the real app.** What was shown as a
  "web app" / desktop version was a static design mockup (an Artifact, not
  code) with a sidebar-nav app shell. The live app is one responsive site that
  works on desktop but keeps the same mobile-first centered-column layout at
  every width. If a real desktop layout (sidebar, wider grids) is wanted,
  that's a from-scratch build against the existing pages, not a copy-paste of
  the mockup HTML.
- **Demo/seed accounts should be rotated or deleted before any real launch** —
  six fictional accounts share the password `GreenRoom!Seed1` (see
  `README.md`). They exist purely so every planner section is testable
  out of the box.
- **No custom domain configured** — still on the Vercel branch-alias URL above.
- Two Supabase Auth advisories are pre-existing and unrelated to this work:
  leaked-password-protection is disabled (a one-click toggle in Auth settings
  if wanted).

## Local dev

```bash
cd green-room
npm install
npm run dev        # http://localhost:3000, no .env.local required
npm run lint
npm run build
```

Seed accounts (password `GreenRoom!Seed1` for all): see the table in
`README.md`. `lena.brandt@example.com` (writer + actor) exercises the most
features in one account.

## Notes if you're a fresh Claude Code session reading this

- This file was written from the *previous* session's actual state, not
  regenerated from git log — trust it over guessing from commit messages
  alone, but verify against the live schema with `list_tables`/`get_advisors`
  before making changes, since the human may have made local edits since.
- Don't reintroduce StudioBinder-style production-suite features (call
  sheets, script breakdowns, shot lists, shooting schedules, storyboards)
  unless explicitly asked — that scope was deliberately declined earlier.
- The user prefers being asked before large, ambiguous scope expansions but
  is comfortable delegating implementation details once direction is clear.
