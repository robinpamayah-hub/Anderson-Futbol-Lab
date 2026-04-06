-- Anderson Futbol Lab - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'parent' check (role in ('admin', 'parent')),
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TEAMS
-- ============================================
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  age_group text not null check (age_group in ('U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior')),
  season text not null default '',
  coach_name text not null default '',
  assistant_coach_name text,
  max_roster_size int not null default 20,
  created_at timestamptz not null default now()
);

-- ============================================
-- PLAYERS
-- ============================================
create table public.players (
  id uuid default uuid_generate_v4() primary key,
  parent_id uuid references public.profiles(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  age_group text not null check (age_group in ('U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior')),
  position text not null check (position in ('GK', 'DEF', 'MID', 'FWD')),
  secondary_position text check (secondary_position in ('GK', 'DEF', 'MID', 'FWD')),
  bio text not null default '',
  photo_url text,
  join_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- ASSESSMENT TEMPLATES
-- ============================================
create table public.assessment_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null check (category in ('fitness', 'technical', 'tactical')),
  unit text not null,
  higher_is_better boolean not null default true,
  position_specific boolean not null default false,
  applicable_positions text[],
  created_at timestamptz not null default now()
);

-- ============================================
-- PLAYER SCORES
-- ============================================
create table public.player_scores (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  assessment_id uuid not null references public.assessment_templates(id) on delete cascade,
  value numeric not null,
  date date not null default current_date,
  notes text not null default '',
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- GAME FEEDBACK
-- ============================================
create table public.game_feedback (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  date date not null,
  opponent text not null default '',
  result text,
  minutes_played int not null default 0,
  position_played text not null check (position_played in ('GK', 'DEF', 'MID', 'FWD')),
  rating int not null check (rating >= 1 and rating <= 10),
  strengths text not null default '',
  areas_to_improve text not null default '',
  coach_notes text not null default '',
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- FEES
-- ============================================
create table public.fees (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  description text not null,
  amount numeric not null,
  due_date date not null,
  season text not null default '',
  category text not null check (category in ('registration', 'equipment', 'tournament', 'uniform', 'training', 'other')),
  status text not null default 'outstanding' check (status in ('paid', 'partial', 'outstanding', 'overdue')),
  created_at timestamptz not null default now()
);

-- ============================================
-- PAYMENTS
-- ============================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  fee_id uuid not null references public.fees(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  amount numeric not null,
  date date not null default current_date,
  method text not null check (method in ('cash', 'check', 'card', 'transfer', 'other')),
  reference text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================
-- TRAINING SESSIONS
-- ============================================
create table public.training_sessions (
  id uuid default uuid_generate_v4() primary key,
  team_id uuid not null references public.teams(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text not null default '',
  type text not null check (type in ('training', 'game', 'tournament', 'tryout')),
  plan text not null default '',
  focus text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================
-- ATTENDANCE
-- ============================================
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(player_id, session_id)
);

-- ============================================
-- ANNOUNCEMENTS
-- ============================================
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  date date not null default current_date,
  target_team_ids uuid[] not null default '{}',
  priority text not null default 'normal' check (priority in ('normal', 'important', 'urgent')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- DEVELOPMENT GOALS
-- ============================================
create table public.development_goals (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  category text not null check (category in ('fitness', 'technical', 'tactical')),
  description text not null,
  target_date date not null,
  is_achieved boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.assessment_templates enable row level security;
alter table public.player_scores enable row level security;
alter table public.game_feedback enable row level security;
alter table public.fees enable row level security;
alter table public.payments enable row level security;
alter table public.training_sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.announcements enable row level security;
alter table public.development_goals enable row level security;

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- PROFILES policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (is_admin());
create policy "Admins can update profiles" on profiles for update using (is_admin());
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- TEAMS policies
create policy "Anyone authenticated can view teams" on teams for select using (auth.uid() is not null);
create policy "Admins can manage teams" on teams for all using (is_admin());

-- PLAYERS policies
create policy "Admins can manage players" on players for all using (is_admin());
create policy "Parents can view own children" on players for select using (parent_id = auth.uid());

-- ASSESSMENT TEMPLATES policies
create policy "Anyone authenticated can view assessments" on assessment_templates for select using (auth.uid() is not null);
create policy "Admins can manage assessments" on assessment_templates for all using (is_admin());

-- PLAYER SCORES policies
create policy "Admins can manage scores" on player_scores for all using (is_admin());
create policy "Parents can view children scores" on player_scores for select
  using (player_id in (select id from players where parent_id = auth.uid()));

-- GAME FEEDBACK policies
create policy "Admins can manage feedback" on game_feedback for all using (is_admin());
create policy "Parents can view children feedback" on game_feedback for select
  using (player_id in (select id from players where parent_id = auth.uid()));

-- FEES policies
create policy "Admins can manage fees" on fees for all using (is_admin());
create policy "Parents can view children fees" on fees for select
  using (player_id in (select id from players where parent_id = auth.uid()));

-- PAYMENTS policies
create policy "Admins can manage payments" on payments for all using (is_admin());
create policy "Parents can view children payments" on payments for select
  using (player_id in (select id from players where parent_id = auth.uid()));

-- TRAINING SESSIONS policies
create policy "Anyone authenticated can view sessions" on training_sessions for select using (auth.uid() is not null);
create policy "Admins can manage sessions" on training_sessions for all using (is_admin());

-- ATTENDANCE policies
create policy "Admins can manage attendance" on attendance for all using (is_admin());
create policy "Parents can view children attendance" on attendance for select
  using (player_id in (select id from players where parent_id = auth.uid()));

-- ANNOUNCEMENTS policies
create policy "Anyone authenticated can view announcements" on announcements for select using (auth.uid() is not null);
create policy "Admins can manage announcements" on announcements for all using (is_admin());

-- DEVELOPMENT GOALS policies
create policy "Admins can manage goals" on development_goals for all using (is_admin());
create policy "Parents can view children goals" on development_goals for select
  using (player_id in (select id from players where parent_id = auth.uid()));

-- ============================================
-- INDEXES
-- ============================================
create index idx_players_parent on players(parent_id);
create index idx_players_team on players(team_id);
create index idx_player_scores_player on player_scores(player_id);
create index idx_player_scores_date on player_scores(date);
create index idx_game_feedback_player on game_feedback(player_id);
create index idx_fees_player on fees(player_id);
create index idx_payments_fee on payments(fee_id);
create index idx_attendance_session on attendance(session_id);
create index idx_training_sessions_team on training_sessions(team_id);

-- ============================================
-- SEED: DEFAULT ASSESSMENT TEMPLATES
-- ============================================
insert into public.assessment_templates (name, category, unit, higher_is_better, position_specific, applicable_positions) values
  ('Beep Test', 'fitness', 'level', true, false, null),
  ('40m Sprint', 'fitness', 'seconds', false, false, null),
  ('5-10-5 Shuttle', 'fitness', 'seconds', false, false, null),
  ('Vertical Jump', 'fitness', 'cm', true, false, null),
  ('Yo-Yo IR1', 'fitness', 'meters', true, false, null),
  ('Passing Accuracy', 'technical', 'score/10', true, false, null),
  ('Shooting Accuracy', 'technical', 'score/10', true, true, '{FWD,MID}'),
  ('Dribbling', 'technical', 'score/10', true, false, null),
  ('First Touch', 'technical', 'score/10', true, false, null),
  ('Heading', 'technical', 'score/10', true, false, null),
  ('Distribution (GK)', 'technical', 'score/10', true, true, '{GK}'),
  ('Shot Stopping (GK)', 'technical', 'score/10', true, true, '{GK}'),
  ('1v1 Defending', 'technical', 'score/10', true, true, '{DEF}'),
  ('Positioning', 'tactical', 'score/10', true, false, null),
  ('Game Intelligence', 'tactical', 'score/10', true, false, null),
  ('Communication', 'tactical', 'score/10', true, false, null);
