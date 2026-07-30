-- Project Galley — initial schema
-- Concierge introduction service: owner requests + chef applications, reviewed and
-- matched by hand by an admin. No automated matching yet, but the shape (separate
-- match + match_chefs join) leaves room to bolt algorithmic matching on later.

-- ── ADMINS ──────────────────────────────────────────────────
-- Allowlist of Supabase Auth users permitted to use the concierge console.
-- Add rows manually after an admin creates their auth account:
--   insert into admins (user_id) values ('<uuid from auth.users>');
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create policy "Admins can read the allowlist"
  on admins for select
  using (auth.uid() = user_id);

-- ── WAITLIST ────────────────────────────────────────────────
create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  region text not null check (region in ('mediterranean', 'caribbean')),
  role text check (role in ('owner', 'chef')),
  created_at timestamptz not null default now(),
  unique (email, region)
);

alter table waitlist_signups enable row level security;

create policy "Anyone can join the waitlist"
  on waitlist_signups for insert
  with check (true);

create policy "Admins can view the waitlist"
  on waitlist_signups for select
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- ── OWNER REQUESTS ──────────────────────────────────────────
create table owner_requests (
  id uuid primary key default gen_random_uuid(),
  owner_name text not null,
  email text not null,
  phone text,
  vessel_name text,
  vessel_length_m numeric,
  region text not null check (region in ('mediterranean', 'caribbean', 'other')),
  season_start date,
  season_end date,
  crew_size int,
  guests_size int,
  cuisine_preferences text[] not null default '{}',
  dietary_requirements text,
  budget_range text,
  chef_type text check (chef_type in ('seasonal', 'permanent', 'rotational', 'single_charter')),
  additional_notes text,
  status text not null default 'new' check (status in ('new', 'in_review', 'matched', 'closed')),
  created_at timestamptz not null default now()
);

alter table owner_requests enable row level security;

create policy "Anyone can submit an owner request"
  on owner_requests for insert
  with check (true);

create policy "Admins can view owner requests"
  on owner_requests for select
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

create policy "Admins can update owner requests"
  on owner_requests for update
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- ── CHEFS ───────────────────────────────────────────────────
create table chefs (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  photo_path text,
  years_experience int,
  cuisine_specialties text[] not null default '{}',
  certifications text,
  regions_available text[] not null default '{}',
  day_rate_expectation text,
  availability_start date,
  availability_notes text,
  cover_letter text,
  cv_path text,
  status text not null default 'pending_review' check (status in ('pending_review', 'vetted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table chefs enable row level security;

create policy "Anyone can submit a chef application"
  on chefs for insert
  with check (true);

create policy "Admins can view chefs"
  on chefs for select
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

create policy "Admins can update chefs"
  on chefs for update
  using (exists (select 1 from admins where admins.user_id = auth.uid()));

-- ── MATCHES ─────────────────────────────────────────────────
-- One match record per introduction, covering one request and one-or-more chefs.
create table matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references owner_requests(id) on delete cascade,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table matches enable row level security;

create policy "Admins can manage matches"
  on matches for all
  using (exists (select 1 from admins where admins.user_id = auth.uid()))
  with check (exists (select 1 from admins where admins.user_id = auth.uid()));

create table match_chefs (
  match_id uuid not null references matches(id) on delete cascade,
  chef_id uuid not null references chefs(id) on delete cascade,
  primary key (match_id, chef_id)
);

alter table match_chefs enable row level security;

create policy "Admins can manage match chefs"
  on match_chefs for all
  using (exists (select 1 from admins where admins.user_id = auth.uid()))
  with check (exists (select 1 from admins where admins.user_id = auth.uid()));

-- Recording a match moves the request out of the open queue automatically.
create function mark_request_matched() returns trigger as $$
begin
  update owner_requests set status = 'matched' where id = new.request_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_match_created
  after insert on matches
  for each row execute function mark_request_matched();

-- ── INDEXES ─────────────────────────────────────────────────
create index idx_owner_requests_status on owner_requests(status);
create index idx_owner_requests_region on owner_requests(region);
create index idx_chefs_status on chefs(status);
create index idx_chefs_regions on chefs using gin(regions_available);
create index idx_matches_request_id on matches(request_id);
create index idx_match_chefs_chef_id on match_chefs(chef_id);

-- ── STORAGE ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('chef-photos', 'chef-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chef-documents', 'chef-documents', false)
on conflict (id) do nothing;

create policy "Anyone can upload a chef photo"
  on storage.objects for insert
  with check (bucket_id = 'chef-photos');

create policy "Admins can read chef photos"
  on storage.objects for select
  using (
    bucket_id = 'chef-photos'
    and exists (select 1 from admins where admins.user_id = auth.uid())
  );

create policy "Anyone can upload a chef document"
  on storage.objects for insert
  with check (bucket_id = 'chef-documents');

create policy "Admins can read chef documents"
  on storage.objects for select
  using (
    bucket_id = 'chef-documents'
    and exists (select 1 from admins where admins.user_id = auth.uid())
  );
