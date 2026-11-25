// =====================================================================
// lab-ai: دالة واحدة لذكاء المختبر (ملف واحد يتلصق مباشرة في Supabase Dashboard)
//   { action: "analyze", result_id }  -> تحليل صورة عينة بعد الحرق (يحتاج صلاحية تعديل)
//   { action: "chat", messages }      -> المساعد الفني (يحتاج صلاحية عرض على الأقل)
//
// الأمان:
//   * التحقق من تسجيل الدخول ومن صلاحية المختبر (دالة lab_level في قاعدة البيانات).
//   * الاتصال بقاعدة البيانات بصلاحيات المستخدم نفسه، فسياسات RLS سارية.
//   * مفتاح Gemini في Secrets فقط (GEMINI_API_KEY). مفيش أي مفتاح سري ثاني مستخدم هنا.
//
// تغيير المحرك مستقبلًا: أضف provider جديد بنفس الواجهة AiProvider، سجّله في getProvider()،
// وغيّر الـ Secret الاسم AI_PROVIDER. الواجهة (React) ما بتتغير.
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

// ---------- CORS + مساعدات ----------
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

// ---------- كود النتيجة (نفس منطق src/lib/codes.ts في الواجهة) ----------
const FINISHES = ['G', 'S', 'M'] as const
const COLORS = [1, 2, 3] as const
const DEFECTS = ['P', 'C', 'R', 'B'] as const
type Finish = (typeof FINISHES)[number]
type ColorMatch = (typeof COLORS)[number]

function buildResultCode(finish: Finish, color: ColorMatch, defects: string[]): string {
  const ordered = DEFECTS.filter((d) => defects.includes(d))
  return `${finish}${color}-${ordered.length > 0 ? ordered.join('') : '0'}`
}

// ---------- محرك الذكاء الاصطناعي (قابل للاستبدال) ----------
interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

interface AiProvider {
  name: string
  analyzeImage(input: { imageBase64: string; mimeType: string; prompt: string }): Promise<string>
  chat(input: { system: string; messages: ChatTurn[] }): Promise<string>
}

const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash' // يتغير من Secret الاسم GEMINI_MODEL
const AI_TIMEOUT_MS = 55_000

async function geminiGenerate(body: unknown): Promise<string> {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new HttpError(500, 'مفتاح Gemini غير مضبوط: أضف GEMINI_API_KEY في Secrets')
  const model = Deno.env.get('GEMINI_MODEL') ?? GEMINI_DEFAULT_MODEL

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    },
  )
  if (!res.ok) {
    console.error('Gemini error', res.status, (await res.text()).slice(0, 500))
    throw new HttpError(502, `فشل الاتصال بـ Gemini (${res.status})`)
  }
  const data = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts
  const text = Array.isArray(parts) ? parts.map((p: { text?: string }) => p.text ?? '').join('') : ''
  if (!text) throw new HttpError(502, 'Gemini لم يرجّع ردًا (ممكن الصورة أو السؤال اترفض)')
  return text
}

const geminiProvider: AiProvider = {
  name: 'gemini',
  analyzeImage({ imageBase64, mimeType, prompt }) {
    return geminiGenerate({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }],
        },
      ],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    })
  },
  chat({ system, messages }) {
    return geminiGenerate({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.5 },
    })
  },
}

function getProvider(): AiProvider {
  const name = (Deno.env.get('AI_PROVIDER') ?? 'gemini').toLowerCase()
  switch (name) {
    case 'gemini':
      return geminiProvider
    default:
      throw new HttpError(500, `AI_PROVIDER غير مدعوم: ${name}`)
  }
}

// ---------- التحقق من المستخدم وصلاحية المختبر ----------
async function requireLevel(req: Request, needed: 'view' | 'edit') {
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
  if (userError || !userData.user) throw new HttpError(401, 'جلسة غير صالحة، سجّل الدخول من جديد')

  const { data: level, error: levelError } = await client.rpc('lab_level')
  if (levelError || !level) throw new HttpError(403, 'مفيش صلاحية لدخول المختبر')
  if (needed === 'edit' && level !== 'edit') throw new HttpError(403, 'مالكش صلاحية التعديل')

  return { client }
}

// ---------- تحليل الصورة ----------
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function buildPrompt(recipeName: string | null, recipeCode: string | null): string {
  const expected = recipeName
    ? `التركيبة المتوقعة للعينة: ${recipeName} (${recipeCode}). قيّم مطابقة اللون على أساس اسم هذه التركيبة.`
    : 'لا توجد تركيبة محددة، قيّم اللون بشكل عام.'

  return `أنت خبير في جليز السيراميك والبورسلين. حلل صورة عينة جليز بعد الحرق.
${expected}

أعد JSON فقط بهذا الشكل بالضبط:
{
  "summary": "ملخص بالعربية في جملتين أو ثلاث: اللون، اللمعان، وأي عيوب ظاهرة",
  "finish": "G أو S أو M",
  "color_match": 1 أو 2 أو 3,
  "defects": ["P","C","R","B"],
  "confidence": رقم بين 0 و 1,
  "notes": "ملاحظات اختيارية أو فارغ"
}

القواعد:
- finish: G = لامع، S = نصف مط، M = مط.
- color_match: 1 = مطابق للون المتوقع، 2 = قريب، 3 = بعيد.
- defects: اذكر فقط العيوب الظاهرة فعلًا في الصورة، أو اتركها فارغة. P = pinholes (ثقوب دبوسية)، C = crawling (تكوّر الجليز)، R = crazing (تشقق)، B = blistering (فقاعات).
- لو الصورة غير واضحة أو الإضاءة تغيّر اللون، قلّل confidence واذكر السبب في notes.
- لا تخترع عيوبًا غير ظاهرة.`
}

