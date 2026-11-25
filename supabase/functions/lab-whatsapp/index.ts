// =====================================================================
// lab-whatsapp: يبعت إشعار لجروب واتساب بعد اعتماد نتيجة عينة.
//   { result_id, app_url? }
//
// يستخدم WhatsApp Cloud API (Groups API الرسمي). المتطلبات:
//   * رقم شغال مع Cloud API (مش تطبيق WhatsApp Business العادي).
//   * جروب اتعمل من الـ API نفسه (الأعضاء بيدخلوه برابط دعوة).
//
// Secrets المطلوبة (Supabase > Edge Functions > Secrets):
//   WHATSAPP_TOKEN            توكن دائم من Meta (System User)
//   WHATSAPP_PHONE_NUMBER_ID  معرّف رقم الأعمال
//   WHATSAPP_GROUP_ID         معرّف الجروب (من Groups API)
// اختياري:
//   WHATSAPP_ONLY_DEFECTS=true   ابعت فقط لو النتيجة فيها عيوب
//   WHATSAPP_API_VERSION=v21.0   إصدار Graph API
//   ALLOWED_ORIGIN
//
// الأمان: نص الرسالة بيتبني هنا من قاعدة البيانات بصلاحيات المستخدم (RLS)،
// فالواجهة ما تقدرش تبعت نص حر للجروب. يحتاج صلاحية "تعديل".
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const FINISH_AR: Record<string, string> = { G: 'لامع', S: 'نصف مط', M: 'مط' }
const COLOR_AR: Record<string, string> = { '1': 'مطابق', '2': 'قريب', '3': 'بعيد' }
const DEFECT_AR: Record<string, string> = { P: 'ثقوب دبوسية', C: 'تكوّر', R: 'تشقق', B: 'فقاعات' }

function describe(code: string): string {
  const m = /^([GSM])([123])-(0|[PCRB]+)$/.exec(code)
  if (!m) return code
  const defects = m[3] === '0' ? 'بدون عيوب' : m[3].split('').map((d) => DEFECT_AR[d] ?? d).join(' + ')
  return `${FINISH_AR[m[1]]} - لون ${COLOR_AR[m[2]]} - ${defects}`
}

async function requireEdit(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'غير مصرح: سجّل الدخول أولًا')
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  if (!url || !key) throw new HttpError(500, 'إعدادات Supabase ناقصة في الدالة')

  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) throw new HttpError(401, 'جلسة غير صالحة')
  const { data: level, error: levelError } = await client.rpc('lab_level')
  if (levelError || level !== 'edit') throw new HttpError(403, 'مالكش صلاحية التعديل')
  return client
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json().catch(() => null)) as { result_id?: unknown; app_url?: unknown } | null
    if (!body || typeof body.result_id !== 'string') throw new HttpError(400, 'result_id مطلوب')

    const token = Deno.env.get('WHATSAPP_TOKEN')
    const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    const groupId = Deno.env.get('WHATSAPP_GROUP_ID')
    if (!token || !phoneId || !groupId) throw new HttpError(500, 'إعدادات واتساب ناقصة في Secrets')

    const client = await requireEdit(req)

    const { data: result, error } = await client
      .from('lab_sample_results')
      .select('final_code, reviewer_notes, sample:lab_samples(code, firing_temp, recipe:lab_recipes(code, name))')
      .eq('id', body.result_id)
      .single()
    if (error || !result) throw new HttpError(404, 'النتيجة غير موجودة')
    if (!result.final_code) throw new HttpError(400, 'النتيجة لسه ما اتعتمدتش')

    const hasDefects = !/-0$/.test(result.final_code)
    if (Deno.env.get('WHATSAPP_ONLY_DEFECTS') === 'true' && !hasDefects) {
      return json({ sent: false, reason: 'no_defects' })
    }

    // الربط بالجداول المتداخلة ممكن يرجع object أو array حسب العلاقة
    const first = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null))
    const sample = first(result.sample as unknown as Record<string, unknown> | Record<string, unknown>[])
    const recipe = first((sample?.recipe ?? null) as { code: string; name: string } | { code: string; name: string }[] | null)

    const appUrl = typeof body.app_url === 'string' && /^https:\/\//.test(body.app_url) ? body.app_url : null
    const lines = [
      `${hasDefects ? '⚠️' : '✅'} نتيجة عينة ${sample?.code ?? ''}`.trim(),
      recipe ? `التركيبة: ${recipe.name} (${recipe.code})` : null,
      sample?.firing_temp ? `الحرق: ${sample.firing_temp}°م` : null,
      `النتيجة: ${result.final_code}`,
      describe(result.final_code),
      result.reviewer_notes ? `ملاحظات: ${result.reviewer_notes}` : null,
      appUrl,
    ]
    const text = lines.filter((l): l is string => !!l).join('\n')

    const version = Deno.env.get('WHATSAPP_API_VERSION') ?? 'v21.0'
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'group',
        to: groupId,
        type: 'text',
        text: { body: text },
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      console.error('WhatsApp error', res.status, (await res.text()).slice(0, 500))
      throw new HttpError(502, `فشل الإرسال لواتساب (${res.status})`)
    }
    return json({ sent: true })
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'خطأ غير متوقع' }, 500)
  }
})
