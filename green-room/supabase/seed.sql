-- The Green Room — planner seed data
-- Everything below is fictional: names and avatars (DiceBear generated, not
-- photographs) are invented for demo purposes only.
--
-- The auth accounts below already exist from an earlier seed pass; this
-- script only (re)creates their profiles rows and planner content.
-- Shared password: GreenRoom!Seed1

insert into public.profiles (id, display_name, bio, location, creative_roles, photo_url, links)
values
  ((select id from auth.users where email = 'admin@thegreenroom.demo'),
   'Jordan Ellis', 'Fictional demo profile. Screenwriter developing a first feature.',
   'London, UK', array['writer'],
   'https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan%20Ellis', '{}'::jsonb),
  ((select id from auth.users where email = 'ava.whitfield@example.com'),
   'Ava Whitfield', 'Fictional demo profile. Writer-director, three shorts on the festival circuit this year.',
   'London, UK', array['writer', 'director'],
   'https://api.dicebear.com/9.x/avataaars/svg?seed=Ava%20Whitfield',
   '{"imdb": "https://www.imdb.com/name/example-ava"}'::jsonb),
  ((select id from auth.users where email = 'marcus.reid@example.com'),
   'Marcus Reid', 'Fictional demo profile. Director moving from shorts into his first feature.',
   'Bristol, UK', array['director'],
   'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus%20Reid',
   '{"site": "https://example-marcus.co.uk"}'::jsonb),
  ((select id from auth.users where email = 'priya.nair@example.com'),
   'Priya Nair', 'Fictional demo profile. Screenwriter, currently on her second feature spec.',
   'Manchester, UK', array['writer'],
   'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya%20Nair', '{}'::jsonb),
  ((select id from auth.users where email = 'tom.okafor@example.com'),
   'Tom Okafor', 'Fictional demo profile. Actor, mostly drama and commercial work.',
   'Glasgow, UK', array['actor'],
   'https://api.dicebear.com/9.x/avataaars/svg?seed=Tom%20Okafor',
   '{"imdb": "https://www.imdb.com/name/example-tom"}'::jsonb),
  ((select id from auth.users where email = 'lena.brandt@example.com'),
   'Lena Brandt', 'Fictional demo profile. Actor and screenwriter, developing her own feature.',
   'Edinburgh, UK', array['actor', 'writer'],
   'https://api.dicebear.com/9.x/avataaars/svg?seed=Lena%20Brandt',
   '{"imdb": "https://www.imdb.com/name/example-lena", "instagram": "https://instagram.com/example.lena"}'::jsonb)
on conflict (id) do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  location = excluded.location,
  creative_roles = excluded.creative_roles,
  photo_url = excluded.photo_url,
  links = excluded.links;

-- ---------------------------------------------------------------------------
-- writer / director: projects, scenes, submissions, goals, sessions
-- ---------------------------------------------------------------------------
with new_projects as (
  insert into public.projects (owner_id, title, logline, format, stage, target_deadline)
  values
    ((select id from auth.users where email = 'ava.whitfield@example.com'),
     'Low Tide', 'A lighthouse keeper''s estranged daughter returns for one last winter before the station closes.',
     'feature', 'outline', current_date + interval '90 days'),
    ((select id from auth.users where email = 'priya.nair@example.com'),
     'Paper Boats', 'Two sisters rebuild their late father''s failing boatyard over one summer.',
     'feature', 'drafting', current_date + interval '60 days'),
    ((select id from auth.users where email = 'admin@thegreenroom.demo'),
     'Nightshift', 'A hospital porter becomes convinced a patient in the morgue is still alive.',
     'pilot', 'revision', current_date + interval '30 days'),
    ((select id from auth.users where email = 'marcus.reid@example.com'),
     'Concrete Garden', 'A council estate community garden becomes a battleground over redevelopment.',
     'feature', 'in_production', current_date + interval '120 days')
  returning id, title, owner_id
)
insert into public.scenes (project_id, scene_number, heading, status, notes)
select id, s.scene_number, s.heading, s.status, s.notes
from new_projects p
join lateral (
  values
    (1, 'INT. LIGHTHOUSE - KITCHEN - NIGHT', 'locked', 'Opening image, keep dialogue minimal.'),
    (2, 'EXT. HARBOUR - DAY', 'revised', 'Trim the walk-and-talk by half a page.'),
    (3, 'INT. LIGHTHOUSE - STAIRWELL - CONTINUOUS', 'drafted', null),
    (4, 'EXT. CLIFF PATH - DUSK', 'needs_work', 'Confrontation scene still isn''t landing — try cutting the dialogue entirely.'),
    (5, 'INT. LIGHTHOUSE - LAMP ROOM - NIGHT', 'needs_work', 'Ending beat, needs a full rewrite.')
) as s(scene_number, heading, status, notes) on true
where p.title = 'Low Tide';

