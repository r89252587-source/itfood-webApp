-- Run this in Supabase SQL Editor.
-- It fixes Google OAuth failures like:
-- "Database error saving new user"
--
-- Cause: a trigger on auth.users is failing while creating the user profile.
-- This replacement trigger is defensive: if profile creation fails, auth signup
-- still succeeds and the app can create/update the profile after login.

create schema if not exists public;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."userProfile" (
    id,
    email,
    full_name,
    avatar_url,
    role,
    "is_phoneVerified"
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', ''),
      ''
    ),
    'user',
    'not verified'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public."userProfile".full_name, ''), excluded.full_name),
    avatar_url = coalesce(nullif(public."userProfile".avatar_url, ''), excluded.avatar_url);

  return new;
exception
  when others then
    raise warning 'handle_new_auth_user profile insert skipped for user %. Error: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_user_profile on auth.users;
drop trigger if exists handle_new_user on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

grant usage on schema public to anon, authenticated;
grant select, insert, update on public."userProfile" to authenticated;
