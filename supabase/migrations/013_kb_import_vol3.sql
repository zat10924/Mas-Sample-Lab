-- =====================================================================
-- استيراد موسوعة علوم وتكنولوجيا البورسلين — المجلد الثالث
-- الملف الأصلي: MAS_LAB_Porcelain_Encyclopedia_Vol3_AR.docx  (SHA-256: 29c1afdc19160b4b…)
-- مولَّد آليًا بواسطة tools/kb_import/build_kb.py — آمن لإعادة التشغيل (بدون تكرار).
-- يتطلب تشغيل 009_kb_schema.sql أولًا. لا يمسّ أي جدول قديم.
-- =====================================================================
begin;

insert into public.lab_kb_documents (doc_key, title, edition, volume, file_name, file_sha256)
values ($kb$vol3$kb$, $kb$موسوعة علوم وتكنولوجيا البورسلين — المجلد الثالث$kb$, $kb$v1$kb$, 3, $kb$MAS_LAB_Porcelain_Encyclopedia_Vol3_AR.docx$kb$, $kb$29c1afdc19160b4b4ce473546f0ab989147facbe0c0e6dcce2874fe8477c024f$kb$)
on conflict (doc_key) do update set title = excluded.title, edition = excluded.edition,
  file_name = excluded.file_name, file_sha256 = excluded.file_sha256, imported_at = now();

