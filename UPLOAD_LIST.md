# ملفات الرفع إلى GitHub (21 ملفًا) — ارفعها بنفس المسارات

## جديدة (13)
- src/features/knowledge/: api.ts, ResultCard.tsx, KnowledgeSearch.tsx, KnowledgePage.tsx, ChapterPage.tsx, ExperiencesPage.tsx, ExperienceDetailPage.tsx
- supabase/migrations/: 009_kb_schema.sql, 010_kb_set_approver.sql, 011_kb_import_vol1.sql, 012_kb_import_vol2.sql, 013_kb_import_vol3.sql
- tools/kb_import/: build_kb.py, import_report.md

## معدّلة (8) — تستبدل الموجودة
- src/App.tsx
- src/components/nav.ts
- src/components/AssistantPanel.tsx
- src/components/PhotoCaptureSheet.tsx
- src/features/assistant/AssistantPage.tsx
- src/features/samples/ResultCard.tsx
- supabase/functions/lab-ai/index.ts   (يُنشر أيضًا يدويًا في Supabase Edge Functions)

لا تحتاج تعديل: package.json ولا أي ملف آخر.
ملفات supabase/migrations هنا للتوثيق فقط؛ تشغيلها يتم من SQL Editor (لا يعمل نشر GitHub على قاعدة البيانات).
