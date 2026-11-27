-- =====================================================================
-- 009 — قاعدة المعرفة (الموسوعة + الخبرات المعتمدة) — إضافة فقط
-- لا تعدّل ولا تحذف أي جدول أو سياسة قديمة. كل الأسماء بادئتها lab_kb_
-- تعتمد على دوال الصلاحيات الموجودة: lab_can_read() / lab_can_write() / lab_is_admin()
-- =====================================================================

begin;

-- ---------- 0) دالة التطبيع العربي/الإنجليزي (للبحث) ----------
create or replace function public.lab_kb_norm(t text)
returns text language sql immutable parallel safe as $$
  select btrim(regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          translate(lower(coalesce(t, '')), 'أإآٱىةـ', 'اااايه'),   -- توحيد الألف والياء والتاء المربوطة وحذف التطويل
          '[\u064B-\u065F\u0670]', '', 'g'),                        -- حذف التشكيل
        '[^a-z0-9\u0600-\u06FF]+', ' ', 'g'),                       -- أي رمز -> مسافة
      '(^| )ال([^ ]{2})', '\1\2', 'g'),                             -- حذف "ال" التعريف من أول الكلمة
    ' +', ' ', 'g'));
$$;

-- ---------- 1) الأبواب ----------
create table if not exists public.lab_kb_categories (
  id         smallint primary key,
  slug       text not null unique,
  name_ar    text not null,
  name_en    text,
  sort_order int not null
);

-- ---------- 2) الوثائق والفصول والأقسام والمقاطع ----------
create table if not exists public.lab_kb_documents (
  id          uuid primary key default gen_random_uuid(),
  doc_key     text not null unique,            -- vol1 / vol2 / vol3 / (إصدارات مستقبلية)
  title       text not null,
  edition     text not null,
  volume      int,
  file_name   text not null,
  file_sha256 text,
  language    text not null default 'ar',
  imported_at timestamptz not null default now()
);

create table if not exists public.lab_kb_chapters (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.lab_kb_documents(id) on delete restrict,
  chapter_key text not null,                   -- ch-19 أو x-<hash> للمقدمات والملاحق
  chapter_no  int,
  title       text not null,
  category_id smallint references public.lab_kb_categories(id),
  seq         int not null,
  unique (document_id, chapter_key)
);
create index if not exists lab_kb_chapters_cat_idx on public.lab_kb_chapters (category_id, chapter_no);

create table if not exists public.lab_kb_sections (
  id         uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.lab_kb_chapters(id) on delete restrict,
  seq        int not null,                     -- 0 = ما قبل أول عنوان فرعي
  heading    text,
  unique (chapter_id, seq)
);

create table if not exists public.lab_kb_chunks (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid not null references public.lab_kb_chapters(id) on delete restrict,
  section_id   uuid references public.lab_kb_sections(id) on delete restrict,
  seq          int not null,                   -- ترتيب المقطع داخل الفصل (موضع المحتوى؛ ملفات Word بلا أرقام صفحات ثابتة)
  kind         text not null check (kind in ('paragraph', 'list', 'table')),
  heading_path text,
  content      text not null,
  content_hash text not null,
  is_current   boolean not null default true,
  review_status text not null default 'imported',
  created_at   timestamptz not null default now(),
  search_text  text generated always as (public.lab_kb_norm(coalesce(heading_path, '') || ' ' || content)) stored,
  tsv          tsvector generated always as (to_tsvector('simple', public.lab_kb_norm(coalesce(heading_path, '') || ' ' || content))) stored,
  unique (chapter_id, seq)
);
create index if not exists lab_kb_chunks_tsv_idx on public.lab_kb_chunks using gin (tsv);

-- ---------- 3) القاموس والمراجع وسجل الاستيراد ----------
create table if not exists public.lab_kb_terms (
  id                 uuid primary key default gen_random_uuid(),
  term_key           text not null unique,
  ar                 text,
  en                 text,
  note               text,
  source_chapter_key text,
  document_id        uuid references public.lab_kb_documents(id) on delete restrict
);

create table if not exists public.lab_kb_sources (
  id                 uuid primary key default gen_random_uuid(),
  source_key         text not null unique,
  title              text not null,
  url                text,
  source_chapter_key text,
  document_id        uuid references public.lab_kb_documents(id) on delete restrict
);