-- ---- front-0: غلاف المجلد
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$front-0$kb$, null, $kb$غلاف المجلد$kb$, 16, 1
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$موسوعة MAS LAB لعلوم وتكنولوجيا البورسلين$kb$, $kb$7ae5dac472628b84a243cf26c83712a9012e838d$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$المجلد الثالث: الحسابات المتقدمة وهندسة الجليز والأفران وتحليل العيوب$kb$, $kb$7b902ac5267db619baceb35e7a9d5dc061afd3e8$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$إصدار تعليمي تخصصي – نوفمبر 2026$kb$, $kb$c0965fe8fabe82502e892450efe3619ca4a93a97$kb$),
  (4, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$هذا مرجع منهجي للتعلم وبناء قرارات معملية قابلة للتتبع. الأمثلة تعليمية وليست وصفات إنتاج. تعتمد النتائج على الخامات الفعلية والتحليل والنعومة وشكل المنتج والفرن ومنحنى الحريق ومتطلبات الاستخدام.$kb$, $kb$1ac6deb64d0b8f9fdea5150a205baa3735263a1b$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 4;

-- ---- x-e9d78025: كيفية استخدام المجلد
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-e9d78025$kb$, null, $kb$كيفية استخدام المجلد$kb$, 16, 2
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-e9d78025$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$list$kb$, $kb$كيفية استخدام المجلد$kb$, $kb$- افصل بين القياس والتفسير والقرار.
- سجل مصدر كل معلومة: مرجع علمي، تفسير هندسي، فرضية، تجربة مصنع، أو توصية غير متحققة.
- لا تعمم نتيجة تجربة واحدة على خامة أو منتج أو فرن مختلف.
- احتفظ بالتجارب الفاشلة والمتعارضة؛ فهي جزء من تاريخ التعلم.$kb$, $kb$ec9cd092516d6c836ee7808defe1a032902cbf72$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-e9d78025$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-e9d78025$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 1;

-- ---- ch-33: قراءة XRF وXRD والتحليل الكيميائي
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-33$kb$, 33, $kb$قراءة XRF وXRD والتحليل الكيميائي$kb$, 2, 3
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$مراجعة تقرير XRF$kb$),
  (2, $kb$فقد الحريق LOI$kb$),
  (3, $kb$حدود التفسير$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-33$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$قراءة XRF وXRD والتحليل الكيميائي$kb$, $kb$XRF يقيس العناصر ويعرضها غالبًا كأكاسيد مكافئة مثل SiO₂ وAl₂O₃ وFe₂O₃ وCaO وMgO وNa₂O وK₂O. لا يعني ذلك أن هذه الأكاسيد موجودة حرة في الخام. أما XRD فيساعد على تحديد الأطوار البلورية مثل الكوارتز والفلسبارات والكاولينيت والميكا. الطريقتان متكاملتان.$kb$, $kb$a281277a932173c411479736635cda5e0c6b5a5c$kb$),
  (2, 1, $kb$table$kb$, $kb$قراءة XRF وXRD والتحليل الكيميائي › مراجعة تقرير XRF$kb$, $kb$| البند | ما يجب التحقق منه | سبب الأهمية |
| --- | --- | --- |
| هوية العينة | المصدر ورقم الدفعة والتاريخ | منع خلط الخامات |
| أساس النتائج | كما استلمت أم جافة أم مطبّعة | المقارنة الصحيحة |
| LOI | هل قيس فقد الحريق؟ وبأي ظروف؟ | فهم المواد المتطايرة |
| مجموع الأكاسيد | هل المجموع متوافق مع طريقة التقرير؟ | كشف النقص أو اختلاف الأساس |
| حدود الكشف | هل القيم النزرة موثوقة؟ | منع تفسير الضوضاء كحقيقة |
| تحضير العينة | الطحن والتجانس وطريقة التحضير | تمثيل العينة |$kb$, $kb$ce6890cdcb5dc78ae8a62e08a4b2746282c81c85$kb$),
  (3, 2, $kb$paragraph$kb$, $kb$قراءة XRF وXRD والتحليل الكيميائي › فقد الحريق LOI$kb$, $kb$الصيغة العامة: LOI % = ((الكتلة قبل الحريق − الكتلة بعد الحريق) ÷ الكتلة قبل الحريق) × 100. يجب تحديد أساس الكتلة قبل الاختبار، وظروف التجفيف والتسخين والجو. لا تقارن تقارير اختلفت فيها هذه الشروط دون توضيح.$kb$, $kb$095752a09558f0d185d76d48ead7dd84584ccc55$kb$),
  (4, 3, $kb$list$kb$, $kb$قراءة XRF وXRD والتحليل الكيميائي › حدود التفسير$kb$, $kb$- السيليكا الكلية لا تحدد وحدها كمية الكوارتز الحر.
- القلويات الكلية لا تتنبأ وحدها بسرعة التزجيج.
- الحديد الكلي لا يحدد اللون النهائي دون معرفة الجو وحالة الأكسدة والتفاعلات.
- XRD التقليدي قد لا يحدد الأطوار غير المتبلورة أو النسب الصغيرة بدقة.$kb$, $kb$f9370691667026fa1c266974a0efaf67af14d65b$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-33$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-33$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 4;

-- ---- ch-34: حسابات الجسم وموازنة الخامات
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-34$kb$, 34, $kb$حسابات الجسم وموازنة الخامات$kb$, 3, 4
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$تحويل الخلطة إلى أكاسيد$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-34$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$حسابات الجسم وموازنة الخامات$kb$, $kb$تبدأ الحسابات بتوحيد أساس الوزن: جاف أو كما استلمت. إذا كانت الرطوبة نسبة من الكتلة الرطبة: الكتلة الجافة = الكتلة الرطبة × (1 − نسبة الرطوبة). والكتلة الرطبة المطلوبة = الكتلة الجافة المستهدفة ÷ (1 − نسبة الرطوبة).$kb$, $kb$ebc7faa005cc9ef093b1235279d3ace6be2e9d22$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$حسابات الجسم وموازنة الخامات$kb$, $kb$مثال تعليمي: خام وزنه الرطب 100 كجم ورطوبته 8%؛ كتلته الجافة 92 كجم. لا تستخدم المثال كوزن تشغيل دون قياس رطوبة الدفعة.$kb$, $kb$bf87b0724c5191391f1428e7c75b278b23dc3d11$kb$),
  (3, 1, $kb$list$kb$, $kb$حسابات الجسم وموازنة الخامات › تحويل الخلطة إلى أكاسيد$kb$, $kb$1. احصل على تحليل كل خام على أساس جاف موحد.
2. احسب مساهمة كل أكسيد: كتلة الخام الجافة × الكسر الوزني للأكسيد.
3. اجمع مساهمات الأكسيد من كل الخامات.
4. اقسم على أساس الكتلة الذي تريد التعبير عنه، واذكر هل الحساب قبل أم بعد فقد الحريق.
5. راجع مجموع النتائج والوحدات ومصدر كل تحليل.$kb$, $kb$c267450767120fb645c497dc50941f6418bf0908$kb$),
  (4, 1, $kb$table$kb$, $kb$حسابات الجسم وموازنة الخامات › تحويل الخلطة إلى أكاسيد$kb$, $kb$| الخامة | بيانات لازمة | اختبارات أداء |
| --- | --- | --- |
| كاولين | XRF، XRD، LOI، توزيع حبيبي | لدونة، انكماش، امتصاص، بياض |
| طين لدن | معادن طينية، رطوبة، أملاح | لدونة، تجفيف، تشوه |
| فلسبار | Na₂O/K₂O، أطوار، نعومة | سلوك التزجيج وامتصاص الجسم |
| كوارتز | نقاوة، حجم حبيبي، أطوار | التمدد والتشقق والانكماش |
| ألومينا | نقاوة، حجم حبيبي، أطوار | الانكماش والأداء الحراري |$kb$, $kb$7efcac93499e19c84519dd4dfcf020546848cba7$kb$),
  (5, 1, $kb$paragraph$kb$, $kb$حسابات الجسم وموازنة الخامات › تحويل الخلطة إلى أكاسيد$kb$, $kb$اختيار خلطة الجسم مسألة متعددة الأهداف: قابلية التشكيل، التجفيف، الانكماش، الامتصاص، البياض، المقاومة والثبات الأبعادي. حدد حدود القبول قبل التحسين، ولا تغير عدة عوامل معًا إذا كان هدفك معرفة سبب التأثير.$kb$, $kb$9b65e957da8e9c08e793d652fc7419e7f8c400dc$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-34$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-34$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 5;

-- ---- ch-35: حسابات الجليز وصيغة Seger / UMF
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-35$kb$, 35, $kb$حسابات الجليز وصيغة Seger / UMF$kb$, 7, 5
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$خطوات حساب UMF$kb$),
  (2, $kb$ما الذي لا تخبرك به UMF؟$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-35$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$حسابات الجليز وصيغة Seger / UMF$kb$, $kb$الصيغة الجزيئية الموحدة UMF تعرض الأكاسيد على أساس مولاري، وتطبع مجموع أكاسيد الفلكس إلى قيمة مرجعية غالبًا تساوي واحدًا. هي أداة مقارنة وفهم، وليست ضمانًا للنضج أو اللمعان أو الملاءمة.$kb$, $kb$d570a4f70e230aafd8c8c66c35371e66afb2cf13$kb$),
  (2, 0, $kb$table$kb$, $kb$حسابات الجليز وصيغة Seger / UMF$kb$, $kb$| المجموعة | أمثلة | الدور العام |
| --- | --- | --- |
| الفلكس | Na₂O، K₂O، Li₂O، CaO، MgO، ZnO | تؤثر في تكوين الطور الزجاجي ودرجة النضج |
| المثبتات/المعدلات | Al₂O₃، B₂O₃ بحسب النظام | تؤثر في اللزوجة وسلوك الانصهار |
| مكونو الشبكة | SiO₂ | تؤثر في بنية الزجاج والتمدد والمقاومة |$kb$, $kb$1fa9526aef44e3d5a53e7a2c07d67dca4c96087d$kb$),
  (3, 1, $kb$list$kb$, $kb$حسابات الجليز وصيغة Seger / UMF › خطوات حساب UMF$kb$, $kb$1. احسب مساهمة كل خام في كتلة كل أكسيد.
2. حوّل كتلة الأكسيد إلى مولات بقسمتها على كتلته المولية.
3. اجمع مولات الأكسيد من جميع المصادر.
4. اجمع مولات أكاسيد الفلكس المحددة في نظام الحساب.
5. اقسم مولات كل أكسيد على مجموع مولات الفلكس.
6. وثق طريقة إدخال البورون والعناصر المستثناة من مجموع الفلكس.$kb$, $kb$8fde8d1d1fbe07e9b06800ca65eb10056952fd8b$kb$),
  (4, 1, $kb$paragraph$kb$, $kb$حسابات الجليز وصيغة Seger / UMF › خطوات حساب UMF$kb$, $kb$مثال تطبيع رياضي فقط: 0.20 مول Na₂O و0.30 مول K₂O و0.50 مول CaO؛ المجموع 1.00، فتكون القيم المطبعة كما هي. هذا ليس تركيب جليز موصى به.$kb$, $kb$e32bc012818e2e9934225e6d45f351f056e0b6a6$kb$),
  (5, 2, $kb$list$kb$, $kb$حسابات الجليز وصيغة Seger / UMF › ما الذي لا تخبرك به UMF؟$kb$, $kb$- لا تحدد وحدها درجة النضج أو اللزوجة أو التوتر السطحي.
- لا تصف توزيع الحبيبات أو جودة الطحن أو التجانس.
- لا تضمن مقاومة الأحماض أو ثبات اللون أو سلامة ملامسة الغذاء.
- لا تستبدل الاختبار على الجسم الفعلي وبمنحنى الحريق الحقيقي.$kb$, $kb$bc78c4759dc013ffff3df0f559a8b454c45fb861$kb$),
  (6, 2, $kb$table$kb$, $kb$حسابات الجليز وصيغة Seger / UMF › ما الذي لا تخبرك به UMF؟$kb$, $kb$| هدف الجليز | عوامل يجب دراستها | قياسات لازمة |
| --- | --- | --- |
| لامع | تركيب الشبكة، الفلكس، النضج، السماكة | لمعان، سطح، مقاومة كيميائية |
| مطفي | التركيب، التبلور، التبريد، السماكة | درجة المطفي، الخشونة، التنظيف |
| معتم | تشتت الضوء، المواد المعتمة، حجم الجسيمات | البياض والتغطية |
| ملون | الصبغة، الذوبان، الجو، دورة الحريق | L*a*b*، التكرارية، العيوب |
| مقاوم للاستخدام | نضج مناسب وسطح سليم | اختبارات كيميائية وميكانيكية |$kb$, $kb$57d2ce7e0df824323d70f4782b88b43b50669e1b$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-35$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-35$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 6;

-- ---- ch-36: الصبغات السيراميكية وتفاعلها مع الجليز
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-36$kb$, 36, $kb$الصبغات السيراميكية وتفاعلها مع الجليز$kb$, 8, 6
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-36$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$الصبغات السيراميكية وتفاعلها مع الجليز$kb$, $kb$ثبات الصبغة نسبي ويتأثر بتركيب الجليز والحرارة والجو وزمن المكوث والتبريد وحجم الجسيمات. قد يذوب جزء من الصبغة أو يتفاعل مع مكونات الجليز أو تتغير حالة أكسدة بعض العناصر.$kb$, $kb$fd7672bc92a91f8f0030fa72fdeb837ce1cb59fd$kb$),
  (2, 0, $kb$list$kb$, $kb$الصبغات السيراميكية وتفاعلها مع الجليز$kb$, $kb$1. سجل المورد وكود الصبغة ورقم التشغيلة.
2. سجل لون المسحوق واللون بعد الحريق على عينة مرجعية.
3. ثبت الجسم والجليز والسماكة وطريقة التطبيق عند المقارنة.
4. قِس اللون بأداة مناسبة أو بوصف بصري مضبوط، واحتفظ بصورة مرجعية.
5. كرر الاختبار ولا تعتمد على عينة منفردة.$kb$, $kb$fe55148e042e001bf2cd26f9a21fb205ef68a79d$kb$),
  (3, 0, $kb$table$kb$, $kb$الصبغات السيراميكية وتفاعلها مع الجليز$kb$, $kb$| حقل بطاقة الصبغة | المعلومات المطلوبة |
| --- | --- |
| الهوية | المورد، الكود، التشغيلة |
| الاستخدام | مجال المورد ونوع الجليز المختبر |
| الإضافة | ترتيب الإضافة وزمن الخلط وطريقة التشتت |
| الحريق | المنحنى والجو والسماكة والموضع |
| النتيجة | قياس اللون والسطح والعيوب والتكرارية |
| القرار | مرفوض / قيد الدراسة / مقبول لنطاق محدد |$kb$, $kb$f3b890d127fa383f4cff984f817b8b2e69bb1c91$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-36$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-36$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 3;

-- ---- ch-37: التوافق الحراري بين الجسم والجليز
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-37$kb$, 37, $kb$التوافق الحراري بين الجسم والجليز$kb$, 10, 7
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-37$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$التوافق الحراري بين الجسم والجليز$kb$, $kb$عدم التوافق الحراري قد يولد إجهادًا متبقيًا يؤدي إلى تشقق شبكي Crazing أو تقشر Shivering. معامل التمدد الحراري يصف تغير الطول النسبي مع الحرارة ضمن مجال محدد؛ لا تقارن قيمًا دون تطابق الوحدات ومجال القياس وطريقة الاختبار.$kb$, $kb$0aae52d84d68f44aaa1d36b69f4f5c1d44de0d69$kb$),
  (2, 0, $kb$table$kb$, $kb$التوافق الحراري بين الجسم والجليز$kb$, $kb$| المظهر | تفسير محتمل | بيانات مطلوبة |
| --- | --- | --- |
| Crazing | إجهاد شد أو عدم توافق حراري أو عوامل أخرى | تمدد الجسم والجليز، السماكة، التبريد، عمر العينة |
| Shivering | إجهاد ضغط أو ضعف ارتباط أو تأثير الحافة | هندسة الحافة، الالتصاق، التمدد، ظروف الحريق |
| تقشر موضعي | تلوث أو تطبيق أو توافق | نظافة الجسم، تحضير السطح، السماكة، صور مكبرة |$kb$, $kb$77804afef9e0dd0ed2e8db20ff135d49a5377761$kb$),
  (3, 0, $kb$list$kb$, $kb$التوافق الحراري بين الجسم والجليز$kb$, $kb$- Dilatometer: يقيس تغير الأبعاد مع الحرارة وفق بروتوكول محدد.
- اختبر الجسم والجليز الفعليين مع تثبيت التطبيق والحريق.
- لا تستنتج معامل التمدد أو السبب من صورة فقط.$kb$, $kb$34f511eed2bd259a37625ca8997e0b0f04bcc42d$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-37$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-37$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 3;

-- ---- ch-38: تشخيص عيوب البورسلين المتقدمة
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-38$kb$, 38, $kb$تشخيص عيوب البورسلين المتقدمة$kb$, 11, 8
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$شجرة تشخيص موحدة$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-38$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$table$kb$, $kb$تشخيص عيوب البورسلين المتقدمة$kb$, $kb$| العيب | وصف مختصر | مسارات فحص أولية |
| --- | --- | --- |
| Pinholes | ثقوب دقيقة | تحضير السطح، خروج غازات، نضج الجليز، تلوث |
| Blisters | انتفاخات سطحية | تولد الغاز، لزوجة المصهور، السماكة، توقيت النضج |
| Crawling | انكماش الجليز وظهور مناطق مكشوفة | غبار، زيوت، جفاف، سماكة، تكتل |
| Black core | قلب داكن داخل الجسم | مواد عضوية، نفاذية، الأكسدة، سماكة المنتج |
| Warpage | اعوجاج أبعادي | تركيب الجسم، الدعم، التدرج الحراري، النضج |
| Dunting | شرخ بإجهاد حراري | التسخين والتبريد، الهندسة، التحولات الحرارية |
| Crazing | شبكة شروخ بالجليز | التوافق الحراري، السماكة، الجسم، التبريد |
| Shivering | تقشر الجليز | إجهاد الضغط، الحواف، الالتصاق، التوافق |
| Specking | نقط أو بقع غير مرغوبة | تلوث، شوائب، تآكل معدات، تكتل صبغة |
| Lime pops | نتوءات قد ترتبط بجسيمات كلسية | تلوث كربوناتي، حجم الجسيمات، فحص الخام |$kb$, $kb$5261e91f239373893f39734231a7beaa51e9fa1b$kb$),
  (2, 1, $kb$list$kb$, $kb$تشخيص عيوب البورسلين المتقدمة › شجرة تشخيص موحدة$kb$, $kb$1. وثق العيب بصورة عامة وأخرى قريبة مع مقياس وموقعه على المنتج.
2. حدد متى ظهر: قبل الجليز، بعده، بعد الحريق، أم بعد الاستخدام.
3. حدد نمط التوزيع: عشوائي، موضعي، مرتبط بفرن أو عربة أو دفعة.
4. قارن عينة سليمة من الدفعة نفسها وعينة مرجعية.
5. راجع الخامات والتحضير والتشكيل والتجفيف والتطبيق والحريق والمناولة.
6. اكتب فرضيات متعددة مع الأدلة المؤيدة والمعارضة.
7. صمم اختبارًا يميز بين الفرضيات مع شاهد وتكرار.
8. سجل النتيجة ودرجة الثقة ولا تعمم قبل التحقق.$kb$, $kb$9993c3e4387d23886d10fa399a7c36d31cc5caf0$kb$),
  (3, 1, $kb$table$kb$, $kb$تشخيص عيوب البورسلين المتقدمة › شجرة تشخيص موحدة$kb$, $kb$| عنصر تحليل السبب الجذري | ما يسجل |
| --- | --- |
| المشكلة | العيب، نسبة الظهور، تاريخ البداية، المنتج واللون والمقاس |
| النطاق | الخط، الوردية، الفرن، العربة، دفعة الخام، القالب |
| الأدلة | صور، قياسات، سجلات، عينات محفوظة |
| الفرضيات | سبب محتمل ودليل مؤيد ومعارض |
| الاختبار | العامل المتغير والعوامل الثابتة |
| الإجراء | احتواء مؤقت، تصحيح، منع تكرار، متابعة |$kb$, $kb$a2682e4ae33a0ac464ce46535ad4fb632d9bfe6b$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-38$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-38$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 3;

-- ---- ch-39: هندسة الأفران والأثر الحراري
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-39$kb$, 39, $kb$هندسة الأفران والأثر الحراري$kb$, 6, 9
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$Heatwork$kb$),
  (2, $kb$تجانس الفرن وسجل الدورة$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-39$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$هندسة الأفران والأثر الحراري$kb$, $kb$قراءة حساس واحد لا تصف بالضرورة الحرارة التي تعرضت لها كل قطعة. يتأثر الحريق بالحرارة والزمن والجو وانتقال الحرارة وتوزيع الحمولة وحركة الغازات وحالة أدوات القياس.$kb$, $kb$dfa31a045eb046d9c7a15c14bd5e8b87933b73f4$kb$),
  (2, 1, $kb$paragraph$kb$, $kb$هندسة الأفران والأثر الحراري › Heatwork$kb$, $kb$الأثر الحراري يجمع أثر درجة الحرارة والزمن ومعدل التغير في المادة. قد تختلف النتيجة رغم تساوي درجة الحرارة النهائية إذا اختلف زمن المكوث أو معدل التسخين أو انتقال الحرارة. تستخدم أدوات تحقق مناسبة مثل مخاريط البيرومتر وفق تعليمات المورد.$kb$, $kb$030924234dd5b75de70194f3925beb13c39f1d40$kb$),
  (3, 2, $kb$list$kb$, $kb$هندسة الأفران والأثر الحراري › تجانس الفرن وسجل الدورة$kb$, $kb$- حدد مواقع قياس ممثلة أعلى وأسفل وأمام وخلف بحسب تصميم الفرن.
- استخدم أدوات تحقق مناسبة ومعايرة، وسجل رقم الأداة وموقعها.
- اربط القراءة برقم الحمولة والعربة ونوع المنتج.
- قارن دورات متشابهة ومتكررة، لا دورة منفردة.
- راجع أثر كثافة الرص وكتلة الحمولة وترتيب العربات.$kb$, $kb$e26fa88772d973405e26a82314a43c8c4f51e60e$kb$),
  (4, 2, $kb$table$kb$, $kb$هندسة الأفران والأثر الحراري › تجانس الفرن وسجل الدورة$kb$, $kb$| حقل سجل الحريق | البيانات |
| --- | --- |
| الدورة | معرف فريد ونوع الحريق |
| الحمولة | الفرن والعربات والمنتجات والكميات |
| المنحنى | الزمن والحرارة ومصدر القياس |
| الجو | المؤشرات المتاحة وفق نظام المصنع |
| الطاقة | قراءات العدادات المعتمدة |
| التحقق | أدوات القياس والمعايرة والمواضع |
| النتائج | العيوب والامتصاص واللون والتشوه |
| المراجعة | المراجع والتاريخ والملاحظات |$kb$, $kb$63a5176513db195f154966c013dae763de6851fb$kb$),
  (5, 2, $kb$paragraph$kb$, $kb$هندسة الأفران والأثر الحراري › تجانس الفرن وسجل الدورة$kb$, $kb$قارن استهلاك الطاقة بين دورات متشابهة باستخدام مؤشر معرف، مثل الاستهلاك لكل كتلة منتج مطابق. لا تستنتج كفاءة الفرن من إجمالي الغاز وحده. أعمال ضبط الغاز والاحتراق والصيانة ينفذها مختصون مؤهلون وفق إجراءات السلامة.$kb$, $kb$47232b99dc3ec1d006ba2957965352c1c01b1c93$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-39$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-39$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 5;

-- ---- ch-40: تصميم التجارب DOE وتحليل البيانات
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-40$kb$, 40, $kb$تصميم التجارب DOE وتحليل البيانات$kb$, 15, 10
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$ANOVA وSPC وFMEA$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-40$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$table$kb$, $kb$تصميم التجارب DOE وتحليل البيانات$kb$, $kb$| المصطلح | المعنى |
| --- | --- |
| Factor | عامل يراد دراسة أثره |
| Level | مستوى محدد للعامل |
| Response | استجابة مقاسة مثل الانكماش أو الامتصاص |
| Replicate | تكرار مستقل لتقدير التباين |
| Randomization | عشوائية ترتيب التشغيل لتقليل الانحياز |
| Blocking | حجب أثر دفعة أو يوم أو فرن |
| Interaction | تفاعل: أثر عامل يتغير مع مستوى عامل آخر |$kb$, $kb$2afd81de3c48be6634592901cb2bb27872cbb366$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$تصميم التجارب DOE وتحليل البيانات$kb$, $kb$تصميم عاملي 2² يدرس عاملين لكل منهما مستويان عبر أربع حالات. يمكن تقدير الأثر الرئيسي والتفاعل. أضف تكرارات أو نقاطًا مركزية عند الحاجة لتقدير الخطأ أو كشف الانحناء.$kb$, $kb$61d5b2f6abe25b5ed966188658e5a306d484857d$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$تصميم التجارب DOE وتحليل البيانات$kb$, $kb$يحسب الأثر الرئيسي للعامل A من الفرق بين متوسط الاستجابة عند A+ ومتوسطها عند A−. لا تكفي مشاهدة واحدة لكل حالة لتقدير التباين بثقة.$kb$, $kb$d891386c9be24679de24adc54135180bbc99ad3c$kb$),
  (4, 1, $kb$list$kb$, $kb$تصميم التجارب DOE وتحليل البيانات › ANOVA وSPC وFMEA$kb$, $kb$- ANOVA يقارن تباين المتوسطات بتباين داخل المجموعات؛ افحص استقلال المشاهدات والبواقي وتجانس التباين.
- الدلالة الإحصائية لا تعني أهمية صناعية؛ راجع حجم الأثر وحدود قبول المنتج والتكلفة.
- اعرض المتوسط والانحراف المعياري أو فاصل الثقة المناسب.
- لا تحذف القيم الشاذة دون قاعدة وسبب موثق.
- حدود الضبط في SPC ليست حدود مواصفة المنتج.
- FMEA يسجل نمط الإخفاق وأثره وسببه والضوابط والإجراء؛ لا تعتمد على رقم أولوية المخاطر وحده.$kb$, $kb$fe5e30f4e24a7e46137e56a0edb2b7b6cf872641$kb$),
  (5, 1, $kb$table$kb$, $kb$تصميم التجارب DOE وتحليل البيانات › ANOVA وSPC وFMEA$kb$, $kb$| العملية | نمط إخفاق محتمل | أثر | ضابط مقترح |
| --- | --- | --- | --- |
| تحضير المعلق | تغير اللزوجة | عدم ثبات التشكيل أو التطبيق | قياسات موثقة ومراجعة ظروف التحضير |
| تطبيق الجليز | اختلاف السماكة | اختلاف اللون والعيوب | قياس/وزن مناسب وتكرار |
| الحريق | تفاوت حراري | اختلاف النضج واللون | أدوات تحقق موزعة وسجل دورة |
| القياس | جهاز غير معاير | قرار قبول خاطئ | معايرة وتحقق دوري |$kb$, $kb$efd9cbfe89e4a694e2b79f6b616eed0e71c3c4d4$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-40$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-40$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 5;

-- ---- ch-41: جودة أدوات المائدة وسلامة ملامسة الغذاء
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-41$kb$, 41, $kb$جودة أدوات المائدة وسلامة ملامسة الغذاء$kb$, 14, 11
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-41$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$جودة أدوات المائدة وسلامة ملامسة الغذاء$kb$, $kb$المنتجات الملامسة للغذاء قد تخضع لمتطلبات تتعلق بهجرة الرصاص والكادميوم أو عناصر أخرى حسب السوق ونوع المنتج وطريقة الاستخدام. المظهر اللامع أو الخالي من العيوب لا يثبت السلامة الكيميائية.$kb$, $kb$d028461f82012bd592d8369a003bab4338307e3a$kb$),
  (2, 0, $kb$list$kb$, $kb$جودة أدوات المائدة وسلامة ملامسة الغذاء$kb$, $kb$1. حدد السوق واللائحة أو المواصفة السارية وإصدارها.
2. حدد تصنيف المنتج وطريقة الاختبار المطلوبة.
3. استخدم مختبرًا مؤهلًا وطريقة معترفًا بها.
4. اربط التقرير بتركيبة الجسم والجليز ورقم التشغيلة والحريق.
5. أعد التقييم عند تغيير خامة أو مورد أو تركيبة أو حريق إذا كان التغيير مؤثرًا.$kb$, $kb$6ec86aa22c2c260ab7c2c990e390b487a2433cb2$kb$),
  (3, 0, $kb$table$kb$, $kb$جودة أدوات المائدة وسلامة ملامسة الغذاء$kb$, $kb$| التقييم | ما يجيب عنه | ما لا يثبته وحده |
| --- | --- | --- |
| الفحص البصري | وجود عيوب مرئية | لا يثبت السلامة الكيميائية |
| المقاومة الكيميائية | سلوك السطح أمام وسط اختبار | لا تغني عن اختبار الهجرة |
| اختبار الهجرة | انتقال عناصر محددة وفق الطريقة | لا يثبت كل جوانب المتانة |
| اختبار ميكانيكي | أداء ميكانيكي محدد | لا يثبت المطابقة الكيميائية |$kb$, $kb$68e96ddd07bd599a44fc8c02b60f71ffb24e267c$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-41$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-41$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 3;

-- ---- ch-42: اعتماد الخبرات في MAS LAB
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-42$kb$, 42, $kb$اعتماد الخبرات في MAS LAB$kb$, 16, 12
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$قواعد إجابة مساعد المختبر$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-42$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$اعتماد الخبرات في MAS LAB$kb$, $kb$يجب فصل سجل التجربة الخام عن تفسير المساعد وعن الخبرة المعتمدة. اعتماد نتيجة عينة لا يعني تلقائيًا اعتمادها كخبرة علمية.$kb$, $kb$311a779256aacc92a3b125151e602ff61e22084f$kb$),
  (2, 0, $kb$list$kb$, $kb$اعتماد الخبرات في MAS LAB$kb$, $kb$1. سجل التجربة والمواد والأوزان والتحضير والتطبيق والحريق والقياسات.
2. راجع اكتمال البيانات والوحدات والمعايرة والتكرار.
3. حلل النتيجة وافصل الملاحظة عن التفسير.
4. اكتب بطاقة خبرة مع نطاق التطبيق والقيود والأدلة.
5. اعرضها على صاحب الاعتماد المحدد صراحة، لا على أي حساب لمجرد أنه إداري.
6. سجل قرار الاعتماد أو الرفض أو الإرجاع وسببه.
7. اربط الخبرة بالتجارب والخامات والمنتجات الداعمة، وراجعها عند ظهور دليل جديد.$kb$, $kb$b152150e951b464f2043ae82152032017287a051$kb$),
  (3, 0, $kb$table$kb$, $kb$اعتماد الخبرات في MAS LAB$kb$, $kb$| مستوى الثقة | الوصف | طريقة العرض |
| --- | --- | --- |
| منخفض | ملاحظة منفردة أو بيانات ناقصة | فرضية تحتاج اختبارًا |
| متوسط | تكرار محدود وأدلة متسقة | استنتاج مبدئي ضمن نطاق ضيق |
| مرتفع | تكرارات مستقلة وقياسات موثوقة | خبرة معتمدة ضمن نطاقها |
| مرجعي | معلومة منشورة موثقة | حقيقة علمية مع ذكر المرجع |$kb$, $kb$caea3ae29aeefbf9620bf66a43a70bfc9aa81f16$kb$),
  (4, 0, $kb$paragraph$kb$, $kb$اعتماد الخبرات في MAS LAB$kb$, $kb$هذه مستويات إرشادية. موافقة صاحب الاعتماد وحدها لا تعوض نقص الأدلة.$kb$, $kb$6b87c5792c24aa3bd10fb87bdfd048117b899a4e$kb$),
  (5, 1, $kb$list$kb$, $kb$اعتماد الخبرات في MAS LAB › قواعد إجابة مساعد المختبر$kb$, $kb$- اعرض البيانات ومصدرها أولًا.
- اذكر المعلوم والمجهول بوضوح.
- اعرض فرضيات متعددة عند عدم حسم الأدلة.
- اطلب أقل مجموعة قياسات تفصل بين الفرضيات.
- لا تخترع تركيبة أو درجة حرارة أو نسبة خامة.
- لا تعمم خبرة معتمدة خارج نطاقها.$kb$, $kb$035ca0f509929843b2af7eba03ff37a0e07d2e5b$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-42$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-42$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 5;

-- ---- ch-43: نماذج معملية متقدمة
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-43$kb$, 43, $kb$نماذج معملية متقدمة$kb$, 16, 13
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$بطاقة توافق الجسم والجليز$kb$),
  (2, $kb$بطاقة عيب$kb$),
  (3, $kb$بطاقة DOE$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-43$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 1, $kb$table$kb$, $kb$نماذج معملية متقدمة › بطاقة توافق الجسم والجليز$kb$, $kb$| الحقل | قيمة التسجيل |
| --- | --- |
| رقم الاختبار |  |
| الجسم ورقم الدفعة |  |
| الجليز ورقم الدفعة |  |
| طريقة التطبيق والسماكة |  |
| برنامج الحريق والفرن |  |
| موضع العينة وأداة التحقق |  |
| نتيجة القياس والفحص |  |
| الاستنتاج والقيود |  |
| المراجع والاعتماد |  |$kb$, $kb$30102aae4da8c5b36a02bb6f1c57ffe614e83ac3$kb$),
  (2, 2, $kb$table$kb$, $kb$نماذج معملية متقدمة › بطاقة عيب$kb$, $kb$| الحقل | قيمة التسجيل |
| --- | --- |
| رقم الحالة والتاريخ |  |
| المنتج والمقاس واللون |  |
| وصف العيب ومكانه |  |
| نسبة الظهور وحجم العينة |  |
| الصور |  |
| دفعة الجسم والجليز |  |
| التشكيل والتجفيف |  |
| الفرن والدورة والموضع |  |
| الفرضيات والأدلة |  |
| الاختبار والإجراء والتحقق |  |$kb$, $kb$76fd2fdbdc4634f8f4f9d542529625883fee397d$kb$),
  (3, 3, $kb$table$kb$, $kb$نماذج معملية متقدمة › بطاقة DOE$kb$, $kb$| الحقل | قيمة التسجيل |
| --- | --- |
| سؤال التجربة |  |
| الاستجابة الأساسية |  |
| العوامل والمستويات |  |
| العوامل الثابتة |  |
| العشوائية والحجب |  |
| عدد التكرارات |  |
| القياس والمعايرة |  |
| البيانات الخام |  |
| التحليل |  |
| الاستنتاج وحدود التعميم |  |$kb$, $kb$3e803954845a161bd9a297841c68e089f6e4588f$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-43$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-43$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 3;

-- ---- ch-44: قاموس تخصصي
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-44$kb$, 44, $kb$قاموس تخصصي$kb$, 16, 14
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-44$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$table$kb$, $kb$قاموس تخصصي$kb$, $kb$| المصطلح | المقابل/التوضيح |
| --- | --- |
| XRF | فلورة الأشعة السينية: تحليل عنصري |
| XRD | حيود الأشعة السينية: تحديد الأطوار البلورية |
| LOI | فقد الحريق |
| UMF | الصيغة الجزيئية الموحدة للجليز |
| Dilatometry | التحليل التمددي الحراري |
| Crazing | تشقق شبكي في الجليز |
| Shivering | تقشر أو تفلّق الجليز |
| Pinholing | ثقوب دقيقة بسطح الجليز |
| Blistering | انتفاخات أو فقاعات سطحية |
| Crawling | انكماش طبقة الجليز وابتعادها عن السطح |
| Black core | قلب داكن داخل الجسم |
| Warpage | اعوجاج أبعادي |
| Dunting | شرخ مرتبط بإجهاد حراري |
| Heatwork | الأثر الحراري للزمن والحرارة |
| DOE | تصميم التجارب |
| ANOVA | تحليل التباين |
| SPC | الضبط الإحصائي للعملية |
| FMEA | تحليل أنماط الإخفاق وآثارها |$kb$, $kb$f881388a057d3de7f3946e7c775c60d571cdd178$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-44$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-44$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 1;

-- ---- x-26b4dc6a: مراجع للتحقق والتوسع
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-26b4dc6a$kb$, null, $kb$مراجع للتحقق والتوسع$kb$, 16, 15
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-26b4dc6a$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$مراجع للتحقق والتوسع$kb$, $kb$المراجع التالية نقاط بداية للبحث، وليست إثباتًا للمطابقة. يجب مراجعة أحدث إصدار ونطاق التطبيق قبل الاستخدام الرسمي.$kb$, $kb$a91a9cdd85402b4f797c67d1f42b2972fe6ad3b0$kb$),
  (2, 0, $kb$list$kb$, $kb$مراجع للتحقق والتوسع$kb$, $kb$- Kingery, Bowen & Uhlmann, Introduction to Ceramics.
- J. S. Reed, Principles of Ceramics Processing.
- ISO 6486 series: أواني السيراميك والزجاج والسيراميك الزجاجي الملامسة للأغذية – إطلاق الرصاص والكادميوم؛ تحقق من الإصدار والنطاق.
- ASTM C373: امتصاص الماء والكثافة الظاهرية والمسامية الظاهرية ضمن نطاق المعيار.
- ASTM C326: انكماش التجفيف والحريق للمنتجات الخزفية ضمن نطاق المعيار.
- Montgomery, Design and Analysis of Experiments.
- NIST/SEMATECH e-Handbook of Statistical Methods.
- ISO/IEC 17025: كفاءة مختبرات الاختبار والمعايرة.
- ISO 9001: نظم إدارة الجودة.$kb$, $kb$e4086e7ce69aa6f8e1dc2782dc19ac2be70cbe5e$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-26b4dc6a$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-26b4dc6a$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 2;

-- ---- x-4772b499: تنبيه ختامي
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-4772b499$kb$, null, $kb$تنبيه ختامي$kb$, 16, 16
from public.lab_kb_documents d where d.doc_key = $kb$vol3$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-4772b499$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تنبيه ختامي$kb$, $kb$لا تستخدم هذه الموسوعة وحدها لإثبات المطابقة أو السلامة. لا بد من نص المواصفة السارية، ومختبر مؤهل، وقياسات معايرة، وإجراءات المصنع. كل قيمة أو وصفة أو قرار إنتاجي يحتاج إلى تحقق على الخامات والمنتجات والفرن الفعلي.$kb$, $kb$6ccf2849b97fde0352e83d6e2cf913f6b28dc035$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$تنبيه ختامي$kb$, $kb$نهاية المجلد الثالث – الأبواب 33 إلى 44. المجلدات الثلاثة تشكل مرجعًا تأسيسيًا موسعًا قابلًا للمراجعة والإضافة، وليست موسوعة نهائية مغلقة.$kb$, $kb$41c070c33520e29ca9997504e5b2ad4b83b7537d$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-4772b499$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-4772b499$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$)
  and k.seq > 2;

