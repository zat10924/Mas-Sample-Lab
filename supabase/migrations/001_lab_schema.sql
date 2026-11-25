-- =====================================================================
-- مختبر الماس (MAS Sample Lab) - الجداول + الأمان
-- شغّله مرة واحدة في Supabase: SQL Editor > New query > الصق > Run
--
-- مهم: قاعدة البيانات مشتركة مع برنامج المصنع، فالملف ده:
--   * لا يعمل جدول profiles ولا trigger على auth.users ولا أي دالة بأسماء المصنع.
--   * كل الجداول والدوال ببادئة lab_ عشان ما تتلخبطش مع جداول المصنع.
--   * يستخدم حسابات المصنع وأدواره الموجودة (profiles.role / active) كما هي.
--
-- من يدخل المختبر؟
--   admin (مدير)         = تعديل كامل + يدير الصلاحيات
--   owner (صاحب المصنع)  = عرض فقط
--   باقي الأدوار          = بالصلاحية اللي يمنحها المدير من صفحة "الصلاحيات" في المختبر
--                          (view = عرض فقط، edit = إضافة وتعديل)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) جدول صلاحيات المختبر (لغير المدير وصاحب المصنع)
-- ---------------------------------------------------------------------
create table if not exists public.lab_access (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  level       text not null check (level in ('view', 'edit')),
  granted_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2) دوال الصلاحيات (security definer = تقرأ profiles بدون ما تكشفه)
-- ---------------------------------------------------------------------
create or replace function public.lab_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and coalesce(p.active, true)
  )
$$;

-- مستوى الوصول للمستخدم الحالي: 'edit' أو 'view' أو null (ممنوع)
create or replace function public.lab_level()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when p.role = 'admin' then 'edit'
           when p.role = 'owner' then 'view'
           else (select a.level from public.lab_access a where a.user_id = p.id)
         end
  from public.profiles p
  where p.id = auth.uid() and coalesce(p.active, true)
$$;

create or replace function public.lab_can_read()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.lab_level() in ('view', 'edit'), false)
$$;

create or replace function public.lab_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.lab_level() = 'edit', false)
$$;

-- بيانات المستخدم الحالي للتطبيق: الاسم والدور ومستوى الوصول
create or replace function public.lab_me()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'name', coalesce(p.full_name, ''),
    'role', p.role,
    'level', public.lab_level()
  )
  from public.profiles p
  where p.id = auth.uid() and coalesce(p.active, true)
$$;

-- قائمة المستخدمين ومستوى وصولهم (للمدير فقط)
create or replace function public.lab_list_users()
returns table (id uuid, full_name text, role text, level text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.lab_is_admin() then
    raise exception 'not allowed';
  end if;
  return query
    select p.id,
           coalesce(p.full_name, ''),
           p.role,
           case when p.role = 'admin' then 'edit'
                when p.role = 'owner' then 'view'
                else a.level end
    from public.profiles p
    left join public.lab_access a on a.user_id = p.id
    where p.role is not null and coalesce(p.active, true)
    order by p.full_name;
end;
$$;

-- منح/سحب صلاحية المختبر (للمدير فقط). p_level = 'view' | 'edit' | 'none'
create or replace function public.lab_set_access(p_user uuid, p_level text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.lab_is_admin() then
    raise exception 'not allowed';
  end if;
  if p_level is null or p_level = 'none' then
    delete from public.lab_access where user_id = p_user;
  elsif p_level in ('view', 'edit') then
    insert into public.lab_access (user_id, level, granted_by)
    values (p_user, p_level, auth.uid())
    on conflict (user_id) do update
      set level = excluded.level, granted_by = auth.uid(), updated_at = now();
  else
    raise exception 'bad level';
  end if;
end;
$$;

create or replace function public.lab_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) التركيبات
--    basis = per_kg   : الكمية بالجرام لكل 1 كجم جليز شفاف (معيار العينة)
--    basis = percent  : نسبة مئوية من الجليز
--    batch_base_kg    : وزن الجليز الشفاف في الخلطة الكبيرة (لو موجودة)
--    batch_grams      : كمية المكوّن في الخلطة الكبيرة (لو موجودة)
-- ---------------------------------------------------------------------
create table if not exists public.lab_recipes (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null,
  type           text not null
                 check (type in ('glaze_color', 'matte', 'white', 'base', 'decoration', 'body')),
  basis          text not null default 'per_kg'
                 check (basis in ('per_kg', 'percent')),
  batch_base_kg  numeric check (batch_base_kg is null or batch_base_kg > 0),
  density        numeric check (density is null or density > 0),
  notes          text,
  is_active      boolean not null default true,
  created_by     uuid references auth.users(id) default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists lab_recipes_set_updated_at on public.lab_recipes;
create trigger lab_recipes_set_updated_at
  before update on public.lab_recipes
  for each row execute function public.lab_set_updated_at();

create table if not exists public.lab_recipe_ingredients (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid not null references public.lab_recipes(id) on delete cascade,
  material     text not null,
  amount       numeric not null check (amount >= 0),
  batch_grams  numeric check (batch_grams is null or batch_grams >= 0),
  sort_order   int not null default 0
);

create index if not exists lab_recipe_ingredients_recipe_idx
  on public.lab_recipe_ingredients (recipe_id, sort_order);

-- ---------------------------------------------------------------------
-- 4) العينات وكود العينة التلقائي MAS-2026-0001
-- ---------------------------------------------------------------------
create table if not exists public.lab_sample_counters (
  year         int primary key,
  last_number  int not null default 0
);

create or replace function public.lab_next_sample_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from now())::int;
  n int;