create table if not exists public.lab_kb_import_jobs (
  id             uuid primary key default gen_random_uuid(),
  doc_key        text not null,
  file_name      text not null,
  file_sha256    text,
  status         text not null check (status in ('completed', 'failed')),
  chapters_count int, sections_count int, chunks_count int,
  tables_count   int, terms_count int, sources_count int,
  warnings       jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

-- أسماء العيوب وكودها في برنامج المصنع (P/C/R/B) لربط البحث بالعينات
create table if not exists public.lab_kb_defect_aliases (
  code  text not null check (code in ('P', 'C', 'R', 'B')),
  alias text not null,
  primary key (code, alias)
);

-- ---------- 4) أصحاب الاعتماد + الخبرات + السجل ----------
create table if not exists public.lab_kb_approvers (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now()
);

create table if not exists public.lab_kb_experiences (
  id          uuid primary key default gen_random_uuid(),
  num         bigint generated always as identity,
  code        text unique,
  title       text not null,
  summary     text not null default '',        -- ملخص الخبرة
  scope_note  text not null default '',        -- نطاق الصلاحية (جسم/جليز/حرارة/ظروف)
  limitations text not null default '',        -- القيود والحدود
  evidence    text not null default '',        -- الأدلة
  status      text not null default 'draft'
              check (status in ('draft', 'analysis', 'pending', 'approved', 'rejected', 'returned')),
  review_note text,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists lab_kb_experiences_status_idx on public.lab_kb_experiences (status);

-- روابط الخبرة بالتجارب (FKs تُصفَّر عند حذف العينة بدل منع حذفها، فلا نؤثر على وظائف المختبر القديمة)
create table if not exists public.lab_kb_links (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.lab_kb_experiences(id) on delete cascade,
  link_type     text not null check (link_type in ('sample', 'recipe', 'chunk')),
  sample_id     uuid references public.lab_samples(id) on delete set null,
  recipe_id     uuid references public.lab_recipes(id) on delete set null,
  chunk_id      uuid references public.lab_kb_chunks(id) on delete set null,
  ref_label     text not null,
  created_by    uuid default auth.uid() references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists lab_kb_links_exp_idx on public.lab_kb_links (experience_id);

-- سجل مراجعة/اعتماد: إضافة فقط (لا تعديل ولا حذف من أي مستخدم)
create table if not exists public.lab_kb_experience_reviews (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid references public.lab_kb_experiences(id) on delete set null,
  action        text not null,
  from_status   text,
  to_status     text,
  note          text,
  detail        jsonb,
  actor         uuid default auth.uid() references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists lab_kb_reviews_exp_idx on public.lab_kb_experience_reviews (experience_id, created_at);

-- ---------- 5) دوال الصلاحيات الخاصة بالاعتماد ----------
create or replace function public.lab_kb_is_approver()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.lab_can_read(), false)
     and exists (select 1 from public.lab_kb_approvers a where a.user_id = auth.uid());
$$;

-- يملأها الأدمن صراحةً؛ كل تغيير يُسجَّل
create or replace function public.lab_kb_set_approver(p_user uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(public.lab_is_admin(), false) then
    raise exception 'غير مسموح: تعيين أصحاب الاعتماد للمدير فقط';
  end if;
  if p_on then
    insert into public.lab_kb_approvers (user_id, added_by) values (p_user, auth.uid()) on conflict do nothing;
  else
    delete from public.lab_kb_approvers where user_id = p_user;
  end if;
  insert into public.lab_kb_experience_reviews (action, detail)
  values (case when p_on then 'approver_added' else 'approver_removed' end, jsonb_build_object('user_id', p_user));
end $$;

-- اسم صاحب/أصحاب الاعتماد ليراه كل من له وصول للمختبر (شفافية)
create or replace function public.lab_kb_approver_names()
returns table (user_id uuid, full_name text) language plpgsql stable security definer set search_path = public as $$
begin
  if not coalesce(public.lab_can_read(), false) then raise exception 'غير مسموح'; end if;
  return query select a.user_id, p.full_name from public.lab_kb_approvers a left join public.profiles p on p.id = a.user_id;
end $$;

-- ---------- 6) تريجرز الخبرات (الحماية الفعلية في قاعدة البيانات) ----------
create or replace function public.lab_kb_exp_before_ins()
returns trigger language plpgsql as $$
begin
  new.code := 'EXP-' || lpad(new.num::text, 4, '0');
  new.status := 'draft';                 -- لا تُنشأ خبرة إلا كمسودة
  new.approved_by := null; new.approved_at := null;
  new.created_by := auth.uid();
  return new;
end $$;
drop trigger if exists lab_kb_exp_before_ins on public.lab_kb_experiences;
create trigger lab_kb_exp_before_ins before insert on public.lab_kb_experiences
  for each row execute function public.lab_kb_exp_before_ins();

create or replace function public.lab_kb_exp_before_upd()
returns trigger language plpgsql as $$
declare flag boolean := coalesce(current_setting('lab_kb.transition', true), '') = 'on';
begin
  new.updated_at := now();
  if flag then return new; end if;
  -- خارج دالة الانتقال: ممنوع تغيير الحالة أو بيانات الاعتماد أو الكود
  if new.status is distinct from old.status then
    raise exception 'تغيير حالة الخبرة يتم فقط عبر lab_kb_transition';
  end if;
  new.code := old.code;
  new.created_by := old.created_by;
  new.approved_by := old.approved_by;
  new.approved_at := old.approved_at;
  -- تعديل محتوى خبرة معتمدة يسحب الاعتماد ويعيدها لانتظار الاعتماد
  if old.status = 'approved' and (
       new.title is distinct from old.title or new.summary is distinct from old.summary
    or new.scope_note is distinct from old.scope_note or new.limitations is distinct from old.limitations
    or new.evidence is distinct from old.evidence) then
    new.status := 'pending'; new.approved_by := null; new.approved_at := null;
  end if;
  return new;
end $$;
drop trigger if exists lab_kb_exp_before_upd on public.lab_kb_experiences;
create trigger lab_kb_exp_before_upd before update on public.lab_kb_experiences
  for each row execute function public.lab_kb_exp_before_upd();

create or replace function public.lab_kb_exp_after()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lab_kb_experience_reviews (experience_id, action, to_status) values (new.id, 'created', new.status);
  elsif coalesce(current_setting('lab_kb.transition', true), '') <> 'on' then
    if old.status = 'approved' and new.status = 'pending' then
      insert into public.lab_kb_experience_reviews (experience_id, action, from_status, to_status, note)
      values (new.id, 'approval_withdrawn_on_edit', 'approved', 'pending', 'تعديل المحتوى بعد الاعتماد');
    elsif (new.title, new.summary, new.scope_note, new.limitations, new.evidence)
          is distinct from (old.title, old.summary, old.scope_note, old.limitations, old.evidence) then
      insert into public.lab_kb_experience_reviews (experience_id, action, from_status, to_status, detail)
      values (new.id, 'edited', old.status, new.status,
              jsonb_build_object('old', jsonb_build_object('title', old.title, 'summary', old.summary,
                'scope_note', old.scope_note, 'limitations', old.limitations, 'evidence', old.evidence)));
    end if;
  end if;
  return null;
end $$;
drop trigger if exists lab_kb_exp_after on public.lab_kb_experiences;
create trigger lab_kb_exp_after after insert or update on public.lab_kb_experiences
  for each row execute function public.lab_kb_exp_after();

-- ---------- 7) دورة الاعتماد ----------
create or replace function public.lab_kb_transition(p_id uuid, p_to text, p_note text default null)
returns public.lab_kb_experiences language plpgsql security definer set search_path = public as $$
declare e public.lab_kb_experiences; n_links int; ok boolean := false; by_approver boolean := false; old_status text;
begin
  if auth.uid() is null or not coalesce(public.lab_can_read(), false) then raise exception 'غير مسموح'; end if;
  select * into e from public.lab_kb_experiences where id = p_id for update;
  if not found then raise exception 'الخبرة غير موجودة'; end if;
  old_status := e.status;

  -- انتقالات الفنيين (صلاحية تعديل)
  if (e.status, p_to) in (('draft','analysis'), ('analysis','draft'), ('analysis','pending'),
                          ('pending','analysis'), ('returned','analysis'), ('rejected','draft')) then
    if not coalesce(public.lab_can_write(), false) then raise exception 'غير مسموح: تحتاج صلاحية تعديل'; end if;
    ok := true;
  end if;
  -- انتقالات صاحب الاعتماد فقط
  if e.status = 'pending' and p_to in ('approved', 'rejected', 'returned') then
    if not public.lab_kb_is_approver() then raise exception 'غير مسموح: الاعتماد لصاحب الاعتماد المعيَّن فقط'; end if;
    if p_to in ('rejected', 'returned') and coalesce(btrim(p_note), '') = '' then
      raise exception 'اكتب سبب الرفض أو الإعادة للمراجعة';
    end if;
    ok := true; by_approver := true;
  end if;
  if not ok then raise exception 'انتقال غير مسموح: % -> %', e.status, p_to; end if;

  if p_to = 'pending' then
    select count(*) into n_links from public.lab_kb_links where experience_id = e.id and link_type in ('sample', 'recipe');
    if n_links = 0 or length(btrim(e.summary)) < 10 or length(btrim(e.scope_note)) < 5
       or length(btrim(e.limitations)) < 5 or length(btrim(e.evidence)) < 5 then
      raise exception 'لإرسالها للاعتماد: املأ الملخص والنطاق والقيود والأدلة واربطها بعينة أو تركيبة واحدة على الأقل';
    end if;
  end if;

  perform set_config('lab_kb.transition', 'on', true);
  update public.lab_kb_experiences set
    status = p_to,
    review_note = case when by_approver or p_to in ('draft','analysis') then p_note else review_note end,
    approved_by = case when p_to = 'approved' then auth.uid() when p_to in ('draft','analysis','pending','rejected','returned') then null else approved_by end,
    approved_at = case when p_to = 'approved' then now() else null end
  where id = e.id returning * into e;
  perform set_config('lab_kb.transition', 'off', true);

  insert into public.lab_kb_experience_reviews (experience_id, action, from_status, to_status, note)
  values (e.id, case when p_to = 'approved' then 'approved' when p_to = 'rejected' then 'rejected'
                     when p_to = 'returned' then 'returned' else 'status_change' end,
          old_status, p_to, p_note);
  return e;
