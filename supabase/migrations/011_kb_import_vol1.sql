-- =====================================================================
-- استيراد موسوعة علوم وتكنولوجيا البورسلين — المجلد الأول
-- الملف الأصلي: MAS_LAB_Porcelain_Encyclopedia_AR_v1.docx  (SHA-256: 05e369f730f6ae2c…)
-- مولَّد آليًا بواسطة tools/kb_import/build_kb.py — آمن لإعادة التشغيل (بدون تكرار).
-- يتطلب تشغيل 009_kb_schema.sql أولًا. لا يمسّ أي جدول قديم.
-- =====================================================================
begin;

insert into public.lab_kb_documents (doc_key, title, edition, volume, file_name, file_sha256)
values ($kb$vol1$kb$, $kb$موسوعة علوم وتكنولوجيا البورسلين — المجلد الأول$kb$, $kb$v1$kb$, 1, $kb$MAS_LAB_Porcelain_Encyclopedia_AR_v1.docx$kb$, $kb$05e369f730f6ae2cdbb4367f025734843c7736a896e930e3207fa0751434cbc3$kb$)
on conflict (doc_key) do update set title = excluded.title, edition = excluded.edition,
  file_name = excluded.file_name, file_sha256 = excluded.file_sha256, imported_at = now();

-- ---- front-0: غلاف المجلد
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$front-0$kb$, null, $kb$غلاف المجلد$kb$, 16, 1
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$موسوعة MAS LAB لعلوم وتكنولوجيا البورسلين$kb$, $kb$7ae5dac472628b84a243cf26c83712a9012e838d$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$مرجع تأسيسي تطبيقي لمختبر ومصنع أدوات المائدة — الإصدار الأول 2026$kb$, $kb$81745ee552e68908e53db391c0bde4cb5b332d11$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 2;

