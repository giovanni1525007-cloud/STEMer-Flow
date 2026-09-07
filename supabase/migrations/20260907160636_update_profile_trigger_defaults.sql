/*
# Update profile creation trigger to seed default rows

When a new user signs up, the handle_new_user trigger creates a profiles row.
This updated version also creates:
1. Default pomodoro_settings row (25/5/15/4)
2. Default user_stats row (0 XP, level 1)
3. Default user_settings row (dark theme, default goals)

This prevents race conditions where the app tries to read settings that don't
exist yet after signup.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone, password_hash, grade, language, onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'supabase-auth',
    COALESCE(NEW.raw_user_meta_data->>'grade', 'Grade 10'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'French'),
    false
  );

  -- Create default pomodoro settings
  INSERT INTO public.pomodoro_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default user stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger already exists, just replace the function body
-- The trigger on_auth_user_created calls handle_new_user()