insert into public.scenes (project_id, scene_number, heading, status, notes)
select id, s.scene_number, s.heading, s.status, s.notes
from (select id, title from public.projects where title = 'Paper Boats') p
join lateral (
  values
    (1, 'EXT. BOATYARD - MORNING', 'revised', null),
    (2, 'INT. WORKSHOP - DAY', 'drafted', 'Needs a beat where they find the ledger.'),
    (3, 'EXT. BOATYARD - JETTY - SUNSET', 'needs_work', null)
) as s(scene_number, heading, status, notes) on true;

with new_projects as (
  select id, title from public.projects where title in ('Low Tide', 'Paper Boats', 'Nightshift')
)
insert into public.submissions (project_id, target_name, target_type, submitted_at, response_due_at, status, notes)
select id,
  s.target_name, s.target_type, current_date + (s.submitted_offset || ' days')::interval,
  current_date + (s.due_offset || ' days')::interval, s.status, s.notes
from new_projects p
join lateral (
  values
    ('Low Tide', 'Fringe Frame Festival Screenplay Lab (fictional)', 'competition', -20, 10, 'pending', 'Advanced past the first read.'),
    ('Low Tide', 'Riverside Literary Management (fictional)', 'agent', -45, -15, 'rejected', 'Passed, but requested to see the next draft.'),
    ('Paper Boats', 'BFI Network Early Development (fictional)', 'producer', -10, 20, 'submitted', null),
    ('Nightshift', 'Northern Writers'' Pilot Showcase (fictional)', 'competition', -5, 25, 'submitted', null)
) as s(proj_title, target_name, target_type, submitted_offset, due_offset, status, notes) on s.proj_title = p.title;

insert into public.writing_goals (owner_id, cadence, unit, target_amount)
values
  ((select id from auth.users where email = 'ava.whitfield@example.com'), 'daily', 'pages', 3),
  ((select id from auth.users where email = 'priya.nair@example.com'), 'weekly', 'words', 5000),
  ((select id from auth.users where email = 'admin@thegreenroom.demo'), 'daily', 'pages', 2);

insert into public.writing_sessions (owner_id, project_id, session_date, unit, amount, notes)
select (select id from auth.users where email = 'ava.whitfield@example.com'),
  (select id from public.projects where title = 'Low Tide'),
  current_date - (n || ' days')::interval, 'pages', (2 + (n % 3)), null
from generate_series(1, 6) as n;

insert into public.writing_sessions (owner_id, project_id, session_date, unit, amount, notes)
select (select id from auth.users where email = 'priya.nair@example.com'),
  (select id from public.projects where title = 'Paper Boats'),
  current_date - (n || ' days')::interval, 'words', (900 + (n * 150)), null
from generate_series(1, 4) as n;

