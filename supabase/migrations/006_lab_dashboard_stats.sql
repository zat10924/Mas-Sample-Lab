-- =====================================================================
-- مختبر الماس: إحصائيات لوحة التحكم بتتحسب في قاعدة البيانات
-- شغّله مرة واحدة في Supabase: SQL Editor > New query > الصق > Run
--
-- قبل كده كان المتصفح بيحمّل كل العينات وبيحسب الإحصائيات عنده، وده بيبطّأ لما العينات تكتر.
-- الدالة security invoker: سياسات الأمان (RLS) بتتطبق عادي، فمين يقدر يقرأ العينات هو بس اللي يشوف الأرقام.
-- لو ما شغلتش الملف ده، البرنامج بيكمّل بالطريقة القديمة تلقائيًا.
-- الشهور بتتحسب بتوقيت القاهرة.
-- =====================================================================

create or replace function public.lab_dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with latest as (
    -- آخر نتيجة معتمدة لكل عينة
    select distinct on (r.sample_id) r.sample_id, r.final_code
    from public.lab_sample_results r
    where r.final_code is not null
    order by r.sample_id, r.created_at desc
  ),
  samp as (
    select s.id, s.status, s.recipe_id, s.created_at, l.final_code
    from public.lab_samples s
    left join latest l on l.sample_id = s.id
  ),
  parsed as (
    select id,
           substr(final_code, 1, 1) as finish,
           substr(final_code, 2, 1) as color,
           substr(final_code, 4)    as defects
    from samp
    where final_code ~ '^[GSM][123]-(0|[PCRB]+)$'
  )
  select jsonb_build_object(
    'recipes',         (select count(*) from public.lab_recipes),
    'samples',         (select count(*) from samp),
    'planned',         (select count(*) from samp where status = 'planned'),
    'fired',           (select count(*) from samp where status = 'fired'),
    'reviewed_status', (select count(*) from samp where status = 'reviewed'),
    'reviewed',        (select count(*) from parsed),
    'clean',           (select count(*) from parsed where defects = '0'),
    'finishes', coalesce((
      select jsonb_object_agg(finish, n)
      from (select finish, count(*) as n from parsed group by finish) x
    ), '{}'::jsonb),
    'colors', coalesce((
      select jsonb_object_agg(color, n)
      from (select color, count(*) as n from parsed group by color) x
    ), '{}'::jsonb),
    'defects', coalesce((
      select jsonb_object_agg(d, n)
      from (
        select d, count(*) as n
        from parsed, regexp_split_to_table(parsed.defects, '') as d
        where d <> '0'
        group by d
      ) x
    ), '{}'::jsonb),
    'months', (
      select jsonb_agg(
               jsonb_build_object(
                 'year',  extract(year from m.month_start)::int,
                 'month', extract(month from m.month_start)::int - 1,
                 'count', (
                   select count(*) from samp
                   where date_trunc('month', samp.created_at at time zone 'Africa/Cairo') = m.month_start
                 )
               )
               order by m.month_start
             )
      from (
        select generate_series(
                 date_trunc('month', now() at time zone 'Africa/Cairo') - interval '5 months',
                 date_trunc('month', now() at time zone 'Africa/Cairo'),
                 interval '1 month'
               ) as month_start
      ) m
    ),
    'topRecipes', coalesce((
      select jsonb_agg(t)
      from (
        select coalesce(r.code, '—')              as key,
               coalesce(r.name, 'بدون تركيبة')    as label,
               count(*)                            as total,
               count(p.id) filter (where p.defects = '0') as clean
        from samp s
        left join public.lab_recipes r on r.id = s.recipe_id
        left join parsed p on p.id = s.id
        group by coalesce(r.code, '—'), coalesce(r.name, 'بدون تركيبة')
        order by count(*) desc, coalesce(r.code, '—')
        limit 5
      ) t
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.lab_dashboard_stats() from public;
grant execute on function public.lab_dashboard_stats() to authenticated;