end $$;

-- درجة ثقة الخبرة: تستند للأدلة (عينات مراجَعة مرتبطة) — الاعتماد وحده لا يرفعها
create or replace function public.lab_kb_experience_confidence(p_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when e.status <> 'approved' then 'low'
    when n >= 3 then 'high'
    when n = 2 then 'medium'
    else 'low' end
  from public.lab_kb_experiences e,
       lateral (select count(distinct l.sample_id)::int as n
                  from public.lab_kb_links l join public.lab_samples s on s.id = l.sample_id
                 where l.experience_id = e.id and l.link_type = 'sample' and s.status = 'reviewed') x
  where e.id = p_id and coalesce(public.lab_can_read(), false);
$$;

-- ---------- 8) البحث المحلي (بدون أي API خارجي) ----------
create or replace function public.lab_kb_match(txt text, toks text[], exps text[])
returns boolean language sql immutable as $$
  select (cardinality(toks) > 0 and not exists (select 1 from unnest(toks) t where position(t in txt) = 0))
      or exists (select 1 from unnest(exps) e where e <> '' and position(e in txt) > 0);
$$;

create or replace function public.lab_kb_search(
  p_query text, p_layers text[] default null, p_category smallint default null, p_limit int default 30)
returns table (
  layer text, ref_id uuid, title text, snippet text, source_label text, source_detail text,
  chapter_no int, category_name text, status text, confidence text, rank real, link_path text)
