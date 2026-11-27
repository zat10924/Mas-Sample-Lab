-- =====================================================================
-- استيراد موسوعة علوم وتكنولوجيا البورسلين — المجلد الثاني
-- الملف الأصلي: MAS_LAB_Porcelain_Encyclopedia_Vol2_AR.docx  (SHA-256: aeeeedd2822deea2…)
-- مولَّد آليًا بواسطة tools/kb_import/build_kb.py — آمن لإعادة التشغيل (بدون تكرار).
-- يتطلب تشغيل 009_kb_schema.sql أولًا. لا يمسّ أي جدول قديم.
-- =====================================================================
begin;

insert into public.lab_kb_documents (doc_key, title, edition, volume, file_name, file_sha256)
values ($kb$vol2$kb$, $kb$موسوعة علوم وتكنولوجيا البورسلين — المجلد الثاني$kb$, $kb$v1$kb$, 2, $kb$MAS_LAB_Porcelain_Encyclopedia_Vol2_AR.docx$kb$, $kb$aeeeedd2822deea285368ae4a81f7902ecd4f7aabf9b557ee2d13a4d3d8748ed$kb$)
on conflict (doc_key) do update set title = excluded.title, edition = excluded.edition,
  file_name = excluded.file_name, file_sha256 = excluded.file_sha256, imported_at = now();

