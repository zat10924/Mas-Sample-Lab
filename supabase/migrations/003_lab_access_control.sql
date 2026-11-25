-- =====================================================================
-- 003: تحكم كامل في صلاحيات المختبر لكل مستخدم (حتى المدراء)
-- شغّله في Supabase > SQL Editor بعد 001 و 002.
--   * المدير وصاحب المصنع عندهم وصول افتراضي (تعديل / عرض)، لكن تقدر تسحبه من أي حد
--     بوضع "بدون وصول" من شاشة الصلاحيات.
--   * أي مدير تتسحب منه الصلاحية مبقاش يشوف المختبر ولا يقدر يدير الصلاحيات.
--   * ممنوع المستخدم يغيّر صلاحيته بنفسه (عشان محدش يقفل على نفسه).
-- =====================================================================

-- السماح بالقيمة none (سحب الوصول صراحة)
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.lab_access'::regclass and contype = 'c'
  loop
    execute format('alter table public.lab_access drop constraint %I', c);
  end loop;
end $$;

alter table public.lab_access
  add constraint lab_access_level_check check (level in ('view', 'edit', 'none'));

-- مستوى الوصول: السجل الصريح في lab_access له الأولوية، وبعده الافتراضي حسب الدور
create or replace function public.lab_level()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when a.level is not null then
             case when a.level = 'none' then null else a.level end
           when p.role = 'admin' then 'edit'
           when p.role = 'owner' then 'view'
           else null
         end
  from public.profiles p
  left join public.lab_access a on a.user_id = p.id
  where p.id = auth.uid() and coalesce(p.active, true)
$$;

-- مدير المختبر = مدير في المصنع + عنده تعديل في المختبر
create or replace function public.lab_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' and coalesce(p.active, true)
       from public.profiles p where p.id = auth.uid())
    and public.lab_level() = 'edit',
    false
  )
$$;

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
           case when a.level is not null then a.level
                when p.role = 'admin' then 'edit'
                when p.role = 'owner' then 'view'
                else 'none' end
    from public.profiles p
    left join public.lab_access a on a.user_id = p.id
    where p.role is not null and coalesce(p.active, true)
    order by p.full_name;
end;
$$;

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
  if p_user = auth.uid() then
    raise exception 'مش ممكن تغيّر صلاحيتك بنفسك';
  end if;
  if p_level is null or p_level not in ('view', 'edit', 'none') then
    raise exception 'bad level';
  end if;
  insert into public.lab_access (user_id, level, granted_by)
  values (p_user, p_level, auth.uid())
  on conflict (user_id) do update
    set level = excluded.level, granted_by = auth.uid(), updated_at = now();
end;
$$;
