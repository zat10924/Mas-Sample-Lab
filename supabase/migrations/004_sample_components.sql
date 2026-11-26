-- =====================================================================
-- 004: مكونات العينة (العينة = مجموعة مكونات: جليز شفاف 1 كجم + أكسيد 20 جم + ...)
-- شغّله في Supabase > SQL Editor بعد 001 و 002 و 003.
-- آمن لو اتشغّل أكتر من مرة. مفيش أي تغيير في البيانات الموجودة.
-- =====================================================================

create table if not exists public.lab_sample_components (
  id          uuid primary key default gen_random_uuid(),
  sample_id   uuid not null references public.lab_samples(id) on delete cascade,
  material    text not null check (length(btrim(material)) > 0),
  amount      numeric not null check (amount >= 0),
  unit        text not null default 'g' check (unit in ('g', 'kg', 'ml', 'l')),
  sort_order  int not null default 0
);

create index if not exists lab_sample_components_sample_idx
  on public.lab_sample_components (sample_id, sort_order);

alter table public.lab_sample_components enable row level security;

drop policy if exists "lab_components read" on public.lab_sample_components;
create policy "lab_components read" on public.lab_sample_components
  for select to authenticated using (public.lab_can_read());

drop policy if exists "lab_components insert" on public.lab_sample_components;
create policy "lab_components insert" on public.lab_sample_components
  for insert to authenticated with check (public.lab_can_write());

drop policy if exists "lab_components update" on public.lab_sample_components;
create policy "lab_components update" on public.lab_sample_components
  for update to authenticated
  using (public.lab_can_write()) with check (public.lab_can_write());

drop policy if exists "lab_components delete" on public.lab_sample_components;
create policy "lab_components delete" on public.lab_sample_components
  for delete to authenticated using (public.lab_can_write());