-- ---- front-0: غلاف المجلد
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$front-0$kb$, null, $kb$غلاف المجلد$kb$, 16, 1
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$موسوعة MAS LAB لعلوم وتكنولوجيا البورسلين$kb$, $kb$7ae5dac472628b84a243cf26c83712a9012e838d$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$المجلد الثاني: التطبيقات المعملية والحسابات وتشخيص العيوب$kb$, $kb$31348b721604cd31b8db54ad17fae7dbf9733773$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$إصدار تكميلي — 2026$kb$, $kb$8072ab7dfa58524524c639f7904f6f2ee45090e9$kb$),
  (4, 0, $kb$paragraph$kb$, $kb$غلاف المجلد$kb$, $kb$هذا المجلد يوسع المحتوى التأسيسي بإجراءات قياس وتوثيق وتحليل. القيم التشغيلية النهائية وحدود القبول يجب أن تأتي من مواصفات المصنع والخامات الفعلية والمعايير السارية، لا من أمثلة عامة.$kb$, $kb$cbd832ed6da567cc1b6b77f3ebd980ed4ff0192b$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$front-0$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 4;

-- ---- ch-19: بناء نظام بيانات الخامات
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-19$kb$, 19, $kb$بناء نظام بيانات الخامات$kb$, 2, 2
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$19.1 التعامل مع اختلاف دفعات الخام$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-19$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$بناء نظام بيانات الخامات$kb$, $kb$المعرفة الفنية لا تكون قابلة للاستخدام إذا لم ترتبط بهوية الخامة ودفعتها ومصدرها. يجب أن يكون لكل خامة سجل رئيسي، ولكل توريد سجل تشغيلة مستقل.$kb$, $kb$1565e1e6c3436fdde8ee5f0f512ba53ca5ca09fe$kb$),
  (2, 0, $kb$table$kb$, $kb$بناء نظام بيانات الخامات$kb$, $kb$| الحقل | الغرض |
| --- | --- |
| Material ID | معرف ثابت لا يتغير عند تغيير الاسم التجاري |
| الاسم التجاري والاسم الفني | منع الخلط بين أسماء الموردين والتصنيف العلمي |
| المورد ومصدر الخام | تتبع التغيرات بين المصادر |
| رقم التشغيلة وتاريخ الاستلام | ربط نتائج التحليل بالإنتاج |
| الرطوبة وLOI | تصحيح الوزن وفهم المواد المتطايرة |
| تحليل XRF | تكوين كيميائي تقريبي محسوب كأكاسيد |
| تحليل XRD | الأطوار المعدنية عند توفره |
| الخواص التشغيلية | اللدونة، اللون، حجم الحبيبات، سلوك الحريق |
| حالة الاعتماد | معلق، مقبول، مرفوض، أو مقبول بشروط |$kb$, $kb$1c2607d69e2a840afa2f90c019d53187b8fc7d81$kb$),
  (3, 1, $kb$list$kb$, $kb$بناء نظام بيانات الخامات › 19.1 التعامل مع اختلاف دفعات الخام$kb$, $kb$- لا تدمج نتائج دفعتين في متوسط واحد قبل التأكد من أن الاختلاف غير مؤثر فنيًا.
- أنشئ حدود تنبيه داخلية لكل خاصية حرجة بناءً على تاريخ الأداء الفعلي.
- عند تغيير المورد أو المنجم أو طريقة المعالجة، نفذ اختبار مقارنة قبل إدخال الخام في الإنتاج.
- احتفظ بعينة مرجعية مغلقة وموسومة من كل دفعة مهمة وفق نظام حفظ العينات.$kb$, $kb$53cbbebad284cadfd79cdfc109014ed335147c25$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-19$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-19$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 3;

-- ---- ch-20: أساسيات التحليل الكيميائي وحساب الأكاسيد
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-20$kb$, 20, $kb$أساسيات التحليل الكيميائي وحساب الأكاسيد$kb$, 2, 3
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$20.1 تحويل النسب الوزنية إلى مولات$kb$),
  (2, $kb$20.2 وحدة الصيغة الجزيئية Seger$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-20$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$أساسيات التحليل الكيميائي وحساب الأكاسيد$kb$, $kb$يعرض التحليل الكيميائي عادةً الأكاسيد كنسب وزنية. لا يعني ذلك أن الأكاسيد موجودة كمواد حرة في الخام؛ فهي طريقة معيارية للتعبير عن العناصر بعد التحليل. يجب معرفة هل النتائج مطبّعة إلى 100% وهل LOI محسوب منفصلًا أم ضمن المجموع.$kb$, $kb$127bbfa4388a75d58cf94655239d8b967c8c47e3$kb$),
  (2, 1, $kb$paragraph$kb$, $kb$أساسيات التحليل الكيميائي وحساب الأكاسيد › 20.1 تحويل النسب الوزنية إلى مولات$kb$, $kb$عدد مولات أكسيد افتراضي = كتلة الأكسيد ÷ كتلته المولية. وللمقارنة بين تركيبتين، تحول كميات الأكاسيد إلى مولات ثم تطبع وفق أساس حسابي معلن. يجب استخدام الكتل المولية الصحيحة وصيغ الأكاسيد الصحيحة.$kb$, $kb$6fb5f441b2a83aafba00be883594e62001cc479d$kb$),
  (3, 1, $kb$paragraph$kb$, $kb$أساسيات التحليل الكيميائي وحساب الأكاسيد › 20.1 تحويل النسب الوزنية إلى مولات$kb$, $kb$مثال تعليمي رمزي: إذا كانت كتلة SiO2 في عينة 60 g والكتلة المولية لـ SiO2 نحو 60.08 g/mol، فإن كمية المادة تقارب 60 ÷ 60.08 = 0.999 mol. المثال يشرح الحساب فقط ولا يمثل تركيبة جليز مقترحة.$kb$, $kb$74d63de6796cbcafe6ab3983c042c6fe7769d89e$kb$),
  (4, 2, $kb$paragraph$kb$, $kb$أساسيات التحليل الكيميائي وحساب الأكاسيد › 20.2 وحدة الصيغة الجزيئية Seger$kb$, $kb$في صيغة Seger تُطبع مولات الأكاسيد عادةً بحيث يكون مجموع مجموعة الصهارات المحددة مساويًا لوحدة مرجعية. ثم تعرض الأكاسيد الأخرى كنسب مولية إلى هذا الأساس. يجب توثيق الأكاسيد المصنفة كصهارات في النظام المستخدم، لأن التصنيف قد يختلف حسب الغرض والتركيبة.$kb$, $kb$cfa534107ea6beb229620996706a96e6c5721e29$kb$),
  (5, 2, $kb$list$kb$, $kb$أساسيات التحليل الكيميائي وحساب الأكاسيد › 20.2 وحدة الصيغة الجزيئية Seger$kb$, $kb$- ابدأ بتحليل موثق لكل خامة مستخدمة.
- احسب مساهمة كل خامة من كل أكسيد على أساس وزن الدفعة.
- اجمع مساهمات الأكاسيد من جميع الخامات.
- حوّل المجاميع الوزنية إلى مولات.
- طبّع على أساس الصهارات وفق المنهج المختار.
- قارن الصيغة بالخواص المقاسة، ولا تستخدم الصيغة وحدها للتنبؤ النهائي.$kb$, $kb$cc8e51fd5f4ddead245857f66c214ae51ab40f7d$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-20$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-20$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 5;

-- ---- ch-21: الريولوجيا العملية للمعلقات
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-21$kb$, 21, $kb$الريولوجيا العملية للمعلقات$kb$, 4, 4
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$21.1 بروتوكول قياس قابل للتكرار$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-21$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$الريولوجيا العملية للمعلقات$kb$, $kb$الريولوجيا تدرس سلوك الجريان والتشوه. في معلقات الجسم والجليز تتأثر بالمواد الصلبة، حجم وشكل الحبيبات، توزيع الأحجام، الأملاح الذائبة، المشتتات، الأس الهيدروجيني، درجة الحرارة وزمن الراحة.$kb$, $kb$cbe4a6521ffb44a778dfb59980a7f4b4ed81d741$kb$),
  (2, 0, $kb$table$kb$, $kb$الريولوجيا العملية للمعلقات$kb$, $kb$| المصطلح | المعنى العملي | ما يجب تسجيله |
| --- | --- | --- |
| Viscosity | مقاومة الجريان | نوع الجهاز، السرعة، الحرارة، زمن القياس |
| Yield Stress | إجهاد بدء الجريان | طريقة القياس وظروف العينة |
| Thixotropy | تغير البنية مع القص والراحة | تاريخ القص وزمن الراحة |
| Deflocculation | تفكيك التكتلات وتحسين التشتت | نوع المشتت والجرعة ووقت الإضافة |
| Flocculation | تجمع الجسيمات وزيادة البنية | الأملاح وpH والمضافات |$kb$, $kb$f8d1eb6bf2229ab0080f291bb5cdf6dc1bf210c8$kb$),
  (3, 1, $kb$list$kb$, $kb$الريولوجيا العملية للمعلقات › 21.1 بروتوكول قياس قابل للتكرار$kb$, $kb$- خذ عينة ممثلة بعد تقليب موحد ومحدد.
- اترك العينة أو قسها بعد زمن راحة محدد في الإجراء.
- سجل درجة الحرارة؛ لا تقارن قراءات عند درجات مختلفة دون تقييم.
- استخدم نفس الجهاز والملحق وسرعة الدوران وطريقة التحضير.
- خذ أكثر من قراءة وسجل المتوسط والمدى، ولا تحذف قراءة شاذة دون سبب موثق.
- نظف الجهاز بالطريقة المعتمدة لمنع انتقال التلوث.$kb$, $kb$40202c8a7c74e067abd018a21d0ca0a3cf456bb7$kb$),
  (4, 1, $kb$paragraph$kb$, $kb$الريولوجيا العملية للمعلقات › 21.1 بروتوكول قياس قابل للتكرار$kb$, $kb$لا تقارن قيمة لزوجة من جهاز أو سرعة قص بقيمة من جهاز مختلف وكأنهما قياس واحد. عند تغيير طريقة القياس، نفذ دراسة ربط بين الطريقتين.$kb$, $kb$1ca50eb9a76b4ba430a0e68f4597c1262fbf463f$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-21$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-21$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 4;

-- ---- ch-22: التشتت والمشتتات والتحكم في المعلق
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-22$kb$, 22, $kb$التشتت والمشتتات والتحكم في المعلق$kb$, 4, 5
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-22$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$التشتت والمشتتات والتحكم في المعلق$kb$, $kb$المشتتات تساعد على تقليل تكتل الجسيمات، لكن الجرعة الزائدة أو غير المناسبة قد تسبب آثارًا عكسية. يعتمد الاختيار على نوع الجسم أو الجليز، كيمياء الماء، الأملاح الذائبة، مساحة سطح الحبيبات، ودرجة الحموضة.$kb$, $kb$223fb68c51088036b2e23119e04de84b46d5f8c5$kb$),
  (2, 0, $kb$list$kb$, $kb$التشتت والمشتتات والتحكم في المعلق$kb$, $kb$- ابدأ بتوصيف الماء المستخدم؛ فالأملاح قد تغير سلوك المعلق.
- أضف المشتت تدريجيًا وفق إجراء اختبار مخبري وليس دفعة عشوائية.
- سجل الجرعة على أساس جاف واضح.
- قارن اللزوجة والترسيب وإعادة التشتيت وسلوك التطبيق مع عينة مرجعية.
- لا تنقل جرعة مشتت من تركيبة إلى أخرى دون اختبار.$kb$, $kb$48246a162fead40cc08e0c3f677ca58de6282d72$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$التشتت والمشتتات والتحكم في المعلق$kb$, $kb$لا تخلط بين ضبط اللزوجة اللحظية وبين ثبات المعلق خلال التخزين. يجب فحص الاثنين.$kb$, $kb$d4f5421755019e842b704814a203b7a741133709$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-22$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-22$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 3;

-- ---- ch-23: قياس الانكماش والامتصاص والكثافة
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-23$kb$, 23, $kb$قياس الانكماش والامتصاص والكثافة$kb$, 12, 6
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$23.1 الانكماش الخطي$kb$),
  (2, $kb$23.2 امتصاص الماء$kb$),
  (3, $kb$23.3 الكثافة الظاهرية$kb$),
  (4, $kb$23.4 تفسير النتائج معًا$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-23$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 1, $kb$paragraph$kb$, $kb$قياس الانكماش والامتصاص والكثافة › 23.1 الانكماش الخطي$kb$, $kb$الانكماش الخطي (%) = (الطول الأصلي − الطول بعد المعالجة) ÷ الطول الأصلي × 100. يجب تحديد هل القياس بعد التجفيف أم بعد الحريق، وقياس طول مرجعي معلوم على عينة ممثلة.$kb$, $kb$60c0c88e28567ae18defe0543c8a427272b73ae3$kb$),
  (2, 2, $kb$paragraph$kb$, $kb$قياس الانكماش والامتصاص والكثافة › 23.2 امتصاص الماء$kb$, $kb$امتصاص الماء (%) = (الكتلة المشبعة − الكتلة الجافة) ÷ الكتلة الجافة × 100، وفق طريقة تحضير وتشبيع وتجفيف محددة. لا تقارن نتائج مأخوذة بطرق مختلفة دون دراسة ربط.$kb$, $kb$69206a735281a9ccabe28a00d5c00dee162a5767$kb$),
  (3, 3, $kb$paragraph$kb$, $kb$قياس الانكماش والامتصاص والكثافة › 23.3 الكثافة الظاهرية$kb$, $kb$الكثافة الظاهرية هي كتلة العينة مقسومة على حجمها الخارجي وفق طريقة القياس المعتمدة. يجب توضيح هل الحجم يتضمن المسام المفتوحة والمغلقة، لأن طريقة القياس تؤثر في النتيجة.$kb$, $kb$a42f408ff52408fbd76cd8059c0999a31a9ab15c$kb$),
  (4, 4, $kb$paragraph$kb$, $kb$قياس الانكماش والامتصاص والكثافة › 23.4 تفسير النتائج معًا$kb$, $kb$الانكماش والامتصاص والكثافة مؤشرات متكاملة. انخفاض الامتصاص مع زيادة الانكماش قد يشير إلى تقدم التزجج، لكنه لا يكفي وحده للحكم؛ يجب مراقبة التشوه واللون والخواص الميكانيكية.$kb$, $kb$797c88959f2f1a61612141f3a4823f214ce06e01$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-23$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-23$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 4;

-- ---- ch-24: تصميم برنامج اختبار نضج الجسم
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-24$kb$, 24, $kb$تصميم برنامج اختبار نضج الجسم$kb$, 12, 7
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-24$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تصميم برنامج اختبار نضج الجسم$kb$, $kb$الهدف هو تحديد نافذة تشغيل تحقق الخواص المطلوبة مع هامش آمن ضد النضج الزائد أو الناقص. لا تُحدد النافذة من قراءة فرن واحدة أو عينة واحدة.$kb$, $kb$19c8167861f0959f73d27083e3de4bf0df4da7c5$kb$),
  (2, 0, $kb$list$kb$, $kb$تصميم برنامج اختبار نضج الجسم$kb$, $kb$- جهز عينات موحدة من نفس دفعة الجسم وبأبعاد معروفة.
- استخدم نقاط اختبار حراري موزعة حول مجال التشغيل المتوقع، يحددها المختص وفق إمكانيات الفرن وسلامة التجربة.
- وزع العينات في مواقع متعددة من الحمولة لقياس التفاوت المكاني.
- سجل منحنى الحريق الفعلي وليس البرنامج الاسمي فقط.
- قِس الامتصاص والانكماش والكثافة والتشوه واللون بعد الحريق.
- ارسم النتائج مقابل مؤشر الحريق أو الموقع، وحدد المجال الذي يحقق جميع المتطلبات.
- كرر التجربة للتحقق من ثبات النتيجة قبل اعتماد النافذة.$kb$, $kb$a5a917507ca9545bf6fd5517b5307ff1cbb11238$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$تصميم برنامج اختبار نضج الجسم$kb$, $kb$لا توجد درجة حرارة عامة تصلح لكل أجسام البورسلين. يجب أن تكون نافذة النضج خاصة بالتركيبة والفرن والمنتج.$kb$, $kb$66cc5185b9be24775d583692ad618be85e9cf15d$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-24$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-24$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 3;

-- ---- ch-25: تقييم الجليز بطريقة منهجية
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-25$kb$, 25, $kb$تقييم الجليز بطريقة منهجية$kb$, 7, 8
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$25.1 مصفوفة تجارب الجليز$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-25$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تقييم الجليز بطريقة منهجية$kb$, $kb$يُقيّم الجليز من حيث المظهر والسطح والتوافق والنضج والمتانة وسلامة الاستخدام. يجب توحيد الجسم الحامل وسُمك التطبيق وطريقة التطبيق والحريق حتى يكون الاختبار ذا معنى.$kb$, $kb$49a8ae9fa1d578bb3d9b8f2044b864b9b9ca6e2f$kb$),
  (2, 0, $kb$table$kb$, $kb$تقييم الجليز بطريقة منهجية$kb$, $kb$| مجموعة التقييم | أمثلة على المؤشرات |
| --- | --- |
| المظهر | اللون، اللمعان، العتامة، التجانس، آثار التطبيق |
| السطح | الخشونة، الثقوب، الفقاعات، التسييل، التبلور |
| التوافق | الكرازينج، التقشير، الالتصاق، الإجهادات |
| الأداء | المقاومة الكيميائية والميكانيكية والحرارية وفق الاستخدام |
| السلامة | الهجرة الكيميائية للمواد ذات الصلة وفق السوق والمعيار |$kb$, $kb$a263c04e5904e04f1d911242ffdcef6384a2f040$kb$),
  (3, 1, $kb$paragraph$kb$, $kb$تقييم الجليز بطريقة منهجية › 25.1 مصفوفة تجارب الجليز$kb$, $kb$أنشئ مصفوفة تحتوي على رمز العينة، التركيبة، دفعات الخامات، وزن التطبيق أو سماكته، طريقة التطبيق، دورة الحريق، الموقع داخل الفرن، والنتائج. يجب أن يكون لكل عينة مرجع واضح يمكن استعادته.$kb$, $kb$250a00fa4f0d28e0dc683b8bc18136c5e80285be$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-25$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-25$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 3;

-- ---- ch-26: تشخيص عيوب الجليز بتسلسل الأدلة
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-26$kb$, 26, $kb$تشخيص عيوب الجليز بتسلسل الأدلة$kb$, 11, 9
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-26$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$table$kb$, $kb$تشخيص عيوب الجليز بتسلسل الأدلة$kb$, $kb$| العيب | أسئلة التشخيص الأولى | اختبارات متابعة محتملة |
| --- | --- | --- |
| Pinholes | هل العيب في مناطق محددة؟ هل يظهر على كل الألوان؟ | مقطع عرضي، فحص سطح الجسم، مقارنة دورات الحريق |
| Blistering | هل توجد فقاعات مغلقة أم انفجارات سطحية؟ | فحص المقطع، مراجعة الغازات والنضج |
| Crawling | هل توجد مناطق انكشف فيها الجسم؟ هل الطبقة تنكمش قبل الحريق؟ | فحص التلوث والتجفيف والالتصاق وسُمك الطبقة |
| Crazing | هل يظهر فور التبريد أم بعد فترة/غسيل؟ | اختبار توافق التمدد وفحص مجهري |
| Shivering | هل يتركز عند الحواف؟ | فحص هندسة الحافة والتمدد وسُمك الطبقة |
| Matte/Gloss variation | هل التغير مرتبط بالموقع أو السماكة؟ | قياس اللون واللمعان، مقارنة توزيع الحرارة |$kb$, $kb$faac5c84f17427424c04e754327cc32e13862bcb$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$تشخيص عيوب الجليز بتسلسل الأدلة$kb$, $kb$الصور مفيدة للتوثيق والفرز، لكنها لا تثبت وحدها التفسير الكيميائي أو الحراري. أرفق الصورة بموقع العيب ومرحلة ظهوره وبيانات العينة.$kb$, $kb$d52448d5dddfb4270bd44948dd2e807e2da1b6fc$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-26$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-26$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 2;

-- ---- ch-27: اللون والقياس اللوني
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-27$kb$, 27, $kb$اللون والقياس اللوني$kb$, 8, 10
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-27$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$اللون والقياس اللوني$kb$, $kb$اللون الذي تراه العين يتأثر بمصدر الإضاءة والمراقب وخلفية العينة ولمعان السطح. لذلك يجب تثبيت شروط المقارنة أو استخدام جهاز قياس لوني.$kb$, $kb$3a6884353500aa1b9dce0c1996f741d2bd23bd1c$kb$),
  (2, 0, $kb$list$kb$, $kb$اللون والقياس اللوني$kb$, $kb$- L* يصف الإضاءة من الداكن إلى الفاتح.
- a* يصف المحور الأخضر إلى الأحمر.
- b* يصف المحور الأزرق إلى الأصفر.
- فرق اللون ΔE يحسب وفق الصيغة اللونية المختارة؛ يجب ذكر الصيغة مثل CIE76 أو CIEDE2000.
- لا تضع حد قبول عام لفرق اللون دون اتفاق مع العميل وطريقة القياس والمنتج.$kb$, $kb$bc1e1199050930710184ac38a1b467f760d05637$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$اللون والقياس اللوني$kb$, $kb$عند مقارنة لونين، استخدم نفس نوع الجهاز والهندسة ومصدر الإضاءة والفتحة وظروف السطح، واحتفظ بعينة معيارية.$kb$, $kb$5213aa492211b84a5e0ee3eaa95720be8e5c3ea5$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-27$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-27$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 3;

-- ---- ch-28: سلامة أدوات المائدة الملامسة للغذاء
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-28$kb$, 28, $kb$سلامة أدوات المائدة الملامسة للغذاء$kb$, 14, 11
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-28$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$سلامة أدوات المائدة الملامسة للغذاء$kb$, $kb$المظهر الجيد أو الجليز الكامل لا يثبت السلامة. تعتمد المتطلبات على السوق ونوع المنتج ومكان الزخرفة وطبيعة الاستخدام. قد تتطلب اللوائح اختبارات هجرة الرصاص والكادميوم أو عناصر أخرى.$kb$, $kb$d62486b51f60d48380792a572d76f03bae33d776$kb$),
  (2, 0, $kb$list$kb$, $kb$سلامة أدوات المائدة الملامسة للغذاء$kb$, $kb$- حدد السوق المستهدف واللوائح الملزمة فيه قبل تحديد خطة الاختبار.
- اختبر المنتج النهائي الممثل، لا مسحوق الجليز وحده.
- حدد مناطق التلامس مع الغذاء أو الفم وفق طريقة المعيار.
- استخدم مختبرًا مؤهلًا وطريقة اختبار معترفًا بها.
- احتفظ بتقارير الاختبار وربطها برقم تصميم المنتج ودفعة الإنتاج.$kb$, $kb$fdb1f4ef69645dab5c313b782c8f0ff13fc1bc55$kb$),
  (3, 0, $kb$paragraph$kb$, $kb$سلامة أدوات المائدة الملامسة للغذاء$kb$, $kb$هذه الموسوعة لا تقدم حدود هجرة رقمية عامة؛ يجب الرجوع إلى النص القانوني أو المعياري الحالي للسوق المستهدف.$kb$, $kb$7e8595b174e79a105682bdaebaa127a628caa859$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-28$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-28$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 3;

-- ---- ch-29: أخذ العينات والتتبع
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-29$kb$, 29, $kb$أخذ العينات والتتبع$kb$, 13, 12
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-29$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$أخذ العينات والتتبع$kb$, $kb$العينة غير الممثلة قد تقود إلى قرار خاطئ. عرّف مجتمع الدفعة وطريقة السحب وعدد العينات وتوزيعها ومَن سحبها ومتى.$kb$, $kb$aab9a41cf11952bd0e87299246734210b541d477$kb$),
  (2, 0, $kb$table$kb$, $kb$أخذ العينات والتتبع$kb$, $kb$| نوع العينة | قاعدة التوثيق |
| --- | --- |
| عينة خام | المورد، الدفعة، نقطة السحب، تاريخ السحب |
| عينة معلق | الخزان، وقت التقليب، نقطة السحب، زمن الراحة |
| عينة جليز مطبق | القطعة، موضع التطبيق، طريقة التطبيق، السُمك |
| عينة فرن | الفرن، الدورة، الموقع، اتجاه القطعة |
| عينة منتج نهائي | خط الإنتاج، التاريخ، الدفعة، نتيجة الفحص |$kb$, $kb$a53c8f91f82f68cf05e6eefff9ddd4211d31c657$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-29$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-29$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 2;

-- ---- ch-30: تحليل الأسباب الجذرية
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-30$kb$, 30, $kb$تحليل الأسباب الجذرية$kb$, 13, 13
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-30$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$تحليل الأسباب الجذرية$kb$, $kb$استخدم منهجًا منظمًا مثل مخطط عظمة السمكة (الأفراد، الآلات، المواد، الطرق، القياس، البيئة) أو أسلوب 5 لماذا. هذه الأدوات تنظم التفكير ولا تثبت السبب بذاتها.$kb$, $kb$04b0d21948001aad267c60ae83c08e135b63b2a5$kb$),
  (2, 0, $kb$list$kb$, $kb$تحليل الأسباب الجذرية$kb$, $kb$- عرّف المشكلة بصيغة قابلة للقياس: ماذا حدث وأين ومتى وكم مرة؟
- حدد خط الأساس ومعدل العيب قبل التغيير.
- اجمع الأدلة من المواد والعملية والقياس والبيئة.
- اكتب عدة فرضيات دون ترجيح مبكر.
- صمم اختبارًا يميز بين الفرضيات.
- نفذ إجراءً تصحيحيًا مضبوطًا ثم تحقق من أثره.
- راقب استمرار التحسن وأغلق الإجراء بعد تحقق موثق.$kb$, $kb$bc21af5f313bfa0d1b6549da1271de63f5b00b36$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-30$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-30$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 2;

-- ---- ch-31: نظام اعتماد الخبرات داخل MAS LAB
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-31$kb$, 31, $kb$نظام اعتماد الخبرات داخل MAS LAB$kb$, 16, 14
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-31$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$table$kb$, $kb$نظام اعتماد الخبرات داخل MAS LAB$kb$, $kb$| الحالة | المعنى | ما يسمح به النظام |
| --- | --- | --- |
| مسودة | بيانات أولية غير مكتملة | الحفظ والتعديل |
| قيد التحليل | تجربة يجري فحصها | التحليل والمقارنة دون اعتماد |
| بانتظار الاعتماد | اكتمل ملف المراجعة | عرضه على صاحب الصلاحية |
| معتمدة | وافق صاحب المختبر صراحة | إتاحتها كخبرة مصنع معتمدة |
| مرفوضة/غير حاسمة | النتيجة لم تثبت أو لم تحقق الهدف | حفظها كتاريخ وعدم استخدامها كقاعدة نجاح |$kb$, $kb$8dcf2d899d6f367b937593ba4225c8dbd38b8559$kb$),
  (2, 0, $kb$paragraph$kb$, $kb$نظام اعتماد الخبرات داخل MAS LAB$kb$, $kb$يجب أن يحتفظ النظام بسجل تدقيق يتضمن من أنشأ التجربة ومن راجعها ومن اعتمدها ومتى وما التعديلات التي حدثت. اعتماد تجربة ناجحة لا يعني صلاحيتها خارج نطاق الخامات والفرن والمنتج والظروف التي اختُبرت فيها.$kb$, $kb$02ffa3e69cdcfd9f527b311ecd3ef17d62c004c1$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-31$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-31$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 2;

-- ---- ch-32: قوالب عملية جاهزة للتسجيل
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$ch-32$kb$, 32, $kb$قوالب عملية جاهزة للتسجيل$kb$, 16, 15
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null),
  (1, $kb$قالب بطاقة خامة$kb$),
  (2, $kb$قالب بطاقة تجربة$kb$),
  (3, $kb$قالب تقرير عيب$kb$)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-32$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 1, $kb$paragraph$kb$, $kb$قوالب عملية جاهزة للتسجيل › قالب بطاقة خامة$kb$, $kb$معرف الخامة: ____ | الاسم: ____ | المورد: ____ | رقم الدفعة: ____ | تاريخ الاستلام: ____ | الرطوبة: ____ | LOI: ____ | XRF: ____ | XRD: ____ | الخواص التشغيلية: ____ | حالة الاعتماد: ____ | المراجع: ____$kb$, $kb$7e5e9664a68d3bc3344315695ded5a0412208ca0$kb$),
  (2, 2, $kb$paragraph$kb$, $kb$قوالب عملية جاهزة للتسجيل › قالب بطاقة تجربة$kb$, $kb$رقم التجربة: ____ | السؤال: ____ | الفرضية: ____ | الخامات وأرقام الدفعات: ____ | المتغيرات: ____ | الثوابت: ____ | طريقة التحضير: ____ | طريقة التشكيل: ____ | برنامج الحريق الفعلي: ____ | موقع العينة: ____ | النتائج الرقمية: ____ | الصور: ____ | الاستنتاج وحدود صلاحيته: ____ | المراجع: ____ | حالة الاعتماد: ____$kb$, $kb$bc09a34833810b4588e340e7ba7c3f617712f518$kb$),
  (3, 3, $kb$paragraph$kb$, $kb$قوالب عملية جاهزة للتسجيل › قالب تقرير عيب$kb$, $kb$رمز العيب: ____ | وصفه: ____ | موضعه: ____ | تاريخ/وردية: ____ | نسبة الحدوث: ____ | المنتج/التصميم: ____ | دفعات الجسم والجليز: ____ | بيانات الفرن: ____ | فرضيات السبب: ____ | الاختبارات: ____ | السبب المثبت: ____ | الإجراء: ____ | نتيجة التحقق: ____$kb$, $kb$1769d005f636d0676716c2649d2920ac9503d976$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$ch-32$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$ch-32$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 3;

-- ---- x-e8449d41: مراجع إضافية للبحث والتوسع
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-e8449d41$kb$, null, $kb$مراجع إضافية للبحث والتوسع$kb$, 16, 16
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-e8449d41$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$list$kb$, $kb$مراجع إضافية للبحث والتوسع$kb$, $kb$- Kingery, Bowen & Uhlmann — Introduction to Ceramics: مرجع تأسيسي في علم المواد السيراميكية.
- Reed — Principles of Ceramics Processing: مرجع في عمليات تحضير وتشكيل السيراميك.
- Singer & Singer — Industrial Ceramics: مرجع موسوعي في الخامات والعمليات والمنتجات.
- Rahaman — Ceramic Processing and Sintering: مرجع في المعالجة والتلبيد.
- ISO 6486 series — Ceramic ware in contact with food: مراجعة الأجزاء والإصدارات السارية حسب السوق.
- ISO 10545 series — Ceramic tiles: مفيد لبعض طرق اختبار السيراميك، لكن لا يُنقل تطبيقه إلى أدوات المائدة إلا إذا كان نطاق المعيار مناسبًا.$kb$, $kb$656fbdd8c2d0de8c96da255f0eabb37365ce4a25$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-e8449d41$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-e8449d41$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 1;

-- ---- x-2ee73308: ملاحظة تحريرية للموسوعة
insert into public.lab_kb_chapters (document_id, chapter_key, chapter_no, title, category_id, seq)
select d.id, $kb$x-2ee73308$kb$, null, $kb$ملاحظة تحريرية للموسوعة$kb$, 16, 17
from public.lab_kb_documents d where d.doc_key = $kb$vol2$kb$
on conflict (document_id, chapter_key) do update set chapter_no = excluded.chapter_no,
  title = excluded.title, category_id = excluded.category_id, seq = excluded.seq;
insert into public.lab_kb_sections (chapter_id, seq, heading)
select c.id, v.seq, v.heading from (values
  (0, null)
) as v(seq, heading)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-2ee73308$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
on conflict (chapter_id, seq) do update set heading = excluded.heading;
insert into public.lab_kb_chunks (chapter_id, section_id, seq, kind, heading_path, content, content_hash)
select c.id, s.id, v.seq, v.kind, v.heading_path, v.content, v.content_hash from (values
  (1, 0, $kb$paragraph$kb$, $kb$ملاحظة تحريرية للموسوعة$kb$, $kb$ينبغي أن تخضع هذه المادة لمراجعة فنية داخل المصنع قبل اعتمادها. عند إضافة معلومة جديدة إلى MAS LAB، احفظ عنوان المصدر والمؤلف والناشر والسنة والصفحة أو رقم المعيار والإصدار. لا تقتبس نصوصًا محمية مطولًا؛ لخّص الفكرة بأسلوب مستقل مع الإحالة إلى المرجع.$kb$, $kb$567d10ea3c6a6c1f43e8a882936e4ddeee3df469$kb$)
) as v(seq, sec_seq, kind, heading_path, content, content_hash)
join public.lab_kb_chapters c on c.chapter_key = $kb$x-2ee73308$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
join public.lab_kb_sections s on s.chapter_id = c.id and s.seq = v.sec_seq
on conflict (chapter_id, seq) do update set section_id = excluded.section_id, kind = excluded.kind,
  heading_path = excluded.heading_path, content = excluded.content,
  content_hash = excluded.content_hash, is_current = true;
update public.lab_kb_chunks k set is_current = false from public.lab_kb_chapters c
where k.chapter_id = c.id and c.chapter_key = $kb$x-2ee73308$kb$
  and c.document_id = (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$)
  and k.seq > 1;

-- ---- المراجع والمعايير
insert into public.lab_kb_sources (source_key, title, url, source_chapter_key, document_id)
select v.source_key, v.title, v.url, v.ck, (select id from public.lab_kb_documents where doc_key = $kb$vol2$kb$) from (values
  ($kb$1bf4cb0bae30e103$kb$, $kb$Kingery, Bowen & Uhlmann — Introduction to Ceramics: مرجع تأسيسي في علم المواد السيراميكية.$kb$, null, $kb$x-e8449d41$kb$),
  ($kb$4a644e463796d3fe$kb$, $kb$Reed — Principles of Ceramics Processing: مرجع في عمليات تحضير وتشكيل السيراميك.$kb$, null, $kb$x-e8449d41$kb$),
  ($kb$80c25809d21a073d$kb$, $kb$Singer & Singer — Industrial Ceramics: مرجع موسوعي في الخامات والعمليات والمنتجات.$kb$, null, $kb$x-e8449d41$kb$),
  ($kb$730cd730db3ec3b8$kb$, $kb$Rahaman — Ceramic Processing and Sintering: مرجع في المعالجة والتلبيد.$kb$, null, $kb$x-e8449d41$kb$),
  ($kb$292282995cf59947$kb$, $kb$ISO 6486 series — Ceramic ware in contact with food: مراجعة الأجزاء والإصدارات السارية حسب السوق.$kb$, null, $kb$x-e8449d41$kb$),
  ($kb$ebd2ad379617dd5d$kb$, $kb$ISO 10545 series — Ceramic tiles: مفيد لبعض طرق اختبار السيراميك، لكن لا يُنقل تطبيقه إلى أدوات المائدة إلا إذا كان نطاق المعيار مناسبًا.$kb$, null, $kb$x-e8449d41$kb$)
) as v(source_key, title, url, ck)
on conflict (source_key) do update set title = excluded.title, url = excluded.url;

-- ---- سجل الاستيراد
insert into public.lab_kb_import_jobs (doc_key, file_name, file_sha256, status, chapters_count, sections_count,
  chunks_count, tables_count, terms_count, sources_count, warnings)
values ($kb$vol2$kb$, $kb$MAS_LAB_Porcelain_Encyclopedia_Vol2_AR.docx$kb$, $kb$aeeeedd2822deea285368ae4a81f7902ecd4f7aabf9b557ee2d13a4d3d8748ed$kb$, 'completed', 17, 29, 48, 6,
  0, 6, $kb$["غلاف المجلد (محتوى قبل أول عنوان): حُفظ كفصل 'front-0'", "رأس/تذييل صفحة غير مستخرج: «MAS LAB | المجلد الثاني — التطبيقات المعملية والحسابات وتشخيص العيوب»"]$kb$::jsonb);

-- ---- اختبار الاكتمال: لو أي عدد غير مطابق يحدث خطأ ويتراجع الاستيراد كله
do $verify$
declare v_ch int; v_sec int; v_chunks int; v_tables int;
begin
  select count(*) into v_ch from public.lab_kb_chapters c join public.lab_kb_documents d on d.id = c.document_id
    where d.doc_key = $kb$vol2$kb$;
  select count(*) into v_sec from public.lab_kb_sections s join public.lab_kb_chapters c on c.id = s.chapter_id
    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = $kb$vol2$kb$;
  select count(*), count(*) filter (where k.kind = 'table') into v_chunks, v_tables
    from public.lab_kb_chunks k join public.lab_kb_chapters c on c.id = k.chapter_id
    join public.lab_kb_documents d on d.id = c.document_id where d.doc_key = $kb$vol2$kb$ and k.is_current;
  if v_ch <> 17 or v_sec <> 29 or v_chunks <> 48 or v_tables <> 6 then
    raise exception 'KB import mismatch: chapters %/17, sections %/29, chunks %/48, tables %/6', v_ch, v_sec, v_chunks, v_tables;
  end if;
end $verify$;

commit;
