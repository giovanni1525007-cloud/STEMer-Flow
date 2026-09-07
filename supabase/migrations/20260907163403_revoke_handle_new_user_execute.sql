/*
# Revoke public execute on handle_new_user

The handle_new_user() function is SECURITY DEFINER and only meant to be called
by the on_auth_user_created trigger. It should not be callable via the REST API
by anon or authenticated roles.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
