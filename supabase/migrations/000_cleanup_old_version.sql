-- =====================================================================
-- تنظيف النسخة القديمة من المختبر - شغّله فقط لو كنت شغّلت الملف القديم
-- "001_schema.sql" (اللي كان بيعمل جدول profiles وtrigger جديد على auth.users).
-- لو ما شغّلتهوش قبل كده: تجاهل الملف ده وروح على 001_lab_schema.sql مباشرة.
--
-- الملف آمن: كل عنصر بيتحذف بس لو فيه علامة مميزة إنه من النسخة القديمة،
-- وأي حاجة تخص برنامج المصنع (جداول، دوال، حسابات) ما بيلمسها أبدًا.
-- الترتيب مهم: السياسات الأول، بعدين الجداول، وآخرًا الدوال اللي كانت بتستخدمها.
-- =====================================================================

-- 1) سياسات القديم اللي اتضافت على profiles وعلى التخزين (بأسمائها المحددة فقط)
drop policy if exists "profiles read own or admin" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
drop policy if exists "sample images read" on storage.objects;
drop policy if exists "sample images insert" on storage.objects;
drop policy if exists "sample images delete" on storage.objects;

do $$
declare
  def text;
begin
  -- 2) الـ trigger القديم على auth.users (كان بيدّي أول حساب دور admin والباقي pending)
  if exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgname = 'on_auth_user_created'
      and not t.tgisinternal
      and p.proname = 'handle_new_user'
      and pg_get_functiondef(p.oid) like '%''pending''%'
  ) then
    drop trigger on_auth_user_created on auth.users;
    raise notice 'تم حذف trigger on_auth_user_created القديم';
  end if;

  for def in
    select pg_get_functiondef(p.oid)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  loop
    if def like '%''pending''%' then
      drop function public.handle_new_user();
      raise notice 'تم حذف handle_new_user القديمة';
    end if;
  end loop;

  -- 3) جداول النسخة القديمة (بنتأكد إنها بتاعتنا من عمود basis في recipes)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'recipes' and column_name = 'basis'
  ) then
    drop table if exists public.sample_results cascade;
    drop table if exists public.samples cascade;
    drop table if exists public.sample_counters cascade;
    drop table if exists public.recipe_ingredients cascade;
    drop table if exists public.recipes cascade;
    raise notice 'تم حذف جداول المختبر القديمة';
  end if;

  -- 4) دوال النسخة القديمة (بنتأكد من محتوى كل دالة قبل الحذف)
  begin
    select pg_get_functiondef('public.next_sample_code()'::regprocedure) into def;
    if def like '%MAS-%' then
      drop function public.next_sample_code();
      raise notice 'تم حذف next_sample_code القديمة';
    end if;
  exception when others then
    raise notice 'next_sample_code: تخطّي (%)', sqlerrm;
  end;

  begin
    select pg_get_functiondef('public.app_role()'::regprocedure) into def;
    if def like '%select role from public.profiles where id = auth.uid()%' then
      drop function public.can_read();
      drop function public.can_write();
      drop function public.is_admin();
      drop function public.app_role();
      raise notice 'تم حذف دوال الصلاحيات القديمة';
    end if;
  exception when others then
    raise notice 'دوال الصلاحيات القديمة: تخطّي (%)', sqlerrm;
  end;

  begin
    select pg_get_functiondef('public.set_updated_at()'::regprocedure) into def;
    if def like '%new.updated_at = now()%' then
      drop function public.set_updated_at();
      raise notice 'تم حذف set_updated_at القديمة';
    end if;
  exception when others then
    raise notice 'set_updated_at: تخطّي لأن فيه جداول بتستخدمها (%)', sqlerrm;
  end;
end $$;

-- ملحوظة: الـ Bucket القديم "sample-images" لو كان اتعمل هيفضل فاضي وملوش أي ضرر،
-- وتقدر تمسحه من Supabase > Storage لو حبيت.