-- ---- القاموس (مصطلحات عربي/إنجليزي)
insert into public.lab_kb_terms (term_key, ar, en, note, source_chapter_key, document_id)
select v.term_key, v.ar, v.en, v.note, v.ck, (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$) from (values
  ($kb$7177b526e5bdaafd$kb$, null, $kb$XRF$kb$, $kb$فلورة الأشعة السينية: تحليل عنصري$kb$, $kb$ch-44$kb$),
  ($kb$8d0899a407775303$kb$, null, $kb$XRD$kb$, $kb$حيود الأشعة السينية: تحديد الأطوار البلورية$kb$, $kb$ch-44$kb$),
  ($kb$ad6dfb5912a25394$kb$, null, $kb$LOI$kb$, $kb$فقد الحريق$kb$, $kb$ch-44$kb$),
  ($kb$e7acd21066a1231d$kb$, null, $kb$UMF$kb$, $kb$الصيغة الجزيئية الموحدة للجليز$kb$, $kb$ch-44$kb$),
  ($kb$0c3a3e7fc7dc0b55$kb$, null, $kb$Dilatometry$kb$, $kb$التحليل التمددي الحراري$kb$, $kb$ch-44$kb$),
  ($kb$53d68247c4a041a9$kb$, null, $kb$Crazing$kb$, $kb$تشقق شبكي في الجليز$kb$, $kb$ch-44$kb$),
  ($kb$9f85b241848c7153$kb$, null, $kb$Shivering$kb$, $kb$تقشر أو تفلّق الجليز$kb$, $kb$ch-44$kb$),
  ($kb$8fd9cf4c99f4e151$kb$, null, $kb$Pinholing$kb$, $kb$ثقوب دقيقة بسطح الجليز$kb$, $kb$ch-44$kb$),
  ($kb$58d13fc9c0754648$kb$, null, $kb$Blistering$kb$, $kb$انتفاخات أو فقاعات سطحية$kb$, $kb$ch-44$kb$),
  ($kb$361a678ba28f2c7d$kb$, null, $kb$Crawling$kb$, $kb$انكماش طبقة الجليز وابتعادها عن السطح$kb$, $kb$ch-44$kb$),
  ($kb$f7cc0c192eb8067d$kb$, null, $kb$Black core$kb$, $kb$قلب داكن داخل الجسم$kb$, $kb$ch-44$kb$),
  ($kb$d0edfbc84654c563$kb$, null, $kb$Warpage$kb$, $kb$اعوجاج أبعادي$kb$, $kb$ch-44$kb$),
  ($kb$16b63e96b2e88d5d$kb$, null, $kb$Dunting$kb$, $kb$شرخ مرتبط بإجهاد حراري$kb$, $kb$ch-44$kb$),
  ($kb$da33b7871854ef22$kb$, null, $kb$Heatwork$kb$, $kb$الأثر الحراري للزمن والحرارة$kb$, $kb$ch-44$kb$),
  ($kb$e06683c3bcfc9cd7$kb$, null, $kb$DOE$kb$, $kb$تصميم التجارب$kb$, $kb$ch-44$kb$),
  ($kb$51874832a3910564$kb$, null, $kb$ANOVA$kb$, $kb$تحليل التباين$kb$, $kb$ch-44$kb$),
  ($kb$ffd98a5767c73484$kb$, null, $kb$SPC$kb$, $kb$الضبط الإحصائي للعملية$kb$, $kb$ch-44$kb$),
  ($kb$edf8f4d10e668d16$kb$, null, $kb$FMEA$kb$, $kb$تحليل أنماط الإخفاق وآثارها$kb$, $kb$ch-44$kb$)
) as v(term_key, ar, en, note, ck)
on conflict (term_key) do update set ar = excluded.ar, en = excluded.en, note = excluded.note;

