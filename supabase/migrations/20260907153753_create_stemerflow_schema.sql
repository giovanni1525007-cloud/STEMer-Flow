/*
# Create STEMer Flow database schema

This migration creates the complete database for the STEMer Flow study planner app.
The app currently uses localStorage with a custom phone/password auth system.
This schema mirrors that data model so it can persist to Supabase instead.

## 1. New Tables

### profiles
- `id` (uuid, primary key — matches auth.users.id)
- `full_name` (text, not null)
- `phone` (text, unique, not null)
- `password_hash` (text — stores the hashed password from the existing auth system)
- `grade` (text, not null — 'Grade 10' | 'Grade 11' | 'Grade 12')
- `language` (text, not null — 'French' | 'German')
- `onboarded` (boolean, default false)
- `created_at` (timestamptz, default now())

### subjects
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
- `name` (text, not null)
- `icon` (text, not null)
- `color` (text, not null)
- `total_sessions` (integer, default 0)
- `created_at` (timestamptz, default now())

### study_sessions
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
- `subject_id` (text, not null)
- `subject_name` (text, not null)
- `title` (text, not null)
- `duration` (integer, not null — minutes)
- `priority` (text, not null — 'low' | 'medium' | 'high')
- `deadline` (date, nullable)
- `notes` (text, default '')
- `allow_splitting` (boolean, default false)
- `completed` (boolean, default false)
- `completed_at` (timestamptz, nullable)
- `scheduled_date` (date, nullable)
- `focus_time_spent` (integer, default 0 — minutes actually focused)
- `created_at` (timestamptz, default now())

### shared_tasks
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
- `title` (text, not null)
- `duration` (integer, not null — minutes)
- `priority` (text, not null)
- `deadline` (date, nullable)
- `notes` (text, default '')
- `completed` (boolean, default false)
- `completed_at` (timestamptz, nullable)
- `scheduled_date` (date, nullable)
- `focus_time_spent` (integer, default 0)
- `created_at` (timestamptz, default now())

### weekly_plans
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
- `start_date` (date, not null)
- `days` (jsonb, not null — array of PlanDay objects)
- `created_at` (timestamptz, default now())

### focus_history
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
- `date` (date, not null)
- `subject_name` (text, not null)
- `session_title` (text, not null)
- `duration` (integer, not null — minutes focused)
- `completed_at` (timestamptz, not null)

### user_settings
- `id` (uuid, primary key — defaults to the user's auth id)
- `user_id` (uuid, unique, FK → profiles, ON DELETE CASCADE)
- `pomodoro_settings` (jsonb — focus/break/longBreak/after/cycles config)
- `goals` (jsonb — dailyFocusMinutes, weeklyFocusMinutes, sessionCompletionGoal)
- `theme` (text, default 'dark')
- `updated_at` (timestamptz, default now())

### user_stats
- `id` (uuid, primary key)
- `user_id` (uuid, unique, FK → profiles, ON DELETE CASCADE)
- `total_focus_minutes` (integer, default 0)
- `total_sessions_completed` (integer, default 0)
- `total_tasks_completed` (integer, default 0)
- `current_streak` (integer, default 0)
- `longest_streak` (integer, default 0)
- `xp` (integer, default 0)
- `level` (integer, default 1)
- `last_study_date` (date, nullable)
- `focus_by_day` (jsonb, default '{}' — date → minutes)
- `focus_by_subject` (jsonb, default '{}' — subject → minutes)
- `sessions_by_day` (jsonb, default '{}' — date → count)

### achievements
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
- `achievement_id` (text, not null — matches ACHIEVEMENT_DEFS id)
- `unlocked` (boolean, default false)
- `unlocked_at` (timestamptz, nullable)
- `progress` (integer, default 0)
- `current_value` (integer, default 0)
- Unique constraint on (user_id, achievement_id)

### notifications
- `id` (uuid, primary key)
- `user_id` (uuid, FK → profiles, ON DELETE CASCADE)
- `type` (text, not null — 'session' | 'deadline' | 'goal' | 'streak' | 'achievement')
- `title` (text, not null)
- `message` (text, not null)
- `read` (boolean, default false)
- `created_at` (timestamptz, default now())

## 2. Security

- RLS enabled on ALL tables.
- All tables are owner-scoped: each authenticated user can only CRUD their own rows.
- `user_id` columns default to `auth.uid()` so inserts that omit user_id still satisfy RLS.
- Four separate policies per table (SELECT, INSERT, UPDATE, DELETE).
- `profiles` table uses `id = auth.uid()` for ownership (id matches the auth user).

## 3. Indexes

- `idx_study_sessions_user_id` on study_sessions(user_id)
- `idx_shared_tasks_user_id` on shared_tasks(user_id)
- `idx_focus_history_user_id` on focus_history(user_id)
- `idx_notifications_user_id` on notifications(user_id)
- `idx_subjects_user_id` on subjects(user_id)
- `idx_weekly_plans_user_id` on weekly_plans(user_id)
- `idx_achievements_user_id` on achievements(user_id)

## 4. Important Notes

1. The `profiles` table stores a `password_hash` for backward compatibility with the existing
   phone/password auth system. If the app migrates to Supabase Auth later, this column can be dropped.
2. JSONB columns (days, pomodoro_settings, goals, focus_by_day, focus_by_subject, sessions_by_day)
   store structured data that doesn't warrant separate tables.
3. `subject_id` on study_sessions is text (not a FK to subjects) because sessions can reference
   grade-default subjects that may not have a row in the subjects table.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  grade text NOT NULL,
  language text NOT NULL,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  total_sessions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subjects" ON subjects;
CREATE POLICY "select_own_subjects" ON subjects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subjects" ON subjects;
CREATE POLICY "insert_own_subjects" ON subjects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subjects" ON subjects;
CREATE POLICY "update_own_subjects" ON subjects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subjects" ON subjects;
CREATE POLICY "delete_own_subjects" ON subjects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id text NOT NULL,
  subject_name text NOT NULL,
  title text NOT NULL,
  duration integer NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  deadline date,
  notes text NOT NULL DEFAULT '',
  allow_splitting boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  scheduled_date date,
  focus_time_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON study_sessions;
CREATE POLICY "select_own_sessions" ON study_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON study_sessions;
CREATE POLICY "insert_own_sessions" ON study_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON study_sessions;
CREATE POLICY "update_own_sessions" ON study_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON study_sessions;
CREATE POLICY "delete_own_sessions" ON study_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);

-- Shared tasks table
CREATE TABLE IF NOT EXISTS shared_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration integer NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  deadline date,
  notes text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  scheduled_date date,
  focus_time_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shared_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON shared_tasks;
CREATE POLICY "select_own_tasks" ON shared_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON shared_tasks;
CREATE POLICY "insert_own_tasks" ON shared_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON shared_tasks;
CREATE POLICY "update_own_tasks" ON shared_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON shared_tasks;
CREATE POLICY "delete_own_tasks" ON shared_tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shared_tasks_user_id ON shared_tasks(user_id);

-- Weekly plans table
CREATE TABLE IF NOT EXISTS weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  days jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plans" ON weekly_plans;
CREATE POLICY "select_own_plans" ON weekly_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plans" ON weekly_plans;
CREATE POLICY "insert_own_plans" ON weekly_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plans" ON weekly_plans;
CREATE POLICY "update_own_plans" ON weekly_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plans" ON weekly_plans;
CREATE POLICY "delete_own_plans" ON weekly_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON weekly_plans(user_id);

-- Focus history table
CREATE TABLE IF NOT EXISTS focus_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  subject_name text NOT NULL,
  session_title text NOT NULL,
  duration integer NOT NULL,
  completed_at timestamptz NOT NULL
);

ALTER TABLE focus_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_focus" ON focus_history;
CREATE POLICY "select_own_focus" ON focus_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_focus" ON focus_history;
CREATE POLICY "insert_own_focus" ON focus_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_focus" ON focus_history;
CREATE POLICY "update_own_focus" ON focus_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_focus" ON focus_history;
CREATE POLICY "delete_own_focus" ON focus_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_focus_history_user_id ON focus_history(user_id);

-- User settings table (pomodoro, goals, theme)
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  pomodoro_settings jsonb NOT NULL DEFAULT '{"focusDuration": 25, "breakDuration": 5, "longBreakDuration": 15, "longBreakAfter": 4, "totalCycles": 4}',
  goals jsonb NOT NULL DEFAULT '{"dailyFocusMinutes": 120, "weeklyFocusMinutes": 600, "sessionCompletionGoal": 10}',
  theme text NOT NULL DEFAULT 'dark',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  total_focus_minutes integer NOT NULL DEFAULT 0,
  total_sessions_completed integer NOT NULL DEFAULT 0,
  total_tasks_completed integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  last_study_date date,
  focus_by_day jsonb NOT NULL DEFAULT '{}',
  focus_by_subject jsonb NOT NULL DEFAULT '{}',
  sessions_by_day jsonb NOT NULL DEFAULT '{}'
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_stats" ON user_stats;
CREATE POLICY "select_own_stats" ON user_stats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_stats" ON user_stats;
CREATE POLICY "insert_own_stats" ON user_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_stats" ON user_stats;
CREATE POLICY "update_own_stats" ON user_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_stats" ON user_stats;
CREATE POLICY "delete_own_stats" ON user_stats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  progress integer NOT NULL DEFAULT 0,
  current_value integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_achievements" ON achievements;
CREATE POLICY "select_own_achievements" ON achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_achievements" ON achievements;
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_achievements" ON achievements;
CREATE POLICY "update_own_achievements" ON achievements FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_achievements" ON achievements;
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);