-- ---------------------------------------------------------------------------
-- actor: materials, auditions, availability
-- ---------------------------------------------------------------------------
insert into public.materials (owner_id, type, label, url)
values
  ((select id from auth.users where email = 'tom.okafor@example.com'), 'headshot', 'Headshot — natural light, 2026', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Tom%20Okafor%20Headshot'),
  ((select id from auth.users where email = 'tom.okafor@example.com'), 'resume', 'CV — Spring 2026', 'https://example.org/materials/tom-cv-2026.pdf'),
  ((select id from auth.users where email = 'tom.okafor@example.com'), 'reel', 'Drama reel — 90s cut', 'https://vimeo.com/example-tom-reel'),
  ((select id from auth.users where email = 'lena.brandt@example.com'), 'headshot', 'Headshot — studio, 2026', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lena%20Brandt%20Headshot'),
  ((select id from auth.users where email = 'lena.brandt@example.com'), 'resume', 'CV — 2026', 'https://example.org/materials/lena-cv-2026.pdf'),
  ((select id from auth.users where email = 'lena.brandt@example.com'), 'reel', 'Comedy + drama reel', 'https://vimeo.com/example-lena-reel');

insert into public.auditions (owner_id, project_name, role_name, casting_office, audition_date, callback_date, status, sides_url, self_tape_deadline, self_tape_url, take_notes, headshot_id, resume_id, reel_id, notes)
values
  ((select id from auth.users where email = 'tom.okafor@example.com'),
   'Harbour Lights (TV drama)', 'DS Wren', 'Riverside Casting (fictional)',
   now() + interval '4 days', null, 'submitted',
   'https://example.org/sides/harbour-lights-wren.pdf', now() + interval '2 days', null, null,
   (select id from public.materials where label = 'Headshot — natural light, 2026'),
   (select id from public.materials where label = 'CV — Spring 2026'),
   (select id from public.materials where label = 'Drama reel — 90s cut'),
   'Self-tape only for round one.'),
  ((select id from auth.users where email = 'tom.okafor@example.com'),
   'Northline (feature)', 'Callum', 'Fringe Frame Casting (fictional)',
   now() - interval '10 days', now() + interval '3 days', 'callback',
   null, null, 'https://vimeo.com/example-tom-tape-northline', 'Callback is in-person, bring the grey jacket.',
   (select id from public.materials where label = 'Headshot — natural light, 2026'),
   (select id from public.materials where label = 'CV — Spring 2026'),
   null, null),
  ((select id from auth.users where email = 'tom.okafor@example.com'),
   'Speakeasy (short film)', 'Barman', 'Independent (fictional)',
   now() - interval '30 days', null, 'passed',
   null, null, null, 'Went with someone more local to the shoot location.',
   null, null, null, null),
  ((select id from auth.users where email = 'lena.brandt@example.com'),
   'The Understudy (feature)', 'Nadia', 'Set & Story Casting (fictional)',
   now() + interval '1 days', null, 'submitted',
   'https://example.org/sides/understudy-nadia.pdf', now() - interval '1 hours', 'https://vimeo.com/example-lena-tape-understudy', 'Two takes sent, second one is stronger.',
   (select id from public.materials where label = 'Headshot — studio, 2026'),
   (select id from public.materials where label = 'CV — 2026'),
   (select id from public.materials where label = 'Comedy + drama reel'),
   null),
  ((select id from auth.users where email = 'lena.brandt@example.com'),
   'Reel Diversity Showcase (short film)', 'Priya', 'Wide Lens Collective (fictional)',
   now() - interval '3 days', now() + interval '6 days', 'callback',
   null, null, null, null,
   (select id from public.materials where label = 'Headshot — studio, 2026'),
   null, null, 'Callback is a chemistry read with two other actors.');

insert into public.availability_blocks (owner_id, start_date, end_date, reason)
values
  ((select id from auth.users where email = 'tom.okafor@example.com'), current_date + 14, current_date + 21, 'Booked — corporate video shoot'),
  ((select id from auth.users where email = 'lena.brandt@example.com'), current_date + 5, current_date + 8, 'Unavailable — family commitment');