-- ---- x-92f8284c: مقدمة وحدود الاستخدام
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-92f8284c$kb$, null, $kb$مقدمة وحدود الاستخدام$kb$, 1, 2
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-92f8284c$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$مقدمة وحدود الاستخدام$kb$, $kb$هذه موسوعة تأسيسية واسعة ومنظمة لتكون نواة قاعدة المعرفة في MAS LAB. وهي ليست بديلًا عن النصوص الكاملة للمعايير أو كتب التخصص أو تقييم مهندس المصنع. يجب التحقق من كل وصفة أو قيمة تشغيلية على خامات المصنع ومعداته قبل اعتمادها.$kb$, $kb$43adcb9343b2a1b2f895c64dc6800945e6ddfb36$kb$),
  (2, 0, $kb$list$kb$, $kb$مقدمة وحدود الاستخدام$kb$, $kb$- افصل دائمًا بين الحقيقة العلمية والتفسير الهندسي والفرضية والنتيجة التجريبية.
- لا تعتمد أي تجربة تلقائيًا كخبرة مصنع؛ الاعتماد يحتاج مراجعة وموافقة صاحب الصلاحية.
- لا تعتبر صورة العيب وحدها دليلًا كافيًا على سببه.
- سلامة ملامسة الغذاء واختبارات الهجرة الكيميائية متطلبات مستقلة عن المظهر والجودة البصرية.$kb$, $kb$9e54246cdf51c3833404c1a3d0cc67ff78ffbc66$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-92f8284c$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-92f8284c$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 2;

-- ---- x-b0fe98b2: فهرس الأبواب
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-b0fe98b2$kb$, null, $kb$فهرس الأبواب$kb$, 16, 3
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-b0fe98b2$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$list$kb$, $kb$فهرس الأبواب$kb$, $kb$- 1. مدخل إلى علم السيراميك والبورسلين
- 2. الخامات المعدنية وخصائصها
- 3. تصميم جسم البورسلين وحساباته
- 4. تحضير الجسم والطحن
- 5. التشكيل: الصب والكبس والتشكيل اللدن
- 6. التجفيف والانكماش
- 7. الحريق والتحولات الحرارية
- 8. الأفران ومنحنيات الحريق
- 9. كيمياء وتكنولوجيا الجليز
- 10. حساب التركيبات وخواص الجليز
- 11. الصبغات والألوان
- 12. تكنولوجيا الزخرفة
- 13. توافق الجسم والجليز والتمدد الحراري
- 14. عيوب الإنتاج وتحليل الأسباب
- 15. الاختبارات المعملية
- 16. ضبط الجودة وإدارة القياس
- 17. هندسة أدوات المائدة
- 18. تصميم التجارب والتحليل الإحصائي$kb$, $kb$f2a8a123700db5cab80d8aca1dfdccd5c117ce33$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-b0fe98b2$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-b0fe98b2$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 1;

-- ---- ch-1: مدخل إلى علم السيراميك والبورسلين
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-1$kb$, 1, $kb$مدخل إلى علم السيراميك والبورسلين$kb$, 1, 4
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-1$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$مدخل إلى علم السيراميك والبورسلين$kb$, $kb$السيراميك مواد غير عضوية وغير فلزية تُشكّل ثم تُعالج حراريًا للوصول إلى خواصها النهائية. يعتمد السيراميك التقليدي غالبًا على السيليكات والألومينوسيليكات. البورسلين مجموعة من المنتجات السيراميكية ذات جسم متماسك وناضج حراريًا، وقد يتميز بانخفاض الامتصاص ودرجة من الشفافية بحسب التركيب والسُمك والنضج.$kb$, $kb$71f8940571dbb603524e9ca25caaa3f1bda1723e$kb$),
  (2, 0, $kb$table$kb$, $kb$مدخل إلى علم السيراميك والبورسلين$kb$, $kb$| المجموعة | السمات العامة | ملاحظة |
| --- | --- | --- |
| البورسلين | جسم متزجج نسبيًا وكثيف وقد يكون شبه شفاف | الاسم وحده لا يحدد التركيبة أو دورة الحريق |
| الخزف الحجري Stoneware | جسم كثيف منخفض الامتصاص عادةً | تركيباته ومتطلبات تشكيله تختلف |
| الفخار Earthenware | مسامية أعلى غالبًا | يحتاج غالبًا إلى جليز لتقليل نفاذية السطح |
| Bone China | جسم يحتوي فوسفات الكالسيوم بنسبة مميزة | فئة تركيبية مستقلة |$kb$, $kb$60ae6b9926dd5c3af16646b358f7374d8576f48f$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$مدخل إلى علم السيراميك والبورسلين$kb$, $kb$لا يصح نقل وصفة أو منحنى حريق بين هذه الفئات دون تحقق. درجة الحرارة القصوى وحدها لا تصف النضج؛ فالزمن ومعدل التسخين والجو وتوزيع الحرارة عوامل مؤثرة.$kb$, $kb$1b38156f32a43e5e6b57f263d6abab035bd1ddc5$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-1$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-1$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-2: الخامات المعدنية
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-2$kb$, 2, $kb$الخامات المعدنية$kb$, 2, 5
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-2$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$الخامات المعدنية$kb$, $kb$الخامات لا تُقيّم بالاسم التجاري فقط. يجب ربط كل دفعة بمورد ورقم تشغيلة وشهادة تحليل، مع اختبارات عملية للون واللدونة والانكماش وسلوك الحريق. يساعد XRF في تقدير التركيب الكيميائي للأكاسيد، بينما يساعد XRD في تحديد الأطوار المعدنية؛ ولا يغني أي منهما عن الاختبار التشغيلي.$kb$, $kb$a94da8d9cc1245ff970ad2877a7e08c018a86605$kb$),
  (2, 0, $kb$table$kb$, $kb$الخامات المعدنية$kb$, $kb$| الخامة | الدور الشائع | ما يجب فحصه |
| --- | --- | --- |
| الكاولين | مصدر للألومينا والسيليكا ويساهم في اللدونة والبنية | النقاوة، حجم الحبيبات، المعادن المصاحبة، البياض |
| طينات لدنة | تحسين التشكيل والقوة الخضراء | الأملاح، الكربون، الحديد، الانكماش واللزوجة |
| الفلسبار | مصدر للصهارات وتكوين الطور الزجاجي | Na2O وK2O وCaO والحديد وحجم الحبيبات |
| الكوارتز | مكوّن غير لدن ويساهم في ضبط الانكماش والبنية | النقاوة والحجم الحبيبي والتحولات الحرارية |
| الكربونات | مصدر لأكاسيد مثل CaO أو MgO بعد التحلل | الفقد بالحريق وحجم الحبيبات وخروج الغازات |$kb$, $kb$8c64ead4c6129257a8e25daa544e7fe003aba01b$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$الخامات المعدنية$kb$, $kb$الفقد بالحريق LOI قد يعكس ماءً بنيويًا أو كربونات أو مواد عضوية أو مواد متطايرة. لذلك يجب معرفة طريقة الاختبار وظروفه قبل تفسير النتيجة.$kb$, $kb$cf22e6308afff12857bffd10c6122a81eaf37fe5$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-2$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-2$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-3: تصميم جسم البورسلين وحساباته
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-3$kb$, 3, $kb$تصميم جسم البورسلين وحساباته$kb$, 3, 6
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-3$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تصميم جسم البورسلين وحساباته$kb$, $kb$تصميم الجسم موازنة بين متطلبات التشكيل قبل الحريق وخواص المنتج بعده. المواد اللدنة تساعد على التشكيل والتماسك، والصهارات تساعد على التزجج، والمواد غير اللدنة قد تضبط الانكماش والبنية. الأدوار تتغير بتغير التركيب والعملية.$kb$, $kb$866f64f7c115225ca18b59a87569e0633fce4537$kb$),
  (2, 0, $kb$list$kb$, $kb$تصميم جسم البورسلين وحساباته$kb$, $kb$- خصائص الجسم: اللدونة أو الانسياب، القوة الخضراء والجافة، الانكماش، امتصاص الماء، الكثافة، اللون، الشفافية والتشوه الحراري.
- النسبة الوزنية للمكوّن = كتلته ÷ مجموع كتل الخامات × 100. يجب تحديد ما إذا كان الحساب على أساس رطب أو جاف أو محروق.
- الوزن الجاف = الوزن الرطب × (1 − نسبة الرطوبة ككسر عشري).
- لا توجد تركيبة عامة تصلح لكل مصنع؛ التصميم يتطلب تحليل الخامات وطريقة التشكيل والفرن والخواص المستهدفة.$kb$, $kb$7ea2126f8461a5a4acb44cd37e82b71ce0079f9f$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-3$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-3$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 2;

-- ---- ch-4: تحضير الجسم والطحن
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-4$kb$, 4, $kb$تحضير الجسم والطحن$kb$, 4, 7
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-4$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تحضير الجسم والطحن$kb$, $kb$الهدف هو خليط متجانس بالحجم الحبيبي والرطوبة والخواص المناسبة للعملية التالية. تؤثر كفاءة الطحن وترتيب الإضافة وحالة بطانة المطحنة والكرات في التلوث والتوزيع الحبيبي والريولوجيا.$kb$, $kb$5edb6a364efae503defa36ec4c28e4e11d880579$kb$),
  (2, 0, $kb$list$kb$, $kb$تحضير الجسم والطحن$kb$, $kb$- تحقق من هوية الخامة ورقم التشغيلة والوزن والرطوبة.
- افحص نظافة الخلاط والمطحنة والخزانات لمنع التلوث المتبادل.
- سجل زمن الطحن وظروفه، وتابع البقايا على المناخل وتوزيع حجم الحبيبات.
- استخدم الفصل المغناطيسي عندما يكون ملائمًا، وسجل التنظيف والفحص.
- تأكد من التجانس قبل النقل والتخزين، وامنع الترسيب والتكتل.$kb$, $kb$b3ef462a731fc83cb0ec2a51bedf3e8c77d0af2f$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$تحضير الجسم والطحن$kb$, $kb$زيادة الطحن ليست دائمًا أفضل؛ فقد ترفع اللزوجة أو التلوث أو استهلاك الطاقة. القرار يعتمد على القياس والنتائج.$kb$, $kb$7dedbf1b8aa1fda323c7a9142d1d0b369f29c4a3$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-4$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-4$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-5: التشكيل: الصب والكبس والتشكيل اللدن
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-5$kb$, 5, $kb$التشكيل: الصب والكبس والتشكيل اللدن$kb$, 5, 8
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$الصب بالمعلق$kb$),
  (2, $kb$الكبس والتشكيل اللدن$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-5$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 1, $kb$paragraph$kb$, $kb$التشكيل: الصب والكبس والتشكيل اللدن › الصب بالمعلق$kb$, $kb$في الصب ينتقل الماء من المعلق إلى القالب المسامي وتتكون طبقة جسم متزايدة السُمك. يتأثر ذلك بامتصاص القالب ولزوجة المعلق وتوزيع الحبيبات ودرجة الحرارة وحالة القالب.$kb$, $kb$fbb8f99d9ee76e4bf72812d06621f4aff57ab39b$kb$),
  (2, 1, $kb$list$kb$, $kb$التشكيل: الصب والكبس والتشكيل اللدن › الصب بالمعلق$kb$, $kb$- الكثافة النوعية مؤشر لتركيز المواد الصلبة، لكنها لا تصف الانسياب وحدها.
- اللزوجة يجب قياسها بأداة وطريقة ودرجة حرارة وزمن راحة محددين.
- الثيكسوتروبية هي تغير بنية المعلق ولزوجته مع القص والراحة.
- زمن الصب والسحب يرتبط بسُمك القطعة ورطوبة القالب وامتصاصه.$kb$, $kb$5b0cc0d1f6be1e3921b0758b0e73cf550b61b0cc$kb$),
  (3, 2, $kb$paragraph$kb$, $kb$التشكيل: الصب والكبس والتشكيل اللدن › الكبس والتشكيل اللدن$kb$, $kb$في الكبس تؤثر رطوبة الحبيبات وتوزيعها وقابليتها للانضغاط وتوزيع الضغط والاحتكاك في كثافة القطعة الخضراء. اختلاف الكثافة داخل القطعة قد يظهر لاحقًا كتفاوت انكماش أو تشوه أو تشقق. أما التشكيل اللدن فيتطلب اتساق الرطوبة واللدونة ومقاومة التمزق وتقليل الهواء المحبوس.$kb$, $kb$bbf891012e53ea3b81aae9e65ae05320a17a3f33$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-5$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-5$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-6: التجفيف والانكماش
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-6$kb$, 6, $kb$التجفيف والانكماش$kb$, 5, 9
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-6$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$التجفيف والانكماش$kb$, $kb$التجفيف انتقال للرطوبة من داخل الجسم إلى السطح ثم إلى الهواء. أثناء خروج الماء يحدث انكماش؛ وإذا اختلف معدل التجفيف بين السطح والداخل أو بين أجزاء القطعة تتولد إجهادات قد تسبب تشققات أو التواء.$kb$, $kb$61008891be0352a8d7baec44eb322145e507b90e$kb$),
  (2, 0, $kb$list$kb$, $kb$التجفيف والانكماش$kb$, $kb$- اضبط درجة الحرارة وسرعة الهواء والرطوبة النسبية معًا.
- تجنب التفاوت بين الحواف والقاعدة والجدران السميكة.
- استخدم قياس الوزن أو الرطوبة لتحديد نهاية التجفيف.
- راعِ المقابض والانتقالات الهندسية والسماكات المختلفة لأنها أكثر حساسية لتفاوت التجفيف.$kb$, $kb$477ceff5779f4df2c30bf8fb3281e9c21d856c5a$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-6$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-6$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 2;

-- ---- ch-7: الحريق والتحولات الحرارية
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-7$kb$, 7, $kb$الحريق والتحولات الحرارية$kb$, 6, 10
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-7$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$الحريق والتحولات الحرارية$kb$, $kb$الحريق سلسلة تفاعلات فيزيائية وكيميائية تتأثر بمعدل التسخين والزمن والجو وحجم القطعة وتركيب الجسم وتوزيع الحرارة.$kb$, $kb$fa21122f53fc4f4f8535def5c8b2df6d8c5ed47b$kb$),
  (2, 0, $kb$table$kb$, $kb$الحريق والتحولات الحرارية$kb$, $kb$| مرحلة عامة | ما قد يحدث | مخاطر محتملة |
| --- | --- | --- |
| إزالة الرطوبة | خروج الماء الحر | بخار محبوس أو تشقق عند التسخين غير الملائم |
| تحولات الطينات | فقد الماء البنيوي وتغير البنية المعدنية | تفاعلات غير مكتملة بحسب الخام والبرنامج |
| احتراق وتحلل | خروج غازات ومواد متطايرة | قلب أسود أو فقاعات |
| التلبيد وتكوين الأطوار | انتشار وتفاعل وتكوين أطوار جديدة | تفاوت النضج |
| التزجج | تكوين طور سائل وانخفاض المسامية | تشوه أو انتفاخ عند الإفراط |
| التبريد | تصلب الزجاج وتغيرات حرارية | إجهادات وشروخ |$kb$, $kb$17a0d0acef3a9677653533fb88689fc59b5f8076$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$الحريق والتحولات الحرارية$kb$, $kb$قد يتكون الموليت وطور زجاجي في أجسام بورسلينية كثيرة، لكن الأطوار الفعلية ونسبها تعتمد على التركيب والحريق. تُقيّم درجة النضج بمجموعة مؤشرات: الامتصاص والانكماش والكثافة والتشوه واللون.$kb$, $kb$6d5c5003db3cbeffb8245a560c70c1ce82f34bf4$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-7$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-7$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-8: الأفران ومنحنيات الحريق
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-8$kb$, 8, $kb$الأفران ومنحنيات الحريق$kb$, 6, 11
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-8$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$الأفران ومنحنيات الحريق$kb$, $kb$منحنى الحريق يصف الزمن ودرجة الحرارة، لكنه لا يضمن أن كل موضع في الفرن تلقى التاريخ الحراري نفسه. تؤثر الحمولة ومواقع القطع وسرعة الغازات وحالة العزل والشعلات في التجانس.$kb$, $kb$78d2d7836638a0511edfbedb2fcc7aaed7008985$kb$),
  (2, 0, $kb$list$kb$, $kb$الأفران ومنحنيات الحريق$kb$, $kb$- سجل رقم الفرن والدورة والتاريخ ونوع الحريق.
- سجل توزيع العربات والرفوف والقطع ومواقع عينات الاختبار.
- تحقق من أجهزة القياس ومعايرتها ومواقعها.
- سجل مراحل التسخين والتبريد وأزمنة الدورة والقراءات.
- اربط نتائج العينات بموقعها داخل الحمولة.$kb$, $kb$90e991fe789fb248b0601d05f1e8786a2a659202$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$الأفران ومنحنيات الحريق$kb$, $kb$العمل الحراري Heatwork يتأثر بالزمن والحرارة؛ لذلك قد تختلف نتائج النضج رغم تشابه قراءة القمة إذا اختلف زمن التعرض أو معدل التسخين. تستخدم وسائل قياس مناسبة مثل مخاريط قياس الحرارة وفق إجراءات فنية معتمدة.$kb$, $kb$209d31dd61e42f0ccee4815c4fd524d44cfcdaad$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-8$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-8$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-9: كيمياء وتكنولوجيا الجليز
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-9$kb$, 9, $kb$كيمياء وتكنولوجيا الجليز$kb$, 7, 12
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-9$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$كيمياء وتكنولوجيا الجليز$kb$, $kb$الجليز طبقة زجاجية أو زجاجية-بلورية تتكون على سطح الجسم بالحريق. يضم عادةً مواد تكوّن الشبكة الزجاجية ومواد تعدلها ومكونات وسيطة، وقد يضم مواد معتمة أو ملونة.$kb$, $kb$bef9e0bbcebba7ad7fd58288ba60d18640e384fb$kb$),
  (2, 0, $kb$table$kb$, $kb$كيمياء وتكنولوجيا الجليز$kb$, $kb$| المجموعة | الدور العام | تنبيه |
| --- | --- | --- |
| SiO2 | مكوّن رئيسي لشبكة الزجاج | تأثيره يتغير مع بقية الأكاسيد |
| Al2O3 | يساعد على ثبات الشبكة ومقاومة الجريان | قد يرفع اللزوجة بحسب النظام |
| Na2O وK2O | معدلات للشبكة وصهارات قلوية | تؤثر في التمدد والنضج |
| CaO وMgO | معدلات تؤثر في النضج والخواص | ليستا بديلين متطابقين |
| B2O3 | قد يساعد على الانصهار | يحتاج ضبطًا وفق نظام الجليز |
| ZrO2 أو SnO2 | مواد معتمة في أنظمة مناسبة | الكفاءة تتأثر بالتوزيع والحريق |$kb$, $kb$8ff0afda8b4779ce95efd7eb2ee5bbf16978e1e4$kb$),
  (3, 0, $kb$list$kb$, $kb$كيمياء وتكنولوجيا الجليز$kb$, $kb$- وزن الخامات مع تصحيح الرطوبة عند الحاجة.
- الطحن حتى توزيع حبيبي مناسب دون تلوث.
- قياس الكثافة واللزوجة والبقايا على المنخل.
- مراقبة الترسيب وإعادة التشتيت وزمن الراحة.
- تسجيل رقم التشغيلة وتاريخ التحضير ونتائج الاختبار.$kb$, $kb$d599c41044bae3f9ee7b27c857e398725df0768c$kb$),
  (4, 0, $kb$paragraph$kb$, $kb$كيمياء وتكنولوجيا الجليز$kb$, $kb$الكثافة واللزوجة خاصيتان مختلفتان؛ قد يتساوى معلقان في الكثافة ويختلفان في الانسياب بسبب حجم الحبيبات والأملاح والمواد المضافة.$kb$, $kb$c2d42dda213b042cfdc1e4d5989e94363478d8bb$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-9$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-9$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 4;

-- ---- ch-10: حساب التركيبات وخواص الجليز
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-10$kb$, 10, $kb$حساب التركيبات وخواص الجليز$kb$, 7, 13
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-10$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$حساب التركيبات وخواص الجليز$kb$, $kb$يجب التفريق بين حساب النسب الوزنية للخامات وحساب الصيغة المولية للأكاسيد. صيغة Seger أو Unity Molecular Formula تعرض نسب الأكاسيد على أساس مولاري موحد لمجموعة الصهارات، وتساعد على مقارنة التركيبات لكنها لا تتنبأ وحدها بكل خواص الجليز.$kb$, $kb$7660a8edf1cabb532a6cd11781a42ffa19ec7086$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$حساب التركيبات وخواص الجليز$kb$, $kb$الفقد بالحريق LOI = (الوزن قبل الحريق − الوزن بعد الحريق) ÷ الوزن قبل الحريق × 100. يجب تحديد ظروف الاختبار لأن النتيجة تتأثر بالحرارة والزمن والجو.$kb$, $kb$faf4c6f01bcf142945152b97a03869f794504c7d$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$حساب التركيبات وخواص الجليز$kb$, $kb$في تطوير الجليز، احتفظ بعينة مرجعية وسجل سماكة التطبيق وطريقته والحريق. لا تنسب تغير اللون إلى التركيب وحده؛ فقد يتأثر بالسماكة والسطح والجو وتفاعل الصبغة.$kb$, $kb$5072e0366005212dc3331aed52976b7bdbac8d20$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-10$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-10$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-11: الصبغات والألوان
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-11$kb$, 11, $kb$الصبغات والألوان$kb$, 8, 14
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-11$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$الصبغات والألوان$kb$, $kb$الصبغة السيراميكية Ceramic Stain مادة ملونة مصممة لتحمل ظروف حرارية محددة نسبيًا، لكنها ليست مضمونة الثبات في كل جليز أو جو أو دورة. قد تتفاعل مع الجليز أو تذوب جزئيًا أو يتغير لونها.$kb$, $kb$14c9e1a41244db95e53a13dc26933f552ea50ced$kb$),
  (2, 0, $kb$list$kb$, $kb$الصبغات والألوان$kb$, $kb$- نوع الصبغة وبنيتها وتركيبها.
- درجة الحرارة ومعدل التسخين وزمن التعرض.
- جو الأكسدة أو الاختزال.
- كيمياء الجليز والصهارات والقلوية والبورون.
- حجم الحبيبات والتشتت والتركيز والسُمك.
- خلفية الجسم والشفافية والإضاءة وطريقة القياس.$kb$, $kb$c7cf356a5e557ee416015b5bc180b8484e0b7366$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$الصبغات والألوان$kb$, $kb$عند توفر جهاز قياس لوني، استخدم CIELAB وسجل L* وa* وb* وظروف القياس. المقارنة البصرية وحدها أقل موضوعية بين الورديات ومصادر الإضاءة.$kb$, $kb$d5c5aed8a9f6e01a253fdd78807944b28cc94641$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-11$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-11$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-12: تكنولوجيا الزخرفة
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-12$kb$, 12, $kb$تكنولوجيا الزخرفة$kb$, 9, 15
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-12$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تكنولوجيا الزخرفة$kb$, $kb$تختلف تقنيات الزخرفة بحسب موضع اللون بالنسبة للجليز ودرجة الحريق: تحت الجليز Underglaze، وضمن طبقة الجليز، وفوق الجليز Overglaze. تشمل التقنيات الطباعة بالشاشة والوسادات والديكالات والنقل والتطبيق اليدوي.$kb$, $kb$c2bbe73ce8d1037f512e71f4ed2d9078a898f90c$kb$),
  (2, 0, $kb$list$kb$, $kb$تكنولوجيا الزخرفة$kb$, $kb$- توافق وسيط الطباعة مع السطح ومرحلة الحريق.
- دقة التسجيل والمحاذاة وتكرارية اللون.
- نظافة السطح من الزيوت والغبار.
- سُمك طبقة اللون وتجانسها وثبات الحواف.
- ملاءمة دورة الحريق لنظام اللون والجليز.
- اختبارات الالتصاق والغسيل والمقاومة حسب الاستخدام.$kb$, $kb$589bdb56e6907f385d3b4562e66438a0e8687c00$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$تكنولوجيا الزخرفة$kb$, $kb$وصف الديكور بأنه فوق الجليز لا يثبت وحده سلامته لملامسة الغذاء؛ يجب اختبار المنتج النهائي وفق المتطلبات ذات الصلة.$kb$, $kb$28f17fe2b2041cdf8b780fd9027a7bcd882d6400$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-12$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-12$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-13: توافق الجسم والجليز والتمدد الحراري
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-13$kb$, 13, $kb$توافق الجسم والجليز والتمدد الحراري$kb$, 10, 16
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-13$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$توافق الجسم والجليز والتمدد الحراري$kb$, $kb$عندما تبرد طبقة الجليز بعد أن تصبح صلبة ومرتبطة بالجسم، يحاول كل منهما الانكماش وفق معامل تمدده. الفرق يولد إجهادات متبقية.$kb$, $kb$cd50a7ce25af122d5e9231b88cd8a8b18abac9b7$kb$),
  (2, 0, $kb$table$kb$, $kb$توافق الجسم والجليز والتمدد الحراري$kb$, $kb$| الظاهرة | الوصف | اتجاه الفحص |
| --- | --- | --- |
| Crazing | شبكة شروخ دقيقة في الجليز، ترتبط غالبًا بإجهاد شد | قياس التمدد والتركيب والسُمك وتاريخ الحريق |
| Shivering | تقشير أو تطاير عند الحواف | فحص التمدد والتصميم والحواف والسُمك |
| Dunting | شروخ تبريد في الجسم | مراجعة التدرج الحراري والتصميم |
| ضعف الالتصاق | ارتباط غير كافٍ بين الجليز والجسم | فحص النظافة والتفاعل السطحي والتركيب والحريق |$kb$, $kb$e821f2bb2662d8c4006bdec8299e740e50abf460$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$توافق الجسم والجليز والتمدد الحراري$kb$, $kb$عمومًا قد يزيد خطر الكرازينج عندما يكون تمدد الجليز أعلى كثيرًا من الجسم، وقد يزيد خطر التقشير عندما يكون أقل كثيرًا. لكن الحكم النهائي يحتاج قياسًا؛ فالسُمك والهندسة والتحولات البلورية تؤثر أيضًا.$kb$, $kb$9c2815c005b81d4f175f0361988710b1d578411f$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-13$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-13$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-14: عيوب الإنتاج وتحليل الأسباب
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-14$kb$, 14, $kb$عيوب الإنتاج وتحليل الأسباب$kb$, 11, 17
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-14$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$عيوب الإنتاج وتحليل الأسباب$kb$, $kb$لا يبدأ حل العيب بتغيير الوصفة مباشرة. ابدأ بوصفه وتحديد موضعه وتكراره ومرحلة ظهوره، ثم قارن الخامات والدفعات والورديات والقوالب والفرن.$kb$, $kb$36e1ce5ecb9c70b6401510ca70fbfcd3f5a4df10$kb$),
  (2, 0, $kb$table$kb$, $kb$عيوب الإنتاج وتحليل الأسباب$kb$, $kb$| العيب | أسباب محتملة | بيانات للتشخيص |
| --- | --- | --- |
| Pinholes | غازات، سطح غير نظيف، نضج أو لزوجة غير مناسبين | صور مكبرة، دورة الحريق، السماكة، امتصاص الجسم |
| Blisters | احتباس غاز أو انصهار غير متوازن | مقطع عرضي، توزيع العيب، زمن وحرارة الحريق |
| Crawling | ضعف التصاق أو تلوث أو سماكة/انكماش طبقة مرتفع | نظافة السطح، لزوجة الجليز، تجفيف الطبقة |
| شروخ التجفيف | تدرج رطوبة أو تفاوت سُمك | الرطوبة والزمن وسرعة الهواء |
| التشوه | نضج زائد أو دعم غير مناسب أو تصميم غير متزن | الحمولة ووضع القطعة ومؤشرات النضج |
| اختلاف اللون | خامة أو صبغة أو سماكة أو جو أو توزيع حرارة | التشغيلة وقياس اللون وموقع القطعة |
| القلب الأسود | احتراق غير مكتمل لمواد عضوية/كربونية | مقطع الجسم وتحليل الخام ومنحنى الحريق |$kb$, $kb$1863589fc47245b38c908ef81cf3c6a987b32da2$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$عيوب الإنتاج وتحليل الأسباب$kb$, $kb$هذه قائمة فرضيات وليست تشخيصًا آليًا. لا يعتمد السبب الجذري إلا بعد اختبار يميز بين الفرضيات أو إثبات اختفاء العيب بعد معالجة السبب.$kb$, $kb$51783a4ba99fd4d5b375b42d56f406a7a9dc4633$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-14$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-14$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-15: الاختبارات المعملية
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-15$kb$, 15, $kb$الاختبارات المعملية$kb$, 12, 18
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-15$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$table$kb$, $kb$الاختبارات المعملية$kb$, $kb$| الاختبار | الغرض | ما يوثق |
| --- | --- | --- |
| الرطوبة | تحديد الماء في الخام أو العجينة | كتلة البداية والنهاية وظروف التجفيف |
| البقايا على المنخل | متابعة الطحن والتكتل | فتحة المنخل وطريقة الاختبار |
| الكثافة النوعية | متابعة تركيز المعلق | الحرارة وأداة القياس |
| اللزوجة | تقييم الانسياب | الجهاز والسرعة والزمن والحرارة |
| الانكماش الخطي | تغير الأبعاد | الأبعاد قبل وبعد وظروف الحريق |
| امتصاص الماء | تقدير المسامية المفتوحة | تحضير العينة وطريقة الوزن والغمر |
| الكثافة الظاهرية | مقارنة التراص والمسامية | طريقة القياس وحالة العينة |
| التمدد الحراري | التغير البعدي مع الحرارة | منحنى القياس ومعدل التسخين |
| اللون والبياض | مقارنة المظهر موضوعيًا | الجهاز والإضاءة والسُمك |
| الصدمة الحرارية | تقييم تحمل تغير الحرارة | اتباع طريقة معيارية محددة |$kb$, $kb$a05558431eb8ab7e0d8926d26584a060d485545f$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$الاختبارات المعملية$kb$, $kb$يجب التمييز بين اختبار داخلي وطريقة معيارية. إذا كان الاختبار للمطابقة، سجل رقم المعيار وإصداره ونفذ النص المعتمد.$kb$, $kb$47bbee47e1a79863b69131b411411810884f36ca$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-15$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-15$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 2;

-- ---- ch-16: ضبط الجودة وإدارة القياس
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-16$kb$, 16, $kb$ضبط الجودة وإدارة القياس$kb$, 13, 19
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-16$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$ضبط الجودة وإدارة القياس$kb$, $kb$نظام الجودة يجعل العملية قابلة للتكرار. لكل خاصية مهمة عرّف طريقة القياس وتكراره وحجم العينة وحدود القبول والمسؤول وإجراء التعامل مع عدم المطابقة.$kb$, $kb$0cfecafd5973d7375bb61afa1c1d8031cea896bb$kb$),
  (2, 0, $kb$list$kb$, $kb$ضبط الجودة وإدارة القياس$kb$, $kb$- عاير الأجهزة وتحقق دوريًا من صلاحيتها.
- استخدم تعريفًا موحدًا للعيوب وأكوادًا وصورًا مرجعية.
- اربط النتائج بأرقام دفعات الخام والجسم والجليز والفرن والوردية.
- افصل المنتج المحجوز عن المقبول حتى صدور القرار.
- تابع الاتجاهات والتشتت، لا المتوسط وحده.
- استخدم أدوات الضبط الإحصائي عند توفر بيانات كافية وعملية مستقرة.$kb$, $kb$b2ee56fba443bcad1c048e611facb77c8561a6bd$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$ضبط الجودة وإدارة القياس$kb$, $kb$حدود الضبط الإحصائي لا تستبدل المواصفة الفنية أو متطلبات العميل.$kb$, $kb$ccf6ce5f65a0ce30f32487f0ef0ee0cd9ffc3e3f$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-16$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-16$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-17: هندسة أدوات المائدة
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-17$kb$, 17, $kb$هندسة أدوات المائدة$kb$, 14, 20
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-17$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$هندسة أدوات المائدة$kb$, $kb$تصميم أدوات المائدة يجمع الشكل والوظيفة وقابلية التصنيع والتنظيف والمتانة وسلامة الاستخدام. تؤثر سماكة الجدار وتدرجها ونصف قطر الانتقالات واستواء القاعدة وهندسة الحافة والمقبض في التشكيل والتجفيف والحريق.$kb$, $kb$9245f0e08f57ac9d8074fe1eac6a9730f0f0ca8e$kb$),
  (2, 0, $kb$list$kb$, $kb$هندسة أدوات المائدة$kb$, $kb$- الحافة: تجانس وراحة وخلو من النتوءات والشروخ.
- القاعدة: الاستواء والثبات وعدم خدش السطح.
- المقابض: اختبار منطقة الاتصال ومقاومة الاستخدام.
- الأكواب والأوعية: مراقبة اختلاف السُمك وتوزيع الكتلة.
- الزخرفة: مراجعة مناطق ملامسة الفم والطعام ومتطلبات الهجرة.
- التعبئة: منع الصدمات والاحتكاك أثناء النقل.$kb$, $kb$2378f4cd29d1f414ce4b6c9898a9158fd78f25e6$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$هندسة أدوات المائدة$kb$, $kb$التصميم الجيد يراعي القالب وزوايا السحب والانكماش وطريقة التشكيل والرص داخل الفرن، وليس الشكل النهائي فقط.$kb$, $kb$1748363048de2f952afa84b24ef1f7a27769d445$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-17$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-17$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- ch-18: تصميم التجارب والتحليل الإحصائي
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-18$kb$, 18, $kb$تصميم التجارب والتحليل الإحصائي$kb$, 15, 21
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-18$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تصميم التجارب والتحليل الإحصائي$kb$, $kb$التجربة الجيدة تجيب عن سؤال محدد. اكتب الفرضية والعامل الذي ستغيره والنتيجة التي ستقيسها والعوامل التي ستثبتها وعدد التكرارات وطريقة اتخاذ القرار.$kb$, $kb$2e2af4c5165c6c04cf38a59b7c0d65ab9de67518$kb$),
  (2, 0, $kb$table$kb$, $kb$تصميم التجارب والتحليل الإحصائي$kb$, $kb$| حقل سجل التجربة | المطلوب |
| --- | --- |
| المعرف والتاريخ | رقم فريد وتاريخ ومسؤول |
| السؤال والفرضية | ما الذي نريد التحقق منه؟ |
| الخامات | المورد وأرقام التشغيلات والتحاليل |
| المتغيرات والثوابت | ما تغير وما تم تثبيته |
| التحضير | الأوزان والماء والطحن والخلط والتطبيق |
| الحريق | الفرن والدورة والموقع والقراءات |
| النتائج | قياسات رقمية وصور وملاحظات |
| الاستنتاج | ما تدعمه النتائج وما لا تثبته |
| الحالة | مسودة، قيد المراجعة، معتمدة، مرفوضة |$kb$, $kb$eca66387865f0da81237a5c110d0f0011ae04fb6$kb$),
  (3, 0, $kb$list$kb$, $kb$تصميم التجارب والتحليل الإحصائي$kb$, $kb$- استخدم عينة مرجعية وعينات مكررة عند الإمكان.
- غيّر عاملًا واحدًا في التجارب الاستكشافية عندما يكون ذلك مناسبًا.
- عند تعدد العوامل، يمكن استخدام DOE لدراسة التأثيرات والتفاعلات.
- لا تتحول التجربة إلى خبرة معتمدة إلا بعد مراجعة وموافقة صريحة.
- احتفظ بالنسخة الأصلية وسجل التعديلات وهوية المعتمد وتاريخ الاعتماد.$kb$, $kb$6fb6593140e50d27e99232a37ce567acdcee151b$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-18$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-18$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 3;

-- ---- x-0fca4e26: قاموس عربي–إنجليزي
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-0fca4e26$kb$, null, $kb$قاموس عربي–إنجليزي$kb$, 16, 22
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-0fca4e26$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$table$kb$, $kb$قاموس عربي–إنجليزي$kb$, $kb$| العربية | English |
| --- | --- |
| البورسلين | Porcelain |
| الجسم | Body |
| الجليز | Glaze |
| الكاولين | Kaolin |
| الفلسبار | Feldspar |
| الكوارتز | Quartz |
| المعلق | Slip / Slurry |
| الكثافة النوعية | Specific Gravity |
| اللزوجة | Viscosity |
| الثيكسوتروبية | Thixotropy |
| الانكماش | Shrinkage |
| امتصاص الماء | Water Absorption |
| الفقد بالحريق | Loss on Ignition |
| التلبيد | Sintering |
| التزجج | Vitrification |
| الموليت | Mullite |
| الطور الزجاجي | Glass Phase |
| التمدد الحراري | Thermal Expansion |
| التشققات الشعرية | Crazing |
| التقشير | Shivering |
| ثقوب الدبوس | Pinholes |
| انكماش الجليز | Crawling |
| الفقاعات | Blistering |
| القلب الأسود | Black Core |
| الصدمة الحرارية | Thermal Shock |
| تحت الجليز | Underglaze |
| فوق الجليز | Overglaze |
| الزخرفة | Decoration |
| الصبغة السيراميكية | Ceramic Stain |
| ضبط الجودة | Quality Control |
| تصميم التجارب | Design of Experiments |
| تحليل الأسباب الجذرية | Root Cause Analysis |
| حيود الأشعة السينية | X-ray Diffraction |
| فلورية الأشعة السينية | X-ray Fluorescence |$kb$, $kb$4cc4d63a0f5559ae4039f9c4ec59b927fa4d7c1e$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-0fca4e26$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-0fca4e26$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 1;

-- ---- x-b8d0d960: المراجع والمعايير الأساسية
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-b8d0d960$kb$, null, $kb$المراجع والمعايير الأساسية$kb$, 16, 23
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-b8d0d960$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$list$kb$, $kb$المراجع والمعايير الأساسية$kb$, $kb$- ISO 5644:2024 — Porcelain Tableware: Specification and test method — https://www.iso.org/standard/81502.html
- ISO 6486-1:2019 — طريقة اختبار انطلاق الرصاص والكادميوم من الأدوات الخزفية الملامسة للغذاء — https://www.iso.org/standard/67561.html
- ISO/TC 166 — لجنة معايير الأدوات الخزفية والزجاجية الملامسة للغذاء — https://www.iso.org/committee/53606/x/catalogue/p/0/u/1/w/0/d/0
- Ullmann’s Encyclopedia — Ceramics, General Survey: الخامات والتشكيل والحريق والجليز والاختبارات — https://onlinelibrary.wiley.com/doi/10.1002/14356007.a06_001
- Porcelain versus Porcelain Stoneware: Sintering Kinetics, Phase Evolution, and Vitrification Paths (2023) — https://www.mdpi.com/1996-1944/16/1/171
- NIST — Microstructure of Porcelain — https://nvlpubs.nist.gov/nistpubs/Legacy/MP/nbsmiscellaneouspub257.pdf
- European Commission BREF — Ceramic Manufacturing Industry — https://aida.ineris.fr/sites/default/files/documents-bref/cer_bref_1206.pdf$kb$, $kb$2e1d062c70d1b71dbae796c4694bd58fd0e892f4$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-b8d0d960$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-b8d0d960$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 1;

-- ---- x-607e10b3: متطلبات سلامة المنتج
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-607e10b3$kb$, null, $kb$متطلبات سلامة المنتج$kb$, 14, 24
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-607e10b3$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$متطلبات سلامة المنتج$kb$, $kb$لا يُعتمد المنتج لملامسة الغذاء اعتمادًا على المظهر أو نوع الجليز فقط. راجع متطلبات السوق المستهدف، ونفذ اختبارات الهجرة الكيميائية، ومنها الرصاص والكادميوم عند انطباقها. ISO 5644:2024 يحدد إطارًا لمواصفات وطرق اختبار أدوات المائدة البورسلينية، ويرتبط بمراجع منها ISO 6486-1 وISO 6486-2. الجزء الأول يحدد طريقة اختبار، أما حدود القبول فتراجع في الجزء الخاص بالحدود والتشريعات المعمول بها.$kb$, $kb$d8230f79be7dee0751f42f9d75fb5db2232728f3$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$متطلبات سلامة المنتج$kb$, $kb$أي توصية تشغيلية يجب اختبارها على نطاق معمل آمن وتحت إشراف المختصين ووفق تعليمات المصنع، خصوصًا عمليات الأفران والمعدات الصناعية والمواد الكيميائية.$kb$, $kb$9c80c9b8dd8ee7d6d1d096ad9990061e3536e236$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-607e10b3$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-607e10b3$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 2;

-- ---- x-b484feca: خطة إدخال الموسوعة إلى MAS LAB
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-b484feca$kb$, null, $kb$خطة إدخال الموسوعة إلى MAS LAB$kb$, 16, 25
from public.lab_kb_documents d where d.doc_key = $kb$vol1$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-b484feca$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$list$kb$, $kb$خطة إدخال الموسوعة إلى MAS LAB$kb$, $kb$- قسّم كل باب إلى مقالات قصيرة بمعرف ثابت وعنوان وملخص ومحتوى ومصطلحات ووسوم.
- أضف المصدر ونوع الدليل وتاريخ المراجعة وإصدار المحتوى لكل مقالة.
- صنّف المحتوى: مرجع علمي، إجراء داخلي، تفسير هندسي، فرضية، أو خبرة مصنع معتمدة.
- فعّل البحث بالعربية والإنجليزية والمرادفات.
- اربط المقالات بالتجارب والعيوب والخامات والاختبارات دون تحويل التجارب غير المعتمدة إلى حقائق.
- احفظ النسخ وسجل التعديلات ولا تحذف بيانات MAS LAB الحالية.
- لا تدّعِ تحليل الصور الذكي في المرحلة الأولى دون نموذج رؤية محلي أو خدمة مصرح بها.$kb$, $kb$3f639cea748ff7c1bd1aa1da61ee2f2f5d4a0d01$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-b484feca$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-b484feca$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$)
  and k.seq > 1;

