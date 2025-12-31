-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. PROFILES (Public data for users)
-- ---------------------------------------------------------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text check (role in ('employer', 'seeker', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  city text,
  payment_status text default 'pending', -- 'pending', 'paid', 'expired'
  last_transaction_id text,
  payment_phone text,
  is_verified boolean default false,
  skills text[],
  cv_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Profiles
alter table profiles enable row level security;

-- Drop existing policies to avoid "policy already exists" errors
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);


-- ---------------------------------------------------------
-- 2. JOBS (Posted by Employers)
-- ---------------------------------------------------------
create table if not exists jobs (
  id uuid default uuid_generate_v4() primary key,
  employer_id uuid references profiles(id) on delete cascade,
  title text not null,
  company text not null,        -- Renamed from company_name
  location text not null,
  type text not null,           -- Full-time, Gig, Contract
  salary text,                  -- Renamed from salary_range
  description text,
  status text default 'active', -- active, closed
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Jobs
alter table jobs enable row level security;

drop policy if exists "Jobs are viewable by everyone." on jobs;
drop policy if exists "Employers can insert jobs." on jobs;
drop policy if exists "Employers can update their own jobs." on jobs;
drop policy if exists "Employers can delete their own jobs." on jobs;

create policy "Jobs are viewable by everyone." on jobs
  for select using (true);

create policy "Employers can insert jobs." on jobs
  for insert with check (auth.uid() = employer_id);

create policy "Employers can update their own jobs." on jobs
  for update using (auth.uid() = employer_id);

create policy "Employers can delete their own jobs." on jobs
  for delete using (auth.uid() = employer_id);


-- ---------------------------------------------------------
-- 3. APPLICATIONS (Seekers applying to Jobs)
-- ---------------------------------------------------------
create table if not exists applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs(id) on delete cascade,
  seeker_id uuid references profiles(id) on delete cascade,
  status text default 'pending', -- pending, interviewed, rejected, hired
  cover_letter text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(job_id, seeker_id)
);

alter table applications enable row level security;

drop policy if exists "Employers can see applications for their jobs." on applications;
drop policy if exists "Seekers can see their own applications." on applications;
drop policy if exists "Seekers can insert applications." on applications;

create policy "Employers can see applications for their jobs." on applications
  for select using (
    exists (
      select 1 from jobs
      where jobs.id = applications.job_id
      and jobs.employer_id = auth.uid()
    )
  );

create policy "Seekers can see their own applications." on applications
  for select using (auth.uid() = seeker_id);

create policy "Seekers can insert applications." on applications
  for insert with check (auth.uid() = seeker_id);


-- ---------------------------------------------------------
-- 4. MESSAGES (Simple Chat)
-- ---------------------------------------------------------
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id),
  receiver_id uuid references profiles(id),
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table messages enable row level security;

drop policy if exists "Users can see their own messages." on messages;
drop policy if exists "Users can send messages." on messages;

create policy "Users can see their own messages." on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages." on messages
  for insert with check (auth.uid() = sender_id);
