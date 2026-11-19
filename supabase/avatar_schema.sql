-- FITON avatar-make usage limit (run once in Supabase SQL Editor)
-- device = anonymous id made by the browser, '*' = global total

create table if not exists public.avatar_usage (
  device text not null,
  day    date not null default ((now() at time zone 'utc')::date),
  n      int  not null default 0,
  primary key (device, day)
);
alter table public.avatar_usage enable row level security;

create or replace function public.avatar_take(p_device text, p_dev_limit int, p_global_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  d int;
  g int;
  today date := (now() at time zone 'utc')::date;
begin
  delete from avatar_usage where day < today - 30; -- keep 30 days only (privacy.html)
  insert into avatar_usage(device, day, n) values ('*', today, 0) on conflict do nothing;
  insert into avatar_usage(device, day, n) values (p_device, today, 0) on conflict do nothing;
  select n into g from avatar_usage where device = '*' and day = today for update;
  select n into d from avatar_usage where device = p_device and day = today for update;
  if g >= p_global_limit or d >= p_dev_limit then
    return false;
  end if;
  update avatar_usage set n = n + 1 where day = today and device in ('*', p_device);
  return true;
end
$$;

create or replace function public.avatar_refund(p_device text)
returns void
language sql
security definer
set search_path = public
as $$
  update avatar_usage set n = greatest(n - 1, 0)
  where day = (now() at time zone 'utc')::date and device in ('*', p_device);
$$;

revoke all on function public.avatar_take(text, int, int) from public, anon, authenticated;
revoke all on function public.avatar_refund(text) from public, anon, authenticated;
grant execute on function public.avatar_take(text, int, int) to service_role;
grant execute on function public.avatar_refund(text) to service_role;

-- public bucket for the base body photos (read by the avatar function and by FASHN)
-- after running this, upload assets/avatar_default.jpg and assets/avatar_male.jpg into folder assets/ of this bucket
insert into storage.buckets (id, name, public) values ('fiton-assets', 'fiton-assets', true)
on conflict (id) do update set public = true;

-- check: table_ok should be 1, functions_ok should be 2 and bucket_ok should be 1
select
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'avatar_usage') as table_ok,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('avatar_take', 'avatar_refund')) as functions_ok,
  (select count(*) from storage.buckets where id = 'fiton-assets' and public) as bucket_ok;