-- ---- المراجع والمعايير
insert into public.lab_kb_sources (source_key, title, url, source_chapter_key, document_id)
select v.source_key, v.title, v.url, v.ck, (select id from public.lab_kb_documents where doc_key = $kb$vol3$kb$) from (values
  ($kb$a91a9cdd85402b4f$kb$, $kb$المراجع التالية نقاط بداية للبحث، وليست إثباتًا للمطابقة. يجب مراجعة أحدث إصدار ونطاق التطبيق قبل الاستخدام الرسمي.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$fe4410b70968fd6b$kb$, $kb$Kingery, Bowen & Uhlmann, Introduction to Ceramics.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$2ece1293015881b7$kb$, $kb$J. S. Reed, Principles of Ceramics Processing.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$805a2f67ea23e06b$kb$, $kb$ISO 6486 series: أواني السيراميك والزجاج والسيراميك الزجاجي الملامسة للأغذية – إطلاق الرصاص والكادميوم؛ تحقق من الإصدار والنطاق.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$a69f36978d1d8a69$kb$, $kb$ASTM C373: امتصاص الماء والكثافة الظاهرية والمسامية الظاهرية ضمن نطاق المعيار.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$44fca6b700cae1b8$kb$, $kb$ASTM C326: انكماش التجفيف والحريق للمنتجات الخزفية ضمن نطاق المعيار.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$a1bc63831c392bb1$kb$, $kb$Montgomery, Design and Analysis of Experiments.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$719f5745c7c481dd$kb$, $kb$NIST/SEMATECH e-Handbook of Statistical Methods.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$fd269212a7e4e02f$kb$, $kb$ISO/IEC 17025: كفاءة مختبرات الاختبار والمعايرة.$kb$, null, $kb$x-26b4dc6a$kb$),
  ($kb$4336fa923eb313d0$kb$, $kb$ISO 9001: نظم إدارة الجودة.$kb$, null, $kb$x-26b4dc6a$kb$)
) as v(source_key, title, url, ck)
on conflict (source_key) do update set title = excluded.title, url = excluded.url;

