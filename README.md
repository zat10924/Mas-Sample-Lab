# مختبر الماس (MAS Sample Lab)

تطبيق ويب عربي (RTL) لإدارة تركيبات الجليز والبورسلين، وتسجيل عينات المختبر، ورفع صور ما بعد الحرق،
وتحليلها بالذكاء الاصطناعي (Gemini) واقتراح كود النتيجة، وأنت اللي بتراجع وتعتمد.

يشتغل مع برنامج المصنع بنفس قاعدة Supabase ونفس تسجيل الدخول (بدون حساب جديد).

## أكواد النظام
- التركيبة: `GL-001` (جليز ملوّن) / `MT-001` (مط/أبيض)
- العينة: `MAS-YYYY-0001` (تلقائي)
- النتيجة: `[اللمعة G/S/M][اللون 1/2/3]-[العيوب P/C/R/B أو 0]` مثال `G1-0`، `M2-PC`

## الصلاحيات
- admin (مدير) = تعديل كامل
- owner (صاحب المصنع) = عرض فقط
- باقي الأدوار = لا وصول، إلا لو المدير أعطاهم "عرض" أو "تعديل" من شاشة 🔑 الصلاحيات داخل المختبر

## خطوات التشغيل (من الموبايل)

### 1) قاعدة البيانات (Supabase > SQL Editor)
شغّل الملفات بالترتيب، كل واحد في استعلام لوحده:
1. `supabase/migrations/000_cleanup_old_version.sql` — **فقط** لو كنت شغّلت الملف القديم `001_schema.sql` قبل كده. لو ما شغّلتوش: تخطّى.
2. `supabase/migrations/001_lab_schema.sql`
3. `supabase/migrations/002_seed_recipes.sql` (30 تركيبة)
4. `supabase/migrations/003_lab_access_control.sql` — تحكم في وصول كل مستخدم للمختبر (حتى المدراء)

> ممنوع تشغيل `001_schema.sql` القديم أبدًا.

### 2) الذكاء الاصطناعي (Edge Function)
1. Supabase > Edge Functions > Create function باسم `lab-ai`، والصق محتوى `supabase/functions/lab-ai/index.ts`.
2. تأكد أن **Verify JWT** مفعّل.
3. Edge Functions > Secrets: أضف `GEMINI_API_KEY` (اختياري: `GEMINI_MODEL`، `ALLOWED_ORIGIN`).

### 3) النشر على GitHub Pages
1. أنشئ مستودع باسم `mas-sample-lab` وارفع الملفات (مع `.github/workflows/deploy.yml`).
2. Settings > Pages > Source = **GitHub Actions**.
3. بعد أول تشغيل ناجح للـ Action يظهر على: `https://zat10924.github.io/mas-sample-lab/`

### 4) الربط بقائمة برنامج المصنع
عدّل `common.js` في مستودع المصنع بثلاث تعديلات (بحث واستبدال):
1. بعد السطر `const AI=["ai.html","المساعد الذكي","spark","#642631"];` أضف:
   `const LAB=["mas-sample-lab/","المختبر","flask","#B8862B"];`
2. استبدل `const ICONS={` بـ:
   `const ICONS={` + سطر جديد: `flask:'<path d="M9 3h6M10 3v6L5 18.2A2 2 0 0 0 6.8 21h10.4a2 2 0 0 0 1.8-2.8L14 9V3"/><path d="M7.5 14.5h9"/>',`
3. استبدل `${grp("التقارير والبحث",` بـ:
   `${grp("المختبر",[sg(LAB)])}` + سطر جديد + `  ${grp("التقارير والبحث",`

## الأمان
- الواجهة تستخدم المفتاح العام (Publishable) فقط. مفتاح `SUPABASE_SECRET_KEY` ومفتاح Gemini **لا يوضعان في الكود أبدًا**؛ مفتاح Gemini موجود كـ Secret في Edge Function فقط.
- كل جداول المختبر بادئتها `lab_` ومحمية بـ RLS، وصور العينات في Bucket خاص بروابط موقّعة.
- لا يتم إنشاء أي trigger أو سياسة على جداول برنامج المصنع.

## التشغيل المحلي (اختياري)
```
cp .env.example .env
npm install
npm run dev
```
