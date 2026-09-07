# STEMer Flow

**Plan. Focus. Achieve.**

A complete study planning and productivity app for STEM students. Track subjects, plan study sessions, use the Pomodoro timer, monitor analytics, earn XP, and unlock achievements.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Auth + RLS)

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Copy `.env.example` as a starting point. The app uses the publishable (anon) key only — never the service role key.

## Supabase Setup

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run Database Migrations

The migration files are in `supabase/migrations/`. Apply them through the Supabase MCP tools or paste the SQL into the Supabase SQL Editor.

The migrations create:
- `profiles` — user profile data (auto-created on signup via trigger)
- `global_subjects` — catalog of 12 standard subjects
- `user_subjects` — maps users to their selected subjects
- `study_sessions` — study sessions with priority, deadline, splitting
- `shared_tasks` — tasks with priority and deadline
- `weekly_plans` — generated plans stored as JSONB days
- `plan_items` — individual items within plans
- `pomodoro_settings` — per-user timer configuration
- `focus_sessions` — focus history with mode, planned/actual minutes
- `goals` — daily/weekly/session completion goals
- `user_stats` — XP, level, streaks, focus totals
- `xp_transactions` — auditable XP history
- `achievement_defs` — 8 achievement definitions (global)
- `user_achievements` — unlocked achievements per user
- `notifications` — in-app notifications
- `user_settings` — theme, goals, notification preferences

### 3. Authentication

The app uses Supabase Auth with email/password. Phone numbers are converted to pseudo-emails (`+1234567890@stemerflow.app`) to keep the phone-based UX while using Supabase's email auth.

Email confirmation is OFF by default — no manual verification needed.

### 4. Row Level Security

Every user-owned table has RLS enabled with 4 policies (SELECT, INSERT, UPDATE, DELETE), all scoped via `auth.uid() = user_id`. Users can only access their own data.

Global tables (`global_subjects`, `achievement_defs`) are read-only for authenticated users.

## Deployment

### Vercel

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Vercel auto-detects Vite.

### Supabase

The Supabase project is the backend. Ensure migrations are applied and RLS is active.

## Features

- **Authentication**: Phone + password sign up/sign in via Supabase Auth
- **Onboarding**: Subject selection, study goals, planning period
- **Dashboard**: Real stats — streak, XP, level, today's focus, upcoming sessions
- **Sessions**: Create, edit, complete study sessions per subject
- **Shared Tasks**: Cross-subject task management
- **Smart Planner**: Auto-balances workload across days based on priority and deadlines
- **Weekly Plan**: Drag-and-drop plan items across days
- **Focus Mode**: Pomodoro timer with configurable focus/break/cycles
- **Analytics**: Focus charts, subject distribution, completion rates from real data
- **Achievements**: 8 unlockable achievements with XP rewards
- **Notifications**: In-app notifications for sessions, deadlines, goals, streaks, achievements
- **Settings**: Profile, theme, Pomodoro config, study preferences
- **Responsive**: Works on mobile, tablet, and desktop
- **Dark/Light/System themes**

## Troubleshooting

**App shows blank screen**: Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`.

**Can't sign up**: Ensure the profile creation trigger is applied. Check Supabase Auth settings allow email signups.

**Data not persisting**: Verify RLS policies are applied. Check browser console for Supabase errors.

**Theme resets on refresh**: Theme caches in localStorage and syncs to `user_settings` table when logged in.
