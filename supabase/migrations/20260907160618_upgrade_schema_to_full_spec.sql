/*
# Upgrade STEMer Flow schema to full specification (part 1)

Adds global_subjects, user_subjects, pomodoro_settings, goals, focus_sessions,
xp_transactions, achievement_defs, user_achievements, plan_items.
Enhances profiles, study_sessions, shared_tasks, weekly_plans, user_settings.
*/

-- PROFILES: add updated_at and avatar_url
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- GLOBAL SUBJECTS
CREATE TABLE IF NOT EXISTS global_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'BookOpen',
  color text NOT NULL DEFAULT '#3b82f6',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE global_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_global_subjects" ON global_subjects;
CREATE POLICY "select_global_subjects" ON global_subjects
  FOR SELECT TO authenticated USING (true);

INSERT INTO global_subjects (name, slug, icon, color) VALUES
  ('Mathematics', 'mathematics', 'Calculator', '#3b82f6'),
  ('Mechanics', 'mechanics', 'Cog', '#f59e0b'),
  ('Physics', 'physics', 'Atom', '#8b5cf6'),
  ('Chemistry', 'chemistry', 'FlaskConical', '#10b981'),
  ('Biology', 'biology', 'Dna', '#ef4444'),
  ('Computer Science', 'computer-science', 'Laptop', '#06b6d4'),
  ('Arabic', 'arabic', 'BookOpen', '#ec4899'),
  ('English', 'english', 'Globe', '#6366f1'),
  ('Citizenship', 'citizenship', 'Users', '#14b8a6'),
  ('Religion', 'religion', 'Church', '#a855f7'),
  ('French', 'french', 'Languages', '#64748b'),
  ('German', 'german', 'Languages', '#f97316')
ON CONFLICT (slug) DO NOTHING;

-- USER_SUBJECTS
CREATE TABLE IF NOT EXISTS user_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES global_subjects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id)
);

ALTER TABLE user_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_subjects" ON user_subjects;
CREATE POLICY "select_own_user_subjects" ON user_subjects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_subjects" ON user_subjects;
CREATE POLICY "insert_own_user_subjects" ON user_subjects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_subjects" ON user_subjects;
CREATE POLICY "update_own_user_subjects" ON user_subjects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_subjects" ON user_subjects;
CREATE POLICY "delete_own_user_subjects" ON user_subjects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_subjects_user_id ON user_subjects(user_id);

-- STUDY SESSIONS: add columns
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS remaining_minutes integer;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS actual_minutes integer;

UPDATE study_sessions SET duration_minutes = duration WHERE duration_minutes IS NULL AND duration IS NOT NULL;
UPDATE study_sessions SET actual_minutes = focus_time_spent WHERE actual_minutes IS NULL AND focus_time_spent IS NOT NULL;

ALTER TABLE study_sessions ALTER COLUMN duration_minutes SET NOT NULL;
ALTER TABLE study_sessions ALTER COLUMN actual_minutes SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_study_sessions_deadline ON study_sessions(deadline);
CREATE INDEX IF NOT EXISTS idx_study_sessions_completed ON study_sessions(completed);

-- SHARED TASKS: add columns
ALTER TABLE shared_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE shared_tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE shared_tasks ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE shared_tasks ADD COLUMN IF NOT EXISTS actual_minutes integer;

UPDATE shared_tasks SET duration_minutes = duration WHERE duration_minutes IS NULL AND duration IS NOT NULL;
UPDATE shared_tasks SET actual_minutes = focus_time_spent WHERE actual_minutes IS NULL AND focus_time_spent IS NOT NULL;

ALTER TABLE shared_tasks ALTER COLUMN duration_minutes SET NOT NULL;
ALTER TABLE shared_tasks ALTER COLUMN actual_minutes SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_shared_tasks_deadline ON shared_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_shared_tasks_completed ON shared_tasks(completed);

-- POMODORO SETTINGS
CREATE TABLE IF NOT EXISTS pomodoro_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_minutes integer NOT NULL DEFAULT 25,
  short_break_minutes integer NOT NULL DEFAULT 5,
  long_break_minutes integer NOT NULL DEFAULT 15,
  cycles_before_long_break integer NOT NULL DEFAULT 4,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pomodoro_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pomodoro" ON pomodoro_settings;
