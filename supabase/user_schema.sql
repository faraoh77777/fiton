-- FITON 회원 자료 저장 (2026-11-20)
-- 실행: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 Run. 여러 번 실행해도 안전합니다.
-- 만드는 것: 표 fiton_state(계정당 1줄), 비공개 사진 저장소 fiton-user(계정별 폴더), 본인만 읽고 쓰는 권한
-- 기존 표(tryon_usage, avatar_usage)와 저장소(fiton-assets)는 건드리지 않습니다.

-- 1) 계정당 1줄: 앱이 브라우저에 저장하던 내용(치수·옷장 목록·기록·설정)을 그대로 담음
create table if not exists public.fiton_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.fiton_state enable row level security;

drop policy if exists fiton_state_select_own on public.fiton_state;
drop policy if exists fiton_state_insert_own on public.fiton_state;
drop policy if exists fiton_state_update_own on public.fiton_state;
drop policy if exists fiton_state_delete_own on public.fiton_state;

create policy fiton_state_select_own on public.fiton_state
  for select to authenticated using (auth.uid() = user_id);
create policy fiton_state_insert_own on public.fiton_state
  for insert to authenticated with check (auth.uid() = user_id);
create policy fiton_state_update_own on public.fiton_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fiton_state_delete_own on public.fiton_state
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.fiton_state from anon;
grant select, insert, update, delete on public.fiton_state to authenticated;

-- 2) 비공개 사진 저장소: 경로는 <계정 id>/<사진 이름>, 파일당 최대 8MB, 그림 파일만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fiton-user', 'fiton-user', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists fiton_user_select_own on storage.objects;
drop policy if exists fiton_user_insert_own on storage.objects;
drop policy if exists fiton_user_update_own on storage.objects;
drop policy if exists fiton_user_delete_own on storage.objects;

create policy fiton_user_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'fiton-user' and (storage.foldername(name))[1] = auth.uid()::text);
create policy fiton_user_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fiton-user' and (storage.foldername(name))[1] = auth.uid()::text);
create policy fiton_user_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'fiton-user' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fiton-user' and (storage.foldername(name))[1] = auth.uid()::text);
create policy fiton_user_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'fiton-user' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) 확인: 아래 두 줄이 각각 1줄씩 나오면 성공
select 'fiton_state 표' as 확인, count(*) as 권한수 from pg_policies where schemaname = 'public' and tablename = 'fiton_state';
select 'fiton-user 저장소' as 확인, public as 공개여부 from storage.buckets where id = 'fiton-user';
