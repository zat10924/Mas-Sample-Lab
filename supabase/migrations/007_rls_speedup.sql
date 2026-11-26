-- =====================================================================
-- 007: تسريع فتح التركيبات والعينات
-- المشكلة: سياسات الأمان (RLS) كانت بتنادي lab_can_read() / lab_can_write() لكل صف،
-- وكل نداء بيعمل استعلام على profiles و lab_access. مع مكونات التركيبات (مئات الصفوف) ده بيبطّأ.
-- الحل: لفّ النداء في (select ...) فيتحسب مرة واحدة للاستعلام كله.
-- شغّله مرة واحدة في Supabase > SQL Editor. آمن لو اتشغّل أكتر من مرة،
-- ومبيغيّرش أي صلاحيات ولا بيانات، بس بيعيد كتابة نص السياسات الموجودة.
-- =====================================================================
do $$
declare
  r record;
  q text;
  w text;
  stmt text;
  pat constant text := '(public\.)?(lab_(can_read|can_write|is_admin|level)\(\))';
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where (schemaname = 'public' and tablename like 'lab\_%')
       or (schemaname = 'storage' and tablename = 'objects'
           and (coalesce(qual, '') like '%lab-sample-images%' or coalesce(with_check, '') like '%lab-sample-images%'))
  loop
    q := r.qual;
    w := r.with_check;
    if q is not null and q !~* 'select' then
      q := regexp_replace(q, pat, '(select public.\2)', 'g');
    end if;
    if w is not null and w !~* 'select' then
      w := regexp_replace(w, pat, '(select public.\2)', 'g');
    end if;

    if q is distinct from r.qual or w is distinct from r.with_check then
      stmt := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
      if q is not null then stmt := stmt || ' using (' || q || ')'; end if;
      if w is not null then stmt := stmt || ' with check (' || w || ')'; end if;
      begin
        execute stmt;
        raise notice 'updated: %.% / %', r.schemaname, r.tablename, r.policyname;
      exception when others then
        raise notice 'skipped %.% / % : %', r.schemaname, r.tablename, r.policyname, sqlerrm;
      end;
    end if;
  end loop;
end $$;