function sanitize(raw: unknown) {
  if (!raw || typeof raw !== 'object') throw new HttpError(502, 'رد الذكاء الاصطناعي غير صالح')
  const r = raw as Record<string, unknown>

  const finish = String(r.finish ?? '').toUpperCase() as Finish
  if (!FINISHES.includes(finish)) throw new HttpError(502, 'رد الذكاء الاصطناعي: قيمة اللمعان غير صالحة')

  const color = Number(r.color_match) as ColorMatch
  if (!COLORS.includes(color)) throw new HttpError(502, 'رد الذكاء الاصطناعي: قيمة مطابقة اللون غير صالحة')

  const defects = Array.isArray(r.defects)
    ? [...new Set(r.defects.map((d) => String(d).toUpperCase()))].filter((d) =>
        (DEFECTS as readonly string[]).includes(d),
      )
    : []

  return {
    summary: String(r.summary ?? '').slice(0, 800),
    finish,
    color_match: color,
    defects,
    confidence: Math.min(1, Math.max(0, Number(r.confidence) || 0)),
    notes: String(r.notes ?? '').slice(0, 500),
  }
}

async function analyze(req: Request, body: Record<string, unknown>): Promise<Response> {
  const { client } = await requireLevel(req, 'edit')

  const resultId = typeof body.result_id === 'string' ? body.result_id : ''
  if (!resultId) throw new HttpError(400, 'result_id مطلوب')

  // القراءة بصلاحيات المستخدم، فسياسات RLS سارية
  const { data: result, error: resultError } = await client
    .from('lab_sample_results')
    .select('id, image_path, sample_id')
    .eq('id', resultId)
    .maybeSingle()
  if (resultError || !result) throw new HttpError(404, 'النتيجة غير موجودة')

  const { data: sample } = await client
    .from('lab_samples')
    .select('recipe:lab_recipes(code, name)')
    .eq('id', result.sample_id)
    .maybeSingle()
  const recipe = (sample?.recipe ?? null) as { code: string; name: string } | null

  const { data: file, error: downloadError } = await client.storage
    .from('lab-sample-images')
    .download(result.image_path)
  if (downloadError || !file) throw new HttpError(404, 'تعذّر قراءة الصورة من التخزين')

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length > 8 * 1024 * 1024) throw new HttpError(413, 'الصورة كبيرة جدًا للتحليل')

  const text = await getProvider().analyzeImage({
    imageBase64: toBase64(bytes),
    mimeType: file.type || 'image/jpeg',
    prompt: buildPrompt(recipe?.name ?? null, recipe?.code ?? null),
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new HttpError(502, 'رد الذكاء الاصطناعي مش بصيغة JSON، جرّب تاني')
  }
  const analysis = sanitize(parsed)
  const suggestedCode = buildResultCode(analysis.finish, analysis.color_match, analysis.defects)

  const { error: updateError } = await client
    .from('lab_sample_results')
    .update({ ai_analysis: analysis, ai_suggested_code: suggestedCode })
    .eq('id', resultId)
  if (updateError) throw new HttpError(500, 'تعذّر حفظ نتيجة التحليل')

  return json({ ok: true, ai_suggested_code: suggestedCode, analysis })
}

// ---------- المساعد الفني ----------
const SYSTEM_PROMPT = `أنت مساعد فني لمعمل عينات البورسلين والسيراميك (مصنع الماس للخزف والصيني).
تخصصك: تركيبات الجليز (الشفاف، الملوّن، المط، الأبيض)، الأكاسيد والبودر الملوّنة، الزخرفة، الحرق، وعيوب الجليز مثل pinholes و crawling و crazing و blistering.
- أجب بالعربية المبسطة وبشكل عملي ومختصر.
- لا تخترع أرقامًا أو نسبًا. لو غير متأكد قل ذلك صراحة واقترح تجربة عينة صغيرة للتأكد.
- عند ذكر مواد خطرة (كوبلت، كروم، رصاص...) نبّه باختصار لإجراءات السلامة.
- القرار النهائي دائمًا للفني بعد تجربة العينة.`

async function chat(req: Request, body: Record<string, unknown>): Promise<Response> {
  await requireLevel(req, 'view')

  const raw: unknown[] = Array.isArray(body.messages) ? body.messages : []
  const messages: ChatTurn[] = raw
    .slice(-20)
    .filter((m): m is ChatTurn => {
      if (!m || typeof m !== 'object') return false
      const t = m as ChatTurn
      return (
        (t.role === 'user' || t.role === 'assistant') &&
        typeof t.content === 'string' &&
        t.content.trim().length > 0
      )
    })
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    throw new HttpError(400, 'اكتب سؤالًا أولًا')
  }

  const reply = await getProvider().chat({ system: SYSTEM_PROMPT, messages })
  return json({ reply })
}

// ---------- نقطة الدخول ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.action !== 'string') throw new HttpError(400, 'action مطلوب')

    switch (body.action) {
      case 'analyze':
        return await analyze(req, body)
      case 'chat':
        return await chat(req, body)
      default:
        throw new HttpError(400, 'action غير معروف')
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'خطأ غير متوقع' }, 500)
  }
})