-- ---- سجل الاستيراد
insert into public.lab_kb_import_jobs (doc_key, file_name, file_sha256, status, chapters_count, sections_count,
  chunks_count, tables_count, terms_count, sources_count, warnings)
values ($kb$vol3$kb$, $kb$MAS_LAB_Porcelain_Encyclopedia_Vol3_AR.docx$kb$, $kb$29c1afdc19160b4b4ce473546f0ab989147facbe0c0e6dcce2874fe8477c024f$kb$, 'completed', 16, 30, 55, 17,
  18, 10, $kb$["غلاف المجلد (محتوى قبل أول عنوان): حُفظ كفصل 'front-0'", "رأس/تذييل صفحة غير مستخرج: «MAS LAB | موسوعة علوم وتكنولوجيا البورسلين | المجلد الثالث»"]$kb$::jsonb);

-- ---- اختبار الاكتمال: لو أي عدد غير مطابق يحدث خطأ ويتراجع الاستيراد كله
do $verify$
declare v_ch int; v_sec int; v_chunks int; v_tables int;
begin
  select count(*) into v_ch from public.lab_kb_chapters c join public.lab_kb_documents d on d.id = c.document_id
    where d.doc_key = $kb$vol3$kb$;
  select count(*) into v_sec from public.lab_kb_sections s join public.lab_kb_chapters c on c.id = s.chapter_id
    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = $kb$vol3$kb$;
  select count(*), count(*) filter (where k.kind = 'table') into v_chunks, v_tables
    from public.lab_kb_chunks k join public.lab_kb_chapters c on c.id = k.chapter_id
    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = $kb$vol3$kb$ and k.is_current;
  if v_ch <> 16 or v_sec <> 30 or v_chunks <> 55 or v_tables <> 17 then
    raise exception 'KB import mismatch: chapters %/16, sections %/30, chunks %/55, tables %/17', v_ch, v_sec, v_chunks, v_tables;
  end if;
end $verify$;

commit;
