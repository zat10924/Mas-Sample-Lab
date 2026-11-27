-- =====================================================================
-- 010 — تعيين صاحب اعتماد الخبرات: «زياد عصام»
-- شغّله بنفسك بعد مراجعته. لا يعيّن أحدًا إلا لو وُجد حساب واحد فقط مطابق للاسم.
-- لو ظهر تنبيه "لم يُعيَّن": استخدم الاستعلام في الأسفل لمعرفة الحساب ثم
-- شغّل: select public.lab_kb_set_approver('<user-id>', true);  من حساب مدير.
-- =====================================================================
do $$
declare n int; uid uuid;
begin
  select count(*), min(p.id::text)::uuid into n, uid
    from public.profiles p
   where lower(btrim(p.full_name)) = lower('زياد عصام');
  if n = 1 then
    insert into public.lab_kb_approvers (user_id) values (uid) on conflict do nothing;
    insert into public.lab_kb_experience_reviews (action, detail, actor)
      values ('approver_added', jsonb_build_object('user_id', uid, 'by', 'migration 010'), null);
    raise notice 'تم تعيين زياد عصام (%) كصاحب اعتماد', uid;
  else
    raise notice 'لم يُعيَّن أحد: عدد الحسابات المطابقة للاسم = % (يجب أن يكون 1). راجع الاستعلام أدناه.', n;
  end if;
end $$;

-- للتأكد: من هو صاحب الاعتماد الآن؟
select a.user_id, p.full_name, a.added_at
  from public.lab_kb_approvers a left join public.profiles p on p.id = a.user_id;

-- لمعرفة الحسابات المشابهة للاسم (للقراءة فقط):
-- select id, full_name, role from public.profiles where full_name ilike '%زياد%';
