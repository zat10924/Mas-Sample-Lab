import { supabase } from './supabase'
import { describeResultCode } from './codes'
import type { SampleComponent, SampleDetail } from '../types/db'
import { formatComponent } from './units'

/** نص رسالة العينة للمشاركة اليدوية */
export function buildSampleMessage(s: SampleDetail, finalCode: string | null, url: string, components: SampleComponent[] = []): string {
  const lines = [
    `🏺 عينة ${s.code}`,
    s.recipe ? `التركيبة: ${s.recipe.name} (${s.recipe.code})` : null,
    components.length > 0 ? `المكونات:\n${components.map((c) => `• ${c.material}: ${formatComponent(c.amount, c.unit)}`).join('\n')}` : null,
    s.firing_temp ? `الحرق: ${s.firing_temp}°م` : null,
    finalCode ? `النتيجة: ${finalCode}` : 'النتيجة: لسه ما اتقيّمتش',
    finalCode ? describeResultCode(finalCode) : null,
    url,
  ]
  return lines.filter((l): l is string => !!l).join('\n')
}

/** يفتح واتساب برسالة جاهزة، والمستخدم يختار الجروب ويدوس إرسال */
export async function shareToWhatsApp(text: string): Promise<void> {
  const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> }
  // على الموبايل: قائمة المشاركة الأصلية (فيها واتساب)
  if (typeof nav.share === 'function' && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await nav.share({ text })
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}

/** هل الإرسال التلقائي مفعّل؟ (VITE_WHATSAPP_AUTO=true وقت البناء) */
export const WHATSAPP_AUTO: boolean = import.meta.env.VITE_WHATSAPP_AUTO === 'true'

/** إشعار تلقائي للجروب بعد اعتماد النتيجة. بيفشل بصمت لأنه مش حرج. */
export async function notifyReview(resultId: string): Promise<void> {
  if (!WHATSAPP_AUTO) return
  try {
    await supabase.functions.invoke('lab-whatsapp', {
      body: { result_id: resultId, app_url: window.location.origin + window.location.pathname },
    })
  } catch (e) {
    console.warn('WhatsApp notify failed', e)
  }
}

/* ---------- فتح جروب موجود (الرابط محفوظ على الجهاز فقط، مش في الكود) ---------- */
const GROUP_KEY = 'mas-lab-wa-group'
const GROUP_RE = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/

function readGroupLink(): string | null {
  try {
    return localStorage.getItem(GROUP_KEY)
  } catch {
    return null
  }
}

/** يحفظ رابط الجروب على هذا الجهاز. بيرجّع false لو الرابط غير صالح */
export function saveGroupLink(input: string): boolean {
  const m = GROUP_RE.exec(input.trim())
  if (!m) return false
  try {
    localStorage.setItem(GROUP_KEY, m[0])
  } catch {
    // التخزين غير متاح: هنطلب الرابط في كل مرة
  }
  return true
}

export function clearGroupLink(): void {
  try {
    localStorage.removeItem(GROUP_KEY)
  } catch {
    // تجاهل
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** ينسخ الرسالة ويفتح الجروب، والمستخدم يلصق ويرسل. بيرجّع رسالة للعرض أو null */
export async function copyAndOpenGroup(text: string): Promise<string | null> {
  let link = readGroupLink()
  if (!link) {
    const entered = window.prompt('الصق رابط جروب واتساب (يتحفظ على جهازك بس):')
    if (!entered) return null
    if (!saveGroupLink(entered)) return 'الرابط غير صالح، لازم يبدأ بـ https://chat.whatsapp.com/'
    link = readGroupLink() ?? entered.trim()
  }
  const copied = await copyText(text)
  window.open(link, '_blank', 'noopener')
  return copied ? 'اتنسخت الرسالة، الصقها في الجروب' : 'تعذر النسخ التلقائي، استخدم زرار واتساب العادي'
}