CREATE POLICY "select_own_pomodoro" ON pomodoro_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pomodoro" ON pomodoro_settings;
CREATE POLICY "insert_own_pomodoro" ON pomodoro_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_pomodoro" ON pomodoro_settings;
CREATE POLICY "update_own_pomodoro" ON pomodoro_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_pomodoro" ON pomodoro_settings;
CREATE POLICY "delete_own_pomodoro" ON pomodoro_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- GOALS
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('daily_focus', 'weekly_focus', 'session_completion')),
  target_minutes integer,
  target_sessions integer,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- FOCUS SESSIONS
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  study_session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'focus' CHECK (mode IN ('focus', 'short_break', 'long_break')),
  planned_minutes integer NOT NULL DEFAULT 0,
  actual_minutes integer NOT NULL DEFAULT 0,
  subject_name text,
  session_title text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completed boolean NOT NULL DEFAULT false,
  date date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_focus_sessions" ON focus_sessions;
CREATE POLICY "select_own_focus_sessions" ON focus_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_focus_sessions" ON focus_sessions;
CREATE POLICY "insert_own_focus_sessions" ON focus_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_focus_sessions" ON focus_sessions;
CREATE POLICY "update_own_focus_sessions" ON focus_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_focus_sessions" ON focus_sessions;
CREATE POLICY "delete_own_focus_sessions" ON focus_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_date ON focus_sessions(date);

-- XP TRANSACTIONS
CREATE TABLE IF NOT EXISTS xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_xp" ON xp_transactions;
CREATE POLICY "select_own_xp" ON xp_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_xp" ON xp_transactions;
CREATE POLICY "insert_own_xp" ON xp_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_xp" ON xp_transactions;
CREATE POLICY "update_own_xp" ON xp_transactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_xp" ON xp_transactions;
CREATE POLICY "delete_own_xp" ON xp_transactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);

-- ACHIEVEMENT DEFS
CREATE TABLE IF NOT EXISTS achievement_defs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'Award',
  xp_reward integer NOT NULL DEFAULT 0,
  threshold integer NOT NULL DEFAULT 1
);

ALTER TABLE achievement_defs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_achievement_defs" ON achievement_defs;
CREATE POLICY "select_achievement_defs" ON achievement_defs
  FOR SELECT TO authenticated USING (true);

INSERT INTO achievement_defs (slug, name, description, icon, xp_reward, threshold) VALUES
  ('first_step', 'First Step', 'Complete your first session.', 'Footprints', 20, 1),
  ('focused', 'Focused', 'Study for 5 hours total.', 'Brain', 50, 300),
  ('consistent', 'Consistent', 'Maintain a 7-day streak.', 'Flame', 100, 7),
  ('unstoppable', 'Unstoppable', 'Maintain a 30-day streak.', 'Zap', 200, 30),
  ('stem_machine', 'STEM Machine', 'Complete 100 sessions.', 'Cpu', 150, 100),
  ('scholar', 'Scholar', 'Study for 50 hours total.', 'GraduationCap', 300, 3000),
  ('task_master', 'Task Master', 'Complete 50 shared tasks.', 'CheckSquare', 100, 50),
  ('early_bird', 'Early Bird', 'Complete 10 morning sessions.', 'Sunrise', 80, 10)
ON CONFLICT (slug) DO NOTHING;

-- USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievement_defs(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_achievements" ON user_achievements;
CREATE POLICY "select_own_user_achievements" ON user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_achievements" ON user_achievements;
CREATE POLICY "insert_own_user_achievements" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_achievements" ON user_achievements;
CREATE POLICY "update_own_user_achievements" ON user_achievements
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_achievements" ON user_achievements;
CREATE POLICY "delete_own_user_achievements" ON user_achievements
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- PLAN ITEMS
CREATE TABLE IF NOT EXISTS plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE,
  task_id uuid REFERENCES shared_tasks(id) ON DELETE CASCADE,
  planned_minutes integer NOT NULL,
  position integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plan_items" ON plan_items;
CREATE POLICY "select_own_plan_items" ON plan_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plan_items" ON plan_items;
CREATE POLICY "insert_own_plan_items" ON plan_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plan_items" ON plan_items;
CREATE POLICY "update_own_plan_items" ON plan_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plan_items" ON plan_items;
CREATE POLICY "delete_own_plan_items" ON plan_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_plan_items_user_id ON plan_items(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_date ON plan_items(date);

-- WEEKLY PLANS: add end_date
ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS end_date date;

-- NOTIFICATIONS: add index on read
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- USER_SETTINGS: add notification preference columns
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS session_reminders boolean DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS goal_reminders boolean DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS streak_reminders boolean DEFAULT true;
