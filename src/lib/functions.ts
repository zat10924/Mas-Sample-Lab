import { supabase } from './supabase'

/** استدعاء Edge Function مع إظهار رسالة الخطأ الحقيقية القادمة من الدالة */
export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    let message = error.message
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const payload = await ctx.json()
        if (payload && typeof payload.error === 'string') message = payload.error
      } catch {
        // نتجاهل: نستخدم رسالة الخطأ الأصلية
      }
    }
    throw new Error(message)
  }
  return data as T
}
