-- The Green Room — seed data
-- Everything below is fictional: names, org names, and avatars (DiceBear
-- generated, not photographs) are invented for demo purposes only.
--
-- Seed accounts share the password: GreenRoom!Seed1
-- Rotate or delete these before any real launch — see README "Seed accounts".

-- ---------------------------------------------------------------------------
-- Seed auth users directly (bypasses GoTrue signup — fine for local/demo
-- data). The on_auth_user_created trigger fires normally and creates the
-- matching public.profiles row.
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'admin@thegreenroom.demo', crypt('GreenRoom!Seed1', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Green Room Admin"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'ava.whitfield@example.com', crypt('GreenRoom!Seed1', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Ava Whitfield"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'marcus.reid@example.com', crypt('GreenRoom!Seed1', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Marcus Reid"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'priya.nair@example.com', crypt('GreenRoom!Seed1', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Priya Nair"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'tom.okafor@example.com', crypt('GreenRoom!Seed1', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Tom Okafor"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'lena.brandt@example.com', crypt('GreenRoom!Seed1', gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Lena Brandt"}',
   '', '', '', '');

-- Promote the admin demo account.
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@thegreenroom.demo');

-- Flesh out the member profiles.
update public.profiles set
  bio = 'Fictional demo profile. Indie director, three shorts on the festival circuit this year.',
  location = 'London, UK',
  creative_roles = array['director', 'writer'],
  photo_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ava%20Whitfield',
  links = '{"reel": "https://vimeo.com/example-ava", "instagram": "https://instagram.com/example.ava"}'::jsonb
where id = (select id from auth.users where email = 'ava.whitfield@example.com');

update public.profiles set
  bio = 'Fictional demo profile. DP shooting mostly on 16mm, based between Bristol and Cardiff.',
  location = 'Bristol, UK',
  creative_roles = array['director of photography'],
  photo_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus%20Reid',
  links = '{"reel": "https://vimeo.com/example-marcus", "site": "https://example-marcus.co.uk"}'::jsonb
where id = (select id from auth.users where email = 'marcus.reid@example.com');

update public.profiles set
  bio = 'Fictional demo profile. Editor and colourist, previously cut two BFI Network shorts.',
  location = 'Manchester, UK',
  creative_roles = array['editor'],
  photo_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya%20Nair',
  links = '{"imdb": "https://www.imdb.com/name/example-priya"}'::jsonb
where id = (select id from auth.users where email = 'priya.nair@example.com');

update public.profiles set
  bio = 'Fictional demo profile. Sound recordist and designer for documentary and drama.',
  location = 'Glasgow, UK',
  creative_roles = array['sound'],
  photo_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Tom%20Okafor',
  links = '{"site": "https://example-tom.co.uk"}'::jsonb
where id = (select id from auth.users where email = 'tom.okafor@example.com');

update public.profiles set
  bio = 'Fictional demo profile. Actor and screenwriter, currently developing a feature.',
  location = 'Edinburgh, UK',
  creative_roles = array['actor', 'writer'],
  photo_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lena%20Brandt',
  links = '{"imdb": "https://www.imdb.com/name/example-lena", "instagram": "https://instagram.com/example.lena"}'::jsonb
where id = (select id from auth.users where email = 'lena.brandt@example.com');

update public.profiles set
  bio = 'Platform admin account for The Green Room demo.',
  location = 'London, UK',
  creative_roles = array['producer'],
  photo_url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Green%20Room%20Admin'
where id = (select id from auth.users where email = 'admin@thegreenroom.demo');

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
insert into public.events (title, description, location, is_online, price_note, start_at, end_at, external_url, is_published, created_by)
values
  ('Short Film Showcase: Autumn Selects', 'An evening screening of six independent shorts from emerging UK filmmakers, followed by a Q&A with the directors.', 'Rio Cinema, London', false, 'Pay what you can', '2026-09-12 19:00+01', '2026-09-12 22:00+01', 'https://example.org/events/autumn-selects', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Intro to Colour Grading (Online Workshop)', 'A hands-on DaVinci Resolve workshop for editors moving into colour work. Bring your own laptop.', null, true, '£15', '2026-09-20 18:30+01', '2026-09-20 21:00+01', 'https://example.org/events/colour-grading', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Northern Filmmakers Mixer', 'Informal meetup for crew and cast based in the North West — bring a business card, leave with three.', 'The Refuge, Manchester', false, 'Free', '2026-09-27 18:00+01', '2026-09-27 21:00+01', 'https://example.org/events/northern-mixer', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Writers'' Room: Breaking a Feature in a Weekend', 'A two-day intensive for screenwriters structuring a first feature draft.', 'Watershed, Bristol', false, '£45', '2026-10-10 09:30+01', '2026-10-11 17:00+01', 'https://example.org/events/writers-room', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Documentary Funding Q&A (Online)', 'Panel with funders and past grant recipients on what actually gets a documentary pitch funded.', null, true, 'Free', '2026-10-16 12:00+01', '2026-10-16 13:30+01', 'https://example.org/events/doc-funding-qa', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('On-Set First Aid Certification', 'One-day accredited course covering set-specific first aid, required for many crew calls.', 'Pinewood Studios area, Iver', false, '£85', '2026-11-03 08:30+00', '2026-11-03 17:00+00', 'https://example.org/events/first-aid-cert', true, (select id from auth.users where email = 'admin@thegreenroom.demo'));

-- ---------------------------------------------------------------------------
-- opportunities (2 already past their deadline, to exercise the "Closed" state)
-- ---------------------------------------------------------------------------
insert into public.opportunities (title, organizer, description, category, deadline_at, external_url, is_published, created_by)
values
  ('Micro-Budget Short Film Fund', 'Independent Screen Trust (fictional)', 'Grants up to £3,000 for shorts under 15 minutes with a UK-based lead director.', 'funding', '2026-09-15 23:59+01', 'https://example.org/opportunities/micro-budget-fund', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('First-Time Director Screenwriting Lab', 'Riverside Script Lab (fictional)', 'Six-month mentored development programme for a debut feature screenplay.', 'screenwriting', '2026-09-30 23:59+01', 'https://example.org/opportunities/screenwriting-lab', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Open Call: Experimental Short Showcase', 'Fringe Frame Festival (fictional)', 'Submissions open for experimental and non-narrative work under 20 minutes.', 'short film', '2026-10-05 23:59+01', 'https://example.org/opportunities/experimental-showcase', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Regional Crew Bursary — North East', 'Northern Reel Fund (fictional)', 'Travel and accommodation bursary for North East-based crew taking roles on qualifying productions.', 'funding', '2026-10-20 23:59+01', 'https://example.org/opportunities/crew-bursary-ne', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Assistant Editor — Feature Documentary', 'Longshore Docs (fictional)', 'Six-week paid assistant editor role on a feature-length documentary in post-production.', 'jobs', '2026-11-01 23:59+00', 'https://example.org/opportunities/assistant-editor-doc', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Diverse Voices Short Film Competition', 'Wide Lens Collective (fictional)', 'Competition for underrepresented filmmakers telling personal stories, top prize includes finishing funds.', 'short film', '2026-11-14 23:59+00', 'https://example.org/opportunities/diverse-voices', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Summer Runner Programme — Studio Placements', 'Set & Story Studios (fictional)', 'Paid runner placements across three feature productions, applications closed for this cycle.', 'jobs', '2026-08-10 23:59+01', 'https://example.org/opportunities/summer-runners', true, (select id from auth.users where email = 'admin@thegreenroom.demo')),
  ('Micro-Doc Pitch Day', 'Realview Documentary Fund (fictional)', 'Live pitch day for micro-documentary funding, applications for this round have now closed.', 'funding', '2026-08-20 23:59+01', 'https://example.org/opportunities/micro-doc-pitch', true, (select id from auth.users where email = 'admin@thegreenroom.demo'));

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------
insert into public.resources (name, description, category, external_url, is_published)
values
  ('Independent Screen Trust (fictional)', 'Grant funding and business advice for independent filmmakers at every career stage.', 'funding', 'https://example.org/resources/independent-screen-trust', true),
  ('Reel Skills Training Co-op (fictional)', 'Subsidised short courses covering camera, sound, lighting, and post-production.', 'training', 'https://example.org/resources/reel-skills-coop', true),
  ('Crew Connect Jobs Board (fictional)', 'Daily-updated listings for freelance crew roles across UK productions.', 'jobs', 'https://example.org/resources/crew-connect', true),
  ('Screen Diversity Network (fictional)', 'Representation and support body for underrepresented screen industry workers.', 'community & representation', 'https://example.org/resources/screen-diversity-network', true),
  ('Northern Reel Fund (fictional)', 'Regional funding body supporting production based outside London and the South East.', 'funding', 'https://example.org/resources/northern-reel-fund', true),
  ('Set Ready Safety Courses (fictional)', 'Accredited on-set safety, first aid, and manual handling certification.', 'training', 'https://example.org/resources/set-ready-safety', true),
  ('Freelancer Contracts Clinic (fictional)', 'Free contract review and rate-card guidance for freelance crew and cast.', 'community & representation', 'https://example.org/resources/contracts-clinic', true),
  ('Documentary Finishing Fund (fictional)', 'Completion funding for documentaries within six months of a rough cut.', 'funding', 'https://example.org/resources/doc-finishing-fund', true),
  ('Talent Agent Directory — Screen (fictional)', 'Searchable directory of UK talent agencies accepting new client submissions.', 'representation', 'https://example.org/resources/talent-agent-directory', true),
  ('Location Library UK (fictional)', 'Searchable database of filming locations with permit contacts and day rates.', 'jobs', 'https://example.org/resources/location-library', true);

-- ---------------------------------------------------------------------------
-- spotlights
-- ---------------------------------------------------------------------------
insert into public.spotlights (profile_id, headline, story, is_current, published_at)
values
  ((select id from auth.users where email = 'ava.whitfield@example.com'),
   'From short film rejections to a festival selection in eighteen months',
   'Fictional demo story. Ava talks about the three years of self-funded shorts before her fourth film was selected for a regional festival, and what she''d tell her earlier self about persistence and budgeting.',
   true, '2026-08-20 09:00+01'),
  ((select id from auth.users where email = 'marcus.reid@example.com'),
   'Shooting on film stock as an independent DP — what it actually costs',
   'Fictional demo story. Marcus breaks down the real cost difference between shooting 16mm and digital on a micro-budget short, and why he still chooses film for certain projects.',
   false, '2026-07-15 09:00+01'),
  ((select id from auth.users where email = 'lena.brandt@example.com'),
   'Writing the part you can''t get cast in',
   'Fictional demo story. Lena on developing her own feature screenplay after years of being told she wasn''t "right" for the roles she wanted to play.',
   false, '2026-06-02 09:00+01');

-- ---------------------------------------------------------------------------
-- posts + comments + likes
-- ---------------------------------------------------------------------------
with seeded_posts as (
  insert into public.posts (author_id, body, created_at)
  values
    ((select id from auth.users where email = 'ava.whitfield@example.com'), 'Wrapped principal photography on my new short today! Huge thanks to the crew who worked for deferred pay and pure belief in the script. Grading starts next week.', now() - interval '18 days'),
    ((select id from auth.users where email = 'marcus.reid@example.com'), 'Question for other DPs: anyone got a reliable rental house in the North West for anamorphics that won''t eat the whole budget?', now() - interval '17 days'),
    ((select id from auth.users where email = 'priya.nair@example.com'), 'Finished my first assembly cut of a 90-minute documentary. It''s currently 3 hours 40. Send help.', now() - interval '16 days'),
    ((select id from auth.users where email = 'tom.okafor@example.com'), 'PSA: if your location has a working fridge compressor, get a room tone recording before anyone turns it off. Learned this the hard way.', now() - interval '15 days'),
    ((select id from auth.users where email = 'lena.brandt@example.com'), 'Two years into writing my feature and I''ve finally cracked act two. Screenwriting is 10% typing and 90% staring at a wall.', now() - interval '14 days'),
    ((select id from auth.users where email = 'ava.whitfield@example.com'), 'Does anyone have experience applying to the Micro-Budget Short Film Fund? Trying to gauge how competitive the last round was.', now() - interval '13 days'),
    ((select id from auth.users where email = 'marcus.reid@example.com'), 'Reminder that the on-set first aid course in November fills up fast — I booked mine this morning.', now() - interval '12 days'),
    ((select id from auth.users where email = 'priya.nair@example.com'), 'Hot take: temp music is a trap. I''ve fallen in love with three different temp tracks this year and none of them cleared.', now() - interval '11 days'),
    ((select id from auth.users where email = 'tom.okafor@example.com'), 'Looking for a boom op for two days in late September, Glasgow based shoot. DM me if interested.', now() - interval '10 days'),
    ((select id from auth.users where email = 'lena.brandt@example.com'), 'Went to the Northern Filmmakers Mixer last month and ended up with a co-writer for my next short. Go to the mixers, honestly.', now() - interval '9 days'),
    ((select id from auth.users where email = 'ava.whitfield@example.com'), 'Colour grade is done and it looks better than I imagined. Submitting to three festivals this week, fingers crossed.', now() - interval '7 days'),
    ((select id from auth.users where email = 'marcus.reid@example.com'), 'Anyone else find themselves explaining what a DP actually does at every family gathering? Every time.', now() - interval '6 days'),
    ((select id from auth.users where email = 'priya.nair@example.com'), 'Down to 2 hours 5 minutes on the documentary cut. Getting there. Still needs to lose 20 more.', now() - interval '4 days'),
    ((select id from auth.users where email = 'tom.okafor@example.com'), 'Sound design tip of the day: silence is a sound effect. Use it.', now() - interval '2 days'),
    ((select id from auth.users where email = 'lena.brandt@example.com'), 'Submitted my nomination for this month''s Talent Spotlight — someone in this community deserves way more recognition than they''re getting.', now() - interval '1 days')
  returning id, author_id, created_at
)
insert into public.comments (post_id, author_id, body, created_at)
select p.id,
  (select id from auth.users where email = c.commenter_email),
  c.body,
  p.created_at + interval '2 hours'
from seeded_posts p
join lateral (
  values
    ('marcus.reid@example.com', 'Congrats! Can''t wait to see it on the festival circuit.'),
    ('tom.okafor@example.com', 'Well earned after that shoot schedule.')
) as c(commenter_email, body) on true
where p.body like 'Wrapped principal photography%';

insert into public.comments (post_id, author_id, body, created_at)
select id, (select id from auth.users where email = 'lena.brandt@example.com'),
  'Following this thread, also looking for anamorphic rentals up north.',
  created_at + interval '3 hours'
from public.posts
where body like 'Question for other DPs%'
limit 1;

insert into public.comments (post_id, author_id, body, created_at)
select id, (select id from auth.users where email = 'priya.nair@example.com'),
  'The Refuge does a great back room for this kind of thing, glad it worked out!',
  created_at + interval '5 hours'
from public.posts
where body like 'Went to the Northern Filmmakers Mixer%'
limit 1;

insert into public.post_likes (post_id, user_id)
select id, (select id from auth.users where email = 'marcus.reid@example.com')
from public.posts where body like 'Wrapped principal photography%'
union all
select id, (select id from auth.users where email = 'priya.nair@example.com')
from public.posts where body like 'Wrapped principal photography%'
union all
select id, (select id from auth.users where email = 'ava.whitfield@example.com')
from public.posts where body like 'Sound design tip of the day%'
union all
select id, (select id from auth.users where email = 'lena.brandt@example.com')
from public.posts where body like 'Colour grade is done%';
