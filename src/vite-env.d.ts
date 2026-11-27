/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  /** رابط برنامج المصنع (للرجوع إليه). الافتراضي ../index.html */
  readonly VITE_MAIN_APP_URL?: string
  /** 'true' = إرسال تلقائي لجروب واتساب بعد اعتماد النتيجة (يحتاج دالة lab-whatsapp) */
  readonly VITE_WHATSAPP_AUTO?: string
  /** الرابط العام للمختبر (للمشاركة من تطبيق الموبايل) */
  readonly VITE_PUBLIC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
