-- =====================================================================
-- 005: دعم النسبة المئوية في مكونات العينة (وحدة percent)
-- شغّله في Supabase > SQL Editor بعد 004. آمن لو اتشغّل أكتر من مرة.
-- مفيش أي تغيير في البيانات الموجودة، بس بيسمح بوحدة جديدة.
-- =====================================================================

alter table public.lab_sample_components
  drop constraint if exists lab_sample_components_unit_check;

alter table public.lab_sample_components
  add constraint lab_sample_components_unit_check
  check (unit in ('g', 'kg', 'ml', 'l', 'percent'));
