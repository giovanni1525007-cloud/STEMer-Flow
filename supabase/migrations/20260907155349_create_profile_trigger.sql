/*
# Create profile auto-creation trigger

When a new user signs up via Supabase Auth, a row is inserted into auth.users.
This trigger automatically creates a matching row in the profiles table,
copying the user_metadata fields (full_name, phone, grade, language) into the
profiles columns.

## 1. New Functions
- `handle_new_user()` — SECURITY DEFINER function that inserts a profiles row
  from the new auth.users row's metadata.

## 2. New Triggers
- `on_auth_user_created` — fires AFTER INSERT on auth.users, calls handle_new_user().

## 3. Security
- The function is SECURITY DEFINER so it can write to the profiles table
  even though the anon role can't normally insert arbitrary rows.
- The trigger only fires on new auth.users inserts, which only Supabase Auth
  can perform — users cannot trigger this directly.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
