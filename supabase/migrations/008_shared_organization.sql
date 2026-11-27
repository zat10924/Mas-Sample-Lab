-- =====================================================================
-- 008: مفضّلة التركيبات + مجموعات التركيبات + العروض المحفوظة (متزامنة بين الأجهزة)
--   * lab_recipe_favorites : مفضّلة كل مستخدم (خاصة به)
--   * lab_recipe_collections : اسم مجموعة لكل تركيبة (مشتركة، التعديل لمن عنده صلاحية تعديل)
--   * lab_saved_views : فلاتر العينات المحفوظة (خاصة بكل مستخدم)
-- شغّله مرة واحدة في Supabase > SQL Editor بعد 001 إلى 007. آمن لو اتشغّل أكتر من مرة.
-- مبيلمسش أي جدول من جداول برنامج المصنع.
-- =====================================================================

create table if not exists public.lab_recipe_favorites (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipe_id  uuid not null references public.lab_recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table if not exists public.lab_recipe_collections (
  recipe_id  uuid primary key references public.lab_recipes(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  updated_by uuid default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_saved_views (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lab_saved_views_user_idx on public.lab_saved_views (user_id, created_at);

alter table public.lab_recipe_favorites   enable row level security;
alter table public.lab_recipe_collections enable row level security;
alter table public.lab_saved_views        enable row level security;

grant select, insert, update, delete on public.lab_recipe_favorites   to authenticated;
grant select, insert, update, delete on public.lab_recipe_collections to authenticated;
grant select, insert, update, delete on public.lab_saved_views        to authenticated;

-- المفضّلة: كل مستخدم يدير مفضلته بس (ويكون عنده صلاحية دخول المختبر)
drop policy if exists "lab_fav select" on public.lab_recipe_favorites;
create policy "lab_fav select" on public.lab_recipe_favorites
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.lab_can_read()));

drop policy if exists "lab_fav insert" on public.lab_recipe_favorites;
create policy "lab_fav insert" on public.lab_recipe_favorites
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.lab_can_read()));

drop policy if exists "lab_fav delete" on public.lab_recipe_favorites;
create policy "lab_fav delete" on public.lab_recipe_favorites
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- المجموعات: الكل يشوف، ومن عنده تعديل يغيّر
drop policy if exists "lab_coll select" on public.lab_recipe_collections;
create policy "lab_coll select" on public.lab_recipe_collections
  for select to authenticated using ((select public.lab_can_read()));

drop policy if exists "lab_coll insert" on public.lab_recipe_collections;
create policy "lab_coll insert" on public.lab_recipe_collections
  for insert to authenticated with check ((select public.lab_can_write()));

drop policy if exists "lab_coll update" on public.lab_recipe_collections;
create policy "lab_coll update" on public.lab_recipe_collections
  for update to authenticated
  using ((select public.lab_can_write())) with check ((select public.lab_can_write()));

drop policy if exists "lab_coll delete" on public.lab_recipe_collections;
create policy "lab_coll delete" on public.lab_recipe_collections
  for delete to authenticated using ((select public.lab_can_write()));

-- العروض المحفوظة: خاصة بكل مستخدم
drop policy if exists "lab_views select" on public.lab_saved_views;
create policy "lab_views select" on public.lab_saved_views
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.lab_can_read()));

drop policy if exists "lab_views insert" on public.lab_saved_views;
create policy "lab_views insert" on public.lab_saved_views
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.lab_can_read()));

drop policy if exists "lab_views delete" on public.lab_saved_views;
create policy "lab_views delete" on public.lab_saved_views
  for delete to authenticated
  using (user_id = (select auth.uid()));