language plpgsql stable set search_path = public as $$
declare
  qn text; toks text[]; exps text[]; codes text[]; tsq_and tsquery; tsq_or tsquery; tsq tsquery;
  stop text[] := array['في','من','علي','الي','ما','هو','هي','هل','عن','مع','ان','او','كيف','ماذا','لماذا','the','of','and','in','is','what','how','for'];
  and_txt text; or_txt text; exp_txt text; n int; lim int := least(greatest(coalesce(p_limit, 30), 1), 100);
begin
  if not coalesce(public.lab_can_read(), false) then raise exception 'غير مسموح'; end if;
  qn := public.lab_kb_norm(p_query);
  if length(qn) < 2 then return; end if;

  select coalesce(array_agg(t), '{}') into toks from unnest(string_to_array(qn, ' ')) t
    where length(t) >= 2 and not (t = any (stop));
  if cardinality(toks) = 0 then return; end if;

  -- توسيع الاستعلام: القاموس (عربي<->إنجليزي) + مرادفات العيوب
  select coalesce(array_agg(distinct x), '{}') into exps from (
    select public.lab_kb_norm(case when position(public.lab_kb_norm(t.ar) in qn) > 0 then t.en else t.ar end) as x
      from public.lab_kb_terms t
     where t.ar is not null and t.en is not null and length(public.lab_kb_norm(t.ar)) >= 3 and length(public.lab_kb_norm(t.en)) >= 3
       and (position(public.lab_kb_norm(t.ar) in qn) > 0 or position(public.lab_kb_norm(t.en) in qn) > 0)
    union
    select public.lab_kb_norm(a2.alias) from public.lab_kb_defect_aliases a1
      join public.lab_kb_defect_aliases a2 on a2.code = a1.code
     where position(public.lab_kb_norm(a1.alias) in qn) > 0
  ) q where x is not null and x <> '';
  select coalesce(array_agg(distinct a.code), '{}') into codes from public.lab_kb_defect_aliases a
    where position(public.lab_kb_norm(a.alias) in qn) > 0;

  and_txt := '(' || array_to_string(array(select t || ':*' from unnest(toks) t), ' & ') || ')';
  or_txt  := '(' || array_to_string(array(select t || ':*' from unnest(toks) t where length(t) >= 3), ' | ') || ')';
  if or_txt = '()' then or_txt := and_txt; end if;
  exp_txt := coalesce(' | ' || nullif(array_to_string(array(
      select '(' || array_to_string(array(select w || ':*' from unnest(string_to_array(e, ' ')) w where w <> ''), ' & ') || ')'
        from unnest(exps) e where e <> ''), ' | '), ''), '');
  tsq_and := to_tsquery('simple', and_txt || exp_txt);
  tsq_or  := to_tsquery('simple', or_txt  || exp_txt);
  select count(*) into n from public.lab_kb_chunks where is_current and tsv @@ tsq_and;
  tsq := case when n > 0 then tsq_and else tsq_or end;

  -- 1) الموسوعة
  if p_layers is null or 'encyclopedia' = any (p_layers) then
    return query
      select 'encyclopedia'::text, k.id, c.title,
             left(k.content, 260),
             'موسوعة علمية'::text,
             (d.title || ' — الإصدار ' || d.edition || case when c.chapter_no is not null then ' — الفصل ' || c.chapter_no else '' end || ' — ' || c.title),
             c.chapter_no, cat.name_ar, 'imported'::text, 'reference'::text,
             (ts_rank(k.tsv, tsq) + case when position(qn in k.search_text) > 0 then 0.3 else 0 end)::real,
             ('/knowledge/chapter/' || c.id)::text
        from public.lab_kb_chunks k
        join public.lab_kb_chapters c on c.id = k.chapter_id
        join public.lab_kb_documents d on d.id = c.document_id
        left join public.lab_kb_categories cat on cat.id = c.category_id
       where k.is_current and (p_category is null or c.category_id = p_category)
         and (k.tsv @@ tsq or position(qn in k.search_text) > 0)
       order by 11 desc limit lim;
  end if;

  if p_category is not null then return; end if;

  -- 2) تاريخ المختبر: العينات (مصدر: تجربة داخل المختبر، لا يُعامل كحقيقة منشورة)
  if p_layers is null or 'lab' = any (p_layers) then
    return query
      select 'lab'::text, s.id, ('عينة ' || s.code)::text,
             left(coalesce(nullif(btrim(s.notes), ''), 'بدون ملاحظات') || case when r.code is not null then ' — تركيبة ' || r.code else '' end, 260),
             'تجربة داخل المختبر'::text,
             ('الحالة: ' || s.status || coalesce(' — تصنيف نهائي: ' || s.fc, ''))::text,
             null::int, null::text, s.status::text,
             (case when s.status = 'reviewed' and s.fc is not null then 'medium' else 'low' end)::text,
             (case when s.dc && codes then 0.6 else 0.4 end)::real,
             ('/samples/' || s.id)::text
        from (select s0.*,
                     public.lab_kb_norm(concat_ws(' ', s0.code, s0.notes, s0.body_type, s0.application_method,
                        (select string_agg(coalesce(x.reviewer_notes, ''), ' ') from public.lab_sample_results x where x.sample_id = s0.id))) as txt,
                     coalesce((select array_agg(distinct d) from public.lab_sample_results x, unnest(x.defects) d where x.sample_id = s0.id), '{}') as dc,
                     (select x.final_code from public.lab_sample_results x where x.sample_id = s0.id and x.final_code is not null order by x.created_at desc limit 1) as fc
                from public.lab_samples s0) s
        left join public.lab_recipes r on r.id = s.recipe_id
       where public.lab_kb_match(s.txt, toks, exps) or s.dc && codes
       order by 11 desc, s.code desc limit lim;

    return query
      select 'lab'::text, r.id, ('تركيبة ' || r.code || ' — ' || r.name)::text,
             left(coalesce(nullif(btrim(r.notes), ''), 'بدون ملاحظات'), 260),
             'تجربة داخل المختبر'::text, 'تركيبة معملية'::text, null::int, null::text,
             null::text, 'low'::text, 0.35::real, ('/recipes/' || r.id)::text
        from public.lab_recipes r
       where public.lab_kb_match(public.lab_kb_norm(concat_ws(' ', r.code, r.name, r.notes)), toks, exps)
       limit lim;
  end if;

  -- 3) الخبرات (المعتمدة تظهر كمعتمدة، وغير المعتمدة تظهر كفرضية)
  if p_layers is null or 'experience' = any (p_layers) then
    return query
      select (case when e.status = 'approved' then 'approved_experience' else 'unapproved_experience' end)::text,
             e.id, (e.code || ' — ' || e.title)::text, left(e.summary, 260),
             (case when e.status = 'approved' then 'خبرة مصنع معتمدة' else 'فرضية تحتاج إلى تحقق (غير معتمدة)' end)::text,
             ('النطاق: ' || left(e.scope_note, 120))::text, null::int, null::text, e.status,
             public.lab_kb_experience_confidence(e.id),
             (case when e.status = 'approved' then 0.9 else 0.3 end)::real, ('/knowledge/experiences/' || e.id)::text
        from public.lab_kb_experiences e
       where public.lab_kb_match(public.lab_kb_norm(concat_ws(' ', e.code, e.title, e.summary, e.scope_note, e.limitations, e.evidence)), toks, exps)
       order by 11 desc limit lim;
  end if;