begin
  insert into public.lab_sample_counters (year, last_number)
  values (y, 1)
  on conflict (year) do update
    set last_number = public.lab_sample_counters.last_number + 1
  returning last_number into n;

  return 'MAS-' || y || '-' || lpad(n::text, 4, '0');
end;
$$;

create table if not exists public.lab_samples (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique default public.lab_next_sample_code(),
  recipe_id           uuid references public.lab_recipes(id) on delete restrict,
  body_type           text,
  batch_kg            numeric not null default 1 check (batch_kg > 0),
  firing_temp         int,
  firing_date         date,
  application_method  text,
  status              text not null default 'planned'
                      check (status in ('planned', 'fired', 'reviewed')),
  notes               text,
  created_by          uuid references auth.users(id) default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists lab_samples_created_idx on public.lab_samples (created_at desc);
create index if not exists lab_samples_recipe_idx on public.lab_samples (recipe_id);

drop trigger if exists lab_samples_set_updated_at on public.lab_samples;
create trigger lab_samples_set_updated_at
  before update on public.lab_samples
  for each row execute function public.lab_set_updated_at();

-- ---------------------------------------------------------------------
-- 5) نتائج العينة (صورة بعد الحرق + تحليل الذكاء الاصطناعي + اعتمادك)
--    finish: G لامع / S نصف مط / M مط
--    color_match: 1 مطابق / 2 قريب / 3 بعيد
--    defects: P pinholes / C crawling / R crazing / B blistering
--    final_code مثال: G1-0  أو  M2-PC
-- ---------------------------------------------------------------------
create table if not exists public.lab_sample_results (
  id                 uuid primary key default gen_random_uuid(),
  sample_id          uuid not null references public.lab_samples(id) on delete cascade,
  image_path         text not null,
  ai_analysis        jsonb,
  ai_suggested_code  text,
  finish             text check (finish in ('G', 'S', 'M')),
  color_match        int check (color_match in (1, 2, 3)),
  defects            text[] not null default '{}',
  final_code         text,
  reviewer_notes     text,
  reviewed_by        uuid references auth.users(id),
  reviewed_at        timestamptz,
  created_by         uuid references auth.users(id) default auth.uid(),
  created_at         timestamptz not null default now()
);

create index if not exists lab_sample_results_sample_idx
  on public.lab_sample_results (sample_id, created_at desc);

-- ---------------------------------------------------------------------
-- 6) صلاحيات تنفيذ الدوال: المستخدمون المسجلون فقط (مش الزوار)
-- ---------------------------------------------------------------------
revoke all on function public.lab_is_admin()               from public;
revoke all on function public.lab_level()                  from public;
revoke all on function public.lab_can_read()               from public;
revoke all on function public.lab_can_write()              from public;
revoke all on function public.lab_me()                     from public;
revoke all on function public.lab_list_users()             from public;
revoke all on function public.lab_set_access(uuid, text)   from public;
revoke all on function public.lab_next_sample_code()       from public;

grant execute on function public.lab_is_admin()               to authenticated;
grant execute on function public.lab_level()                  to authenticated;
grant execute on function public.lab_can_read()               to authenticated;
grant execute on function public.lab_can_write()              to authenticated;
grant execute on function public.lab_me()                     to authenticated;
grant execute on function public.lab_list_users()             to authenticated;
grant execute on function public.lab_set_access(uuid, text)   to authenticated;
grant execute on function public.lab_next_sample_code()       to authenticated;