-- ---- القاموس (مصطلحات عربي/إنجليزي)
insert into public.lab_kb_terms (term_key, ar, en, note, source_chapter_key, document_id)
select v.term_key, v.ar, v.en, v.note, v.ck, (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$) from (values
  ($kb$08fc58986fef357e$kb$, $kb$البورسلين$kb$, $kb$Porcelain$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$b6514ea66d53f166$kb$, $kb$الجسم$kb$, $kb$Body$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$a374478bc1eb53a3$kb$, $kb$الجليز$kb$, $kb$Glaze$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$d60ed9913c77cafe$kb$, $kb$الكاولين$kb$, $kb$Kaolin$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$f0c10be09cdeb0c6$kb$, $kb$الفلسبار$kb$, $kb$Feldspar$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$bd2d221c146c581f$kb$, $kb$الكوارتز$kb$, $kb$Quartz$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$86e92e6ba013424c$kb$, $kb$المعلق$kb$, $kb$Slip / Slurry$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$f3660e05da805ba8$kb$, $kb$الكثافة النوعية$kb$, $kb$Specific Gravity$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$b07d3ea3b0d560b5$kb$, $kb$اللزوجة$kb$, $kb$Viscosity$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$99d25070614c7677$kb$, $kb$الثيكسوتروبية$kb$, $kb$Thixotropy$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$8b9b71bec4a3f1a1$kb$, $kb$الانكماش$kb$, $kb$Shrinkage$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$748523a4f5a8ebba$kb$, $kb$امتصاص الماء$kb$, $kb$Water Absorption$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$04899776452a22e8$kb$, $kb$الفقد بالحريق$kb$, $kb$Loss on Ignition$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$6e897868765b26dc$kb$, $kb$التلبيد$kb$, $kb$Sintering$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$72c9a573609162ac$kb$, $kb$التزجج$kb$, $kb$Vitrification$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$ad7869bbbe1db623$kb$, $kb$الموليت$kb$, $kb$Mullite$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$e3e4c1da29641c06$kb$, $kb$الطور الزجاجي$kb$, $kb$Glass Phase$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$2f55bc7314e9b4ee$kb$, $kb$التمدد الحراري$kb$, $kb$Thermal Expansion$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$6f7ae4a0ee0e3e55$kb$, $kb$التشققات الشعرية$kb$, $kb$Crazing$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$fb8e5fc66c0e35ae$kb$, $kb$التقشير$kb$, $kb$Shivering$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$af3997a8e06e4895$kb$, $kb$ثقوب الدبوس$kb$, $kb$Pinholes$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$0d9e641eb3c9c92a$kb$, $kb$انكماش الجليز$kb$, $kb$Crawling$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$dbe82b08c5c0ee80$kb$, $kb$الفقاعات$kb$, $kb$Blistering$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$35893c3e5c308ccf$kb$, $kb$القلب الأسود$kb$, $kb$Black Core$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$88a0d48fa20a621c$kb$, $kb$الصدمة الحرارية$kb$, $kb$Thermal Shock$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$c64a62fb7ccff8a8$kb$, $kb$تحت الجليز$kb$, $kb$Underglaze$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$190175b8f3a4deb0$kb$, $kb$فوق الجليز$kb$, $kb$Overglaze$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$1e735adc052790e2$kb$, $kb$الزخرفة$kb$, $kb$Decoration$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$ee06215001ff46ff$kb$, $kb$الصبغة السيراميكية$kb$, $kb$Ceramic Stain$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$b8c35b1553aed976$kb$, $kb$ضبط الجودة$kb$, $kb$Quality Control$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$259f25492604450b$kb$, $kb$تصميم التجارب$kb$, $kb$Design of Experiments$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$a6727d329a15b32b$kb$, $kb$تحليل الأسباب الجذرية$kb$, $kb$Root Cause Analysis$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$e3b471465847bcc4$kb$, $kb$حيود الأشعة السينية$kb$, $kb$X-ray Diffraction$kb$, null, $kb$x-0fca4e26$kb$),
  ($kb$470f444857ff7c67$kb$, $kb$فلورية الأشعة السينية$kb$, $kb$X-ray Fluorescence$kb$, null, $kb$x-0fca4e26$kb$)
) as v(term_key, ar, en, note, ck)
on conflict (term_key) do update set ar = excluded.ar, en = excluded.en, note = excluded.note;