end $$;

-- ---------- 9) RLS ----------
alter table public.lab_kb_categories          enable row level security;
alter table public.lab_kb_documents           enable row level security;
alter table public.lab_kb_chapters            enable row level security;
alter table public.lab_kb_sections            enable row level security;
alter table public.lab_kb_chunks              enable row level security;
alter table public.lab_kb_terms               enable row level security;
alter table public.lab_kb_sources             enable row level security;
alter table public.lab_kb_import_jobs         enable row level security;
alter table public.lab_kb_defect_aliases      enable row level security;
alter table public.lab_kb_approvers           enable row level security;
alter table public.lab_kb_experiences         enable row level security;
alter table public.lab_kb_links               enable row level security;
alter table public.lab_kb_experience_reviews  enable row level security;

-- قراءة فقط لمن له وصول للمختبر (الكتابة في جداول الموسوعة عبر SQL Editor بصلاحية المالك فقط)
do $$
declare t text;
begin
  foreach t in array array['categories','documents','chapters','sections','chunks','terms','sources',
                           'import_jobs','defect_aliases','approvers','experience_reviews'] loop
    execute format('drop policy if exists "kb_read" on public.lab_kb_%s', t);
    execute format('create policy "kb_read" on public.lab_kb_%s for select to authenticated using (public.lab_can_read())', t);
  end loop;
