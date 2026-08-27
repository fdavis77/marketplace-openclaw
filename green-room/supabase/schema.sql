-- The Green Room — schema + RLS
-- Roles: guest (no auth.uid()), member (authenticated, role='member'), admin (role='admin')

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
  creative_roles text[] not null default '{}',
  links jsonb not null default '{}'::jsonb,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users id. Created automatically by handle_new_user().';

-- Admin check as SECURITY DEFINER so RLS policies on profiles don't recurse.
create function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

-- Auto-create a profile row when a new auth user signs up. Role is always
-- 'member' here — nobody can request 'admin' at signup time.
create function public.handle_new_user()
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
  for each row execute function public.handle_new_user();

-- Block self-promotion: role can only change when the actor is already an admin.
create function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin(auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

alter table public.profiles enable row level security;

-- Public read (guests browse member profiles, spotlight archive, etc).
create policy profiles_select_all on public.profiles
  for select using (true);

-- Members can edit their own row (role changes are neutralized by the trigger above).
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Admins can edit any profile (e.g. promote a moderator, fix a listing).
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- No insert/delete policy: rows are created only via handle_new_user() and
-- deleted only via the auth.users cascade. Client-side insert/delete is denied by default.

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  location text,
  is_online boolean not null default false,
  price_note text not null default 'Free',
  start_at timestamptz not null,
  end_at timestamptz,
  external_url text,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index events_start_at_idx on public.events (start_at);

alter table public.events enable row level security;

create policy events_select_published_or_admin on public.events
  for select using (is_published or public.is_admin(auth.uid()));

create policy events_write_admin on public.events
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text not null,
  description text not null default '',
  category text not null default 'general',
  deadline_at timestamptz not null,
  external_url text,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index opportunities_deadline_at_idx on public.opportunities (deadline_at);

alter table public.opportunities enable row level security;

create policy opportunities_select_published_or_admin on public.opportunities
  for select using (is_published or public.is_admin(auth.uid()));

create policy opportunities_write_admin on public.opportunities
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default 'general',
  external_url text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy resources_select_published_or_admin on public.resources
  for select using (is_published or public.is_admin(auth.uid()));

create policy resources_write_admin on public.resources
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- spotlights
-- ---------------------------------------------------------------------------
create table public.spotlights (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  headline text not null,
  story text not null default '',
  is_current boolean not null default false,
  published_at timestamptz
);

-- Only one spotlight may be "current" at a time.
create function public.enforce_single_current_spotlight()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_current then
    update public.spotlights set is_current = false where id <> new.id and is_current;
  end if;
  return new;
end;
$$;

create trigger spotlights_single_current
  before insert or update on public.spotlights
  for each row execute function public.enforce_single_current_spotlight();

alter table public.spotlights enable row level security;

create policy spotlights_select_published_or_admin on public.spotlights
  for select using (published_at is not null or public.is_admin(auth.uid()));

create policy spotlights_write_admin on public.spotlights
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- nominations (member-submitted, admin-reviewed — holds contact details, so
-- it is never publicly readable)
-- ---------------------------------------------------------------------------
create table public.nominations (
  id uuid primary key default gen_random_uuid(),
  nominator_id uuid not null references public.profiles (id) on delete cascade,
  nominee_name text not null,
  nominee_contact text,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.nominations enable row level security;

create policy nominations_select_own_or_admin on public.nominations
  for select using (nominator_id = auth.uid() or public.is_admin(auth.uid()));

create policy nominations_insert_own on public.nominations
  for insert with check (nominator_id = auth.uid());

create policy nominations_update_admin on public.nominations
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- posts + comments + likes (community feed)
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  image_url text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy posts_select_visible on public.posts
  for select using (not is_hidden or author_id = auth.uid() or public.is_admin(auth.uid()));

create policy posts_insert_own on public.posts
  for insert with check (author_id = auth.uid());

-- Authors can edit their own text/image but cannot un-hide a moderated post.
create policy posts_update_own on public.posts
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid() and is_hidden = false);

create policy posts_update_admin on public.posts
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy posts_delete_own_or_admin on public.posts
  for delete using (author_id = auth.uid() or public.is_admin(auth.uid()));

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);

alter table public.comments enable row level security;

create policy comments_select_visible on public.comments
  for select using (not is_hidden or author_id = auth.uid() or public.is_admin(auth.uid()));

create policy comments_insert_own on public.comments
  for insert with check (author_id = auth.uid());

create policy comments_update_own on public.comments
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid() and is_hidden = false);

create policy comments_update_admin on public.comments
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy comments_delete_own_or_admin on public.comments
  for delete using (author_id = auth.uid() or public.is_admin(auth.uid()));

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy post_likes_select_all on public.post_likes
  for select using (true);

create policy post_likes_insert_own on public.post_likes
  for insert with check (user_id = auth.uid());

create policy post_likes_delete_own on public.post_likes
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- saved_items (private bookmarks)
-- ---------------------------------------------------------------------------
create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('event', 'opportunity')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

alter table public.saved_items enable row level security;

create policy saved_items_owner_only on public.saved_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- subscribers (newsletter capture — write-only from the public, never
-- publicly readable so email addresses can't be scraped)
-- ---------------------------------------------------------------------------
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

create policy subscribers_insert_anyone on public.subscribers
  for insert with check (true);

create policy subscribers_select_admin on public.subscribers
  for select using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- storage: public media bucket for headshots + post images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Object paths are namespaced "<uid>/...", enforced below so members can only
-- write inside their own folder. Reads are public (avatars/post images are
-- meant to be visible to guests too).
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

create policy media_delete_own_or_admin on storage.objects
  for delete using (
    bucket_id = 'media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
    )
  );
