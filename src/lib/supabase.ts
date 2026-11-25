import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'ملف .env ناقص: لازم VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY (انسخ .env.example إلى .env)',
  )
}

// المفتاح العام (Publishable) فقط. الحماية الفعلية من سياسات RLS في قاعدة البيانات.
export const supabase = createClient(url, key)