end $$;

-- الخبرات: القراءة لمن له وصول، الإنشاء/التعديل لمن له صلاحية تعديل، الحذف للمسودات فقط
drop policy if exists "kb_exp_read" on public.lab_kb_experiences;
create policy "kb_exp_read" on public.lab_kb_experiences for select to authenticated using (public.lab_can_read());
drop policy if exists "kb_exp_ins" on public.lab_kb_experiences;
create policy "kb_exp_ins" on public.lab_kb_experiences for insert to authenticated with check (public.lab_can_write());
drop policy if exists "kb_exp_upd" on public.lab_kb_experiences;
create policy "kb_exp_upd" on public.lab_kb_experiences for update to authenticated
  using (public.lab_can_write() and status <> 'pending') with check (public.lab_can_write());
drop policy if exists "kb_exp_del" on public.lab_kb_experiences;
create policy "kb_exp_del" on public.lab_kb_experiences for delete to authenticated
  using (public.lab_can_write() and status = 'draft');

drop policy if exists "kb_links_read" on public.lab_kb_links;
create policy "kb_links_read" on public.lab_kb_links for select to authenticated using (public.lab_can_read());
drop policy if exists "kb_links_write" on public.lab_kb_links;
create policy "kb_links_write" on public.lab_kb_links for all to authenticated
  using (public.lab_can_write() and exists (select 1 from public.lab_kb_experiences e where e.id = experience_id and e.status in ('draft','analysis','returned','rejected')))
  with check (public.lab_can_write() and exists (select 1 from public.lab_kb_experiences e where e.id = experience_id and e.status in ('draft','analysis','returned','rejected')));