-- ---- المراجع والمعايير
insert into public.lab_kb_sources (source_key, title, url, source_chapter_key, document_id)
select v.source_key, v.title, v.url, v.ck, (select id from public.lab_kb_documents where doc_key = $kb$vol1$kb$) from (values
  ($kb$8ef73334cf8304df$kb$, $kb$ISO 5644:2024 — Porcelain Tableware: Specification and test method$kb$, $kb$https://www.iso.org/standard/81502.html$kb$, $kb$x-b8d0d960$kb$),
  ($kb$d734d389b9ad41b5$kb$, $kb$ISO 6486-1:2019 — طريقة اختبار انطلاق الرصاص والكادميوم من الأدوات الخزفية الملامسة للغذاء$kb$, $kb$https://www.iso.org/standard/67561.html$kb$, $kb$x-b8d0d960$kb$),
  ($kb$14fe38146cd91d81$kb$, $kb$ISO/TC 166 — لجنة معايير الأدوات الخزفية والزجاجية الملامسة للغذاء$kb$, $kb$https://www.iso.org/committee/53606/x/catalogue/p/0/u/1/w/0/d/0$kb$, $kb$x-b8d0d960$kb$),
  ($kb$4da7d13ebed46a4a$kb$, $kb$Ullmann’s Encyclopedia — Ceramics, General Survey: الخامات والتشكيل والحريق والجليز والاختبارات$kb$, $kb$https://onlinelibrary.wiley.com/doi/10.1002/14356007.a06_001$kb$, $kb$x-b8d0d960$kb$),
  ($kb$448c4971db053b89$kb$, $kb$Porcelain versus Porcelain Stoneware: Sintering Kinetics, Phase Evolution, and Vitrification Paths (2023)$kb$, $kb$https://www.mdpi.com/1996-1944/16/1/171$kb$, $kb$x-b8d0d960$kb$),
  ($kb$f1a0767c8c2a8fb1$kb$, $kb$NIST — Microstructure of Porcelain$kb$, $kb$https://nvlpubs.nist.gov/nistpubs/Legacy/MP/nbsmiscellaneouspub257.pdf$kb$, $kb$x-b8d0d960$kb$),
  ($kb$0129df2f743febcf$kb$, $kb$European Commission BREF — Ceramic Manufacturing Industry$kb$, $kb$https://aida.ineris.fr/sites/default/files/documents-bref/cer_bref_1206.pdf$kb$, $kb$x-b8d0d960$kb$)
) as v(source_key, title, url, ck)
on conflict (source_key) do update set title = excluded.title, url = excluded.url;

-- ---- سجل الاستيراد
insert into public.lab_kb_import_jobs (doc_key, file_name, file_sha256, status, chapters_count, sections_count,
  chunks_count, tables_count, terms_count, sources_count, warnings)
values ($kb$vol1$kb$, $kb$MAS_LAB_Porcelain_Encyclopedia_AR_v1.docx$kb$, $kb$05e369f730f6ae2cdbb4367f025734843c7736a896e930e3207fa0751434cbc3$kb$, 'completed', 25, 27, 62, 9,
  34, 7, $kb$["غلاف المجلد (محتوى قبل أول عنوان): حُفظ كفصل 'front-0'", "رأس/تذييل صفحة غير مستخرج: «MAS LAB | موسوعة علوم وتكنولوجيا البورسلين | الإصدار الأول»"]$kb$::jsonb);

-- ---- اختبار الاكتمال: لو أي عدد غير مطابق يحدث خطأ ويتراجع الاستيراد كله
do $verify$
declare v_ch int; v_sec int; v_chunks int; v_tables int;
begin
  select count(*) into v_ch from public.lab_kb_chapters c join public.lab_kb_documents d on d.id = c.document_id
    where d.doc_key = $kb$vol1$kb$;
  select count(*) into v_sec from public.lab_kb_sections s join public.lab_kb_chapters c on c.id = s.chapter_id
    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = $kb$vol1$kb$;
  select count(*), count(*) filter (where k.kind = 'table') into v_chunks, v_tables
    from public.lab_kb_chunks k join public.lab_kb_chapters c on c.id = k.chapter_id
    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = $kb$vol1$kb$ and k.is_current;
  if v_ch <> 25 or v_sec <> 27 or v_chunks <> 62 or v_tables <> 9 then
    raise exception 'KB import mismatch: chapters %/25, sections %/27, chunks %/62, tables %/9', v_ch, v_sec, v_chunks, v_tables;
  end if;
end $verify$;

commit;
