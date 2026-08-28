-- The Green Room — planner schema
-- A private, per-user production/career planner for screen creatives.
-- Every table is owner-only: a row is visible and writable only to the
-- profile that owns it. There is no admin role and no shared/public content.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'New member',
  bio text,
  photo_url text,
  location text,
  -- Drives which planner sections show up: any of 'writer', 'director', 'actor'.
  creative_roles text[] not null default '{}',
  links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users id. Created automatically by handle_new_user().';

create schema if not exists private;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

revoke execute on function private.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;

-- Private planner: you can only see your own profile.
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No insert/delete policy: rows are created only via handle_new_user() and
-- deleted only via the auth.users cascade.

-- ---------------------------------------------------------------------------
-- projects (writer / director)
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  logline text,
  format text not null default 'feature' check (format in ('short', 'feature', 'pilot', 'tv_movie', 'other')),
  stage text not null default 'idea' check (
    stage in ('idea', 'outline', 'drafting', 'revision', 'polish', 'locked', 'in_production', 'delivered')
  ),
  target_deadline date,
  created_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects (owner_id);

alter table public.projects enable row level security;

create policy projects_owner_only on public.projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- scenes (belong to a project)
-- ---------------------------------------------------------------------------
create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scene_number int not null default 1,
  heading text not null default '',
  status text not null default 'needs_work' check (status in ('needs_work', 'drafted', 'revised', 'locked')),
  notes text,
  created_at timestamptz not null default now()
);

create index scenes_project_id_idx on public.scenes (project_id);

alter table public.scenes enable row level security;

create policy scenes_owner_only on public.scenes
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- submissions (belong to a project — competitions, agents, producers)
-- ---------------------------------------------------------------------------
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  target_name text not null,
  target_type text not null default 'other' check (target_type in ('competition', 'festival', 'agent', 'producer', 'other')),
  submitted_at date not null default current_date,
  response_due_at date,
  status text not null default 'submitted' check (status in ('submitted', 'pending', 'rejected', 'accepted')),
  notes text,
  created_at timestamptz not null default now()
);

create index submissions_project_id_idx on public.submissions (project_id);

alter table public.submissions enable row level security;

create policy submissions_owner_only on public.submissions
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- writing goals + session log
-- ---------------------------------------------------------------------------
create table public.writing_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  cadence text not null default 'daily' check (cadence in ('daily', 'weekly')),
  unit text not null default 'pages' check (unit in ('words', 'pages')),
  target_amount int not null default 1 check (target_amount > 0)
);

alter table public.writing_goals enable row level security;

create policy writing_goals_owner_only on public.writing_goals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table public.writing_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  session_date date not null default current_date,
  unit text not null default 'pages' check (unit in ('words', 'pages')),
  amount int not null check (amount > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index writing_sessions_owner_id_idx on public.writing_sessions (owner_id, session_date desc);

alter table public.writing_sessions enable row level security;

create policy writing_sessions_owner_only on public.writing_sessions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- materials (headshots, reels, resume versions)
-- ---------------------------------------------------------------------------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'other' check (type in ('headshot', 'reel', 'resume', 'other')),
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index materials_owner_id_idx on public.materials (owner_id);

alter table public.materials enable row level security;

create policy materials_owner_only on public.materials
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- auditions (actor pipeline, with sides/self-tape fields inline)
-- ---------------------------------------------------------------------------
create table public.auditions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  project_name text not null,
  role_name text not null,
  casting_office text,
  audition_date timestamptz,
  callback_date timestamptz,
  status text not null default 'submitted' check (status in ('submitted', 'callback', 'booked', 'passed', 'declined')),
  sides_url text,
  self_tape_deadline timestamptz,
  self_tape_url text,
  take_notes text,
  headshot_id uuid references public.materials (id) on delete set null,
  resume_id uuid references public.materials (id) on delete set null,
  reel_id uuid references public.materials (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index auditions_owner_id_idx on public.auditions (owner_id);

alter table public.auditions enable row level security;

create policy auditions_owner_only on public.auditions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- availability (blocked date ranges — default assumption is "available")
-- ---------------------------------------------------------------------------
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index availability_blocks_owner_id_idx on public.availability_blocks (owner_id);

alter table public.availability_blocks enable row level security;

create policy availability_blocks_owner_only on public.availability_blocks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- storage: public media bucket for headshots / reels / sides / attachments
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Object paths are namespaced "<uid>/...", enforced below so members can only
-- write inside their own folder.
create policy media_select_public on storage.objects
  for select using (bucket_id = 'media');

create policy media_insert_own_folder on storage.objects
  for insert with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy media_update_own_folder on storage.objects
  for update using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy media_delete_own_folder on storage.objects
  for delete using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