-- ---------------------------------------------------------------------
-- 7) RLS: كل الجداول مقفولة افتراضيًا، والسياسات تفتح بحسب مستوى الوصول
-- ---------------------------------------------------------------------
alter table public.lab_access             enable row level security;
alter table public.lab_recipes            enable row level security;
alter table public.lab_recipe_ingredients enable row level security;
alter table public.lab_sample_counters    enable row level security;
alter table public.lab_samples            enable row level security;
alter table public.lab_sample_results     enable row level security;

-- lab_access: المستخدم يشوف صفه والمدير يشوف الكل. التعديل بس عن طريق lab_set_access
drop policy if exists "lab_access read" on public.lab_access;
create policy "lab_access read" on public.lab_access
  for select to authenticated
  using (user_id = auth.uid() or public.lab_is_admin());

-- lab_sample_counters: بدون سياسات = لا أحد يصل إليه مباشرة (الدالة security definer فقط)

-- lab_recipes
drop policy if exists "lab_recipes read" on public.lab_recipes;
create policy "lab_recipes read" on public.lab_recipes
  for select to authenticated using (public.lab_can_read());

drop policy if exists "lab_recipes insert" on public.lab_recipes;
create policy "lab_recipes insert" on public.lab_recipes
  for insert to authenticated with check (public.lab_can_write());

drop policy if exists "lab_recipes update" on public.lab_recipes;
create policy "lab_recipes update" on public.lab_recipes
  for update to authenticated
  using (public.lab_can_write()) with check (public.lab_can_write());

drop policy if exists "lab_recipes delete" on public.lab_recipes;
create policy "lab_recipes delete" on public.lab_recipes
  for delete to authenticated using (public.lab_is_admin());

-- lab_recipe_ingredients
drop policy if exists "lab_ingredients read" on public.lab_recipe_ingredients;
create policy "lab_ingredients read" on public.lab_recipe_ingredients
  for select to authenticated using (public.lab_can_read());

drop policy if exists "lab_ingredients insert" on public.lab_recipe_ingredients;
create policy "lab_ingredients insert" on public.lab_recipe_ingredients
  for insert to authenticated with check (public.lab_can_write());

drop policy if exists "lab_ingredients update" on public.lab_recipe_ingredients;
create policy "lab_ingredients update" on public.lab_recipe_ingredients
  for update to authenticated
  using (public.lab_can_write()) with check (public.lab_can_write());

drop policy if exists "lab_ingredients delete" on public.lab_recipe_ingredients;
create policy "lab_ingredients delete" on public.lab_recipe_ingredients
  for delete to authenticated using (public.lab_can_write());

-- lab_samples
drop policy if exists "lab_samples read" on public.lab_samples;
create policy "lab_samples read" on public.lab_samples
  for select to authenticated using (public.lab_can_read());

drop policy if exists "lab_samples insert" on public.lab_samples;
create policy "lab_samples insert" on public.lab_samples
  for insert to authenticated with check (public.lab_can_write());

drop policy if exists "lab_samples update" on public.lab_samples;
create policy "lab_samples update" on public.lab_samples
  for update to authenticated
  using (public.lab_can_write()) with check (public.lab_can_write());

drop policy if exists "lab_samples delete" on public.lab_samples;
create policy "lab_samples delete" on public.lab_samples
  for delete to authenticated using (public.lab_can_write());

-- lab_sample_results
drop policy if exists "lab_results read" on public.lab_sample_results;
create policy "lab_results read" on public.lab_sample_results
  for select to authenticated using (public.lab_can_read());

drop policy if exists "lab_results insert" on public.lab_sample_results;
create policy "lab_results insert" on public.lab_sample_results
  for insert to authenticated with check (public.lab_can_write());

drop policy if exists "lab_results update" on public.lab_sample_results;
create policy "lab_results update" on public.lab_sample_results
  for update to authenticated
  using (public.lab_can_write()) with check (public.lab_can_write());

drop policy if exists "lab_results delete" on public.lab_sample_results;
create policy "lab_results delete" on public.lab_sample_results
  for delete to authenticated using (public.lab_can_write());

-- ---------------------------------------------------------------------
-- 8) تخزين الصور: Bucket خاص (غير عام) + سياسات
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lab-sample-images',
  'lab-sample-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "lab_images read" on storage.objects;
create policy "lab_images read" on storage.objects
  for select to authenticated
  using (bucket_id = 'lab-sample-images' and public.lab_can_read());

drop policy if exists "lab_images insert" on storage.objects;
create policy "lab_images insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lab-sample-images' and public.lab_can_write());

drop policy if exists "lab_images delete" on storage.objects;
create policy "lab_images delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lab-sample-images' and public.lab_can_write());