-- ---------- 10) الامتيازات ----------
revoke all on public.lab_kb_categories, public.lab_kb_documents, public.lab_kb_chapters, public.lab_kb_sections,
  public.lab_kb_chunks, public.lab_kb_terms, public.lab_kb_sources, public.lab_kb_import_jobs,
  public.lab_kb_defect_aliases, public.lab_kb_approvers, public.lab_kb_experiences, public.lab_kb_links,
  public.lab_kb_experience_reviews from anon, authenticated;
grant select on public.lab_kb_categories, public.lab_kb_documents, public.lab_kb_chapters, public.lab_kb_sections,
  public.lab_kb_chunks, public.lab_kb_terms, public.lab_kb_sources, public.lab_kb_import_jobs,
  public.lab_kb_defect_aliases, public.lab_kb_approvers, public.lab_kb_experience_reviews to authenticated;
grant select, insert, update, delete on public.lab_kb_experiences, public.lab_kb_links to authenticated;

revoke all on function public.lab_kb_norm(text), public.lab_kb_match(text, text[], text[]),
  public.lab_kb_is_approver(), public.lab_kb_set_approver(uuid, boolean), public.lab_kb_approver_names(),
  public.lab_kb_transition(uuid, text, text), public.lab_kb_experience_confidence(uuid),
  public.lab_kb_search(text, text[], smallint, int) from public, anon;
grant execute on function public.lab_kb_norm(text), public.lab_kb_match(text, text[], text[]),
  public.lab_kb_is_approver(), public.lab_kb_set_approver(uuid, boolean), public.lab_kb_approver_names(),
  public.lab_kb_transition(uuid, text, text), public.lab_kb_experience_confidence(uuid),
  public.lab_kb_search(text, text[], smallint, int) to authenticated;

-- ---------- 11) بيانات مرجعية: الأبواب (16) + مرادفات العيوب ----------
insert into public.lab_kb_categories (id, slug, name_ar, name_en, sort_order) values
 (1,'fundamentals','أساسيات البورسلين','Porcelain fundamentals',1),
 (2,'raw-materials','الخامات والتحليل الكيميائي','Raw materials & chemical analysis',2),
 (3,'body-composition','تركيب الجسم','Body composition',3),
 (4,'body-prep','تحضير الجسم والطحن','Body preparation & milling',4),
 (5,'forming-drying','التشكيل والتجفيف','Forming & drying',5),
 (6,'firing-kilns','الحريق والأفران','Firing & kilns',6),
 (7,'glaze-chemistry','كيمياء الجليز وحساباته','Glaze chemistry & calculations',7),
 (8,'stains-colors','الصبغات والألوان','Stains & colors',8),
 (9,'decoration','الزخرفة','Decoration',9),
 (10,'body-glaze-fit','توافق الجسم والجليز','Body–glaze fit',10),
 (11,'defects','عيوب الإنتاج','Production defects',11),
 (12,'lab-tests','الاختبارات المعملية','Laboratory tests',12),
 (13,'quality-control','ضبط الجودة','Quality control',13),
 (14,'tableware','أدوات المائدة','Tableware',14),
 (15,'doe-statistics','تصميم التجارب والتحليل الإحصائي','DOE & statistics',15),
 (16,'knowledge-mgmt','إدارة المعرفة والنماذج والمراجع','Knowledge management, templates & references',16)
on conflict (id) do nothing;

insert into public.lab_kb_defect_aliases (code, alias) values
 ('P','pinholes'),('P','pinhole'),('P','pinholing'),('P','ثقوب دبوسية'),('P','ثقوب الدبوس'),('P','ثقوب دقيقة'),
 ('C','crawling'),('C','crawl'),('C','انكماش الجليز'),('C','تكور الجليز'),('C','زحف الجليز'),
 ('R','crazing'),('R','craze'),('R','تشقق'),('R','التشققات الشعرية'),('R','تشقق شبكي'),
 ('B','blistering'),('B','blister'),('B','فقاعات'),('B','الفقاعات'),('B','انتفاخات')
on conflict do nothing;

commit;
