import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Icon } from '../../components/Icon'
import MicButton from '../../components/MicButton'
import { Empty, ErrorBox, ListSkeleton } from '../../components/ui'
import { askKb, listCategories, searchKb, type Confidence, type KbResult } from './api'
import ResultCard, { ConfidenceMeter } from './ResultCard'

const SUGGESTIONS = ['Crazing', 'ثقوب الدبوس', 'سبب القلب الأسود', 'امتصاص الماء', 'الصدمة الحرارية', 'توافق الجسم والجليز']
const SMART_KEY = 'mas-kb-smart'

type Tab = 'all' | 'encyclopedia' | 'lab' | 'experience'
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'encyclopedia', label: 'الموسوعة' },
  { key: 'lab', label: 'تجارب المختبر' },
  { key: 'experience', label: 'الخبرات' },
]
const inTab = (r: KbResult, t: Tab) =>
  t === 'all' || (t === 'experience' ? r.layer.endsWith('experience') : r.layer === t)

const CONF_ORDER: Confidence[] = ['low', 'medium', 'high', 'reference']

function readSmart(): boolean {
  try { return localStorage.getItem(SMART_KEY) === '1' } catch { return false }
}
function writeSmart(v: boolean) {
  try { localStorage.setItem(SMART_KEY, v ? '1' : '0') } catch { /* التخزين غير متاح: نتجاهل */ }
}

/** بحث محلي في الموسوعة + تجارب المختبر + الخبرات، مع رد ذكي اختياري (Groq) مبني على المصادر */
export default function KnowledgeSearch({ initialQuery = '', compact = false, onNavigate }: {
  initialQuery?: string
  compact?: boolean
  onNavigate?: () => void
}) {
  const [input, setInput] = useState(initialQuery)
  const [submitted, setSubmitted] = useState(initialQuery.trim())
  const [tab, setTab] = useState<Tab>('all')
  const [category, setCategory] = useState<number | null>(null)
  const [smart, setSmart] = useState<boolean>(readSmart)
  const started = useRef(false)
  const askedFor = useRef('')

  useEffect(() => {
    if (initialQuery && !started.current) {
      started.current = true
      setInput(initialQuery)
      setSubmitted(initialQuery.trim())
    }
  }, [initialQuery])

  const cats = useQuery({ queryKey: ['kb-cats'], queryFn: listCategories, enabled: !compact })
  const results = useQuery({
    queryKey: ['kb-search', submitted, category],
    queryFn: () => searchKb(submitted, null, category),
    enabled: submitted.length >= 2,
  })
  const ask = useMutation({ mutationFn: (q: string) => askKb(q) })

  // الرد الذكي التلقائي (لو المستخدم فعّله): مرة واحدة لكل سؤال بعد ظهور نتائج
  useEffect(() => {
    if (smart && results.data && results.data.length > 0 && askedFor.current !== submitted && !ask.isPending) {
      askedFor.current = submitted
      ask.mutate(submitted)
    }
  }, [smart, results.data, submitted]) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const data = results.data ?? []
    return Object.fromEntries(TABS.map((t) => [t.key, data.filter((r) => inTab(r, t.key)).length])) as Record<Tab, number>
  }, [results.data])
  const shown = (results.data ?? []).filter((r) => inTab(r, tab))

  function run(q: string) {
    const v = q.trim()
    if (v.length < 2) return
    ask.reset()
    askedFor.current = ''
    setTab('all')
    setInput(v)
    setSubmitted(v)
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    run(input)
  }
  function toggleSmart() {
    const next = !smart
    setSmart(next)
    writeSmart(next)
  }

  const lowest = ask.data?.sources.length
    ? ask.data.sources.map((s) => s.confidence).sort((a, b) => CONF_ORDER.indexOf(a) - CONF_ORDER.indexOf(b))[0]
    : null

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input className="input !pe-10" placeholder="اسأل أو ابحث: عيب، خامة، مصطلح، كود عينة…" value={input}
            onChange={(e) => setInput(e.target.value)} maxLength={200} />
          <Icon name="search" size={16} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-faint" />
        </div>
        <MicButton onText={(t) => setInput(t)} />
        <button type="submit" className="btn-primary shrink-0 !px-4" disabled={input.trim().length < 2}>بحث</button>
      </form>

      <button type="button" onClick={toggleSmart} role="switch" aria-checked={smart}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-start">
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <Icon name="sparkles" size={15} className="text-violet-600" />
            الرد الذكي (Groq)
          </span>
          <span className="block text-[11px] leading-snug text-faint">
            {smart ? 'مفعّل: يُرسل السؤال والمصادر الظاهرة إلى Groq تلقائيًا بعد كل بحث.' : 'متوقف: لن يُرسل شيء خارجيًا إلا إذا ضغطت زر الصياغة.'}
          </span>
        </span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${smart ? 'bg-violet-600' : 'bg-line'}`} aria-hidden="true">
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${smart ? 'end-0.5' : 'end-[1.375rem]'}`} />
        </span>
      </button>

      {!submitted && (
        <div className="card space-y-3">
          <div>
            <div className="text-sm font-bold text-ink">ابدأ بسؤال</div>
            <p className="text-xs leading-relaxed text-faint">
              يبحث المساعد في الموسوعة وتجارب المصنع والخبرات المعتمدة، ويعرض لكل نتيجة مصدرها ودرجة الثقة. الرد الذكي لا يستخدم إلا المصادر الظاهرة.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => run(s)}>{s}</button>)}
          </div>
        </div>
      )}

      {submitted && (
        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`chip ${tab === t.key ? 'bg-brand-700 text-white' : ''}`}>
              {t.label}{results.data ? ` (${counts[t.key]})` : ''}
            </button>
          ))}
          {!compact && cats.data && (
            <select className="input !w-auto !py-1 text-xs" value={category ?? ''} aria-label="الباب"
              onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : null)}>
              <option value="">كل الأبواب</option>
              {cats.data.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          )}
        </div>
      )}

      {results.isLoading && <ListSkeleton count={3} />}
      {results.error && <ErrorBox error={results.error} />}

      {results.data && results.data.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3.5 space-y-2.5">
          {!ask.data && !ask.isPending && (
            <>
              <button type="button" className="btn-primary w-full !bg-violet-700" onClick={() => { askedFor.current = submitted; ask.mutate(submitted) }}>
                <Icon name="sparkles" size={16} />
                صياغة إجابة ذكية من هذه المصادر
              </button>
              <p className="text-[11px] leading-snug text-faint">
                عند الضغط يُرسل إلى Groq نص سؤالك ونصوص المصادر الظاهرة (موسوعة، تجارب، تركيبات، خبرات)، بدون صور أو بيانات مستخدمين.
              </p>
            </>
          )}
          {ask.isPending && (
            <div className="space-y-2" aria-busy="true">
              <div className="flex items-center gap-2 text-sm font-bold text-violet-800">
                <Icon name="sparkles" size={16} /> جارٍ صياغة الإجابة من المصادر…
              </div>
              <div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-11/12" /><div className="skeleton h-3 w-2/3" />
            </div>
          )}
          {ask.error && <ErrorBox error={ask.error} />}
          {ask.data && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-800">
                  <Icon name="sparkles" size={15} /> الإجابة الذكية
                </span>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">صياغة آلية</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-7 text-ink">{ask.data.answer ?? 'لا توجد مصادر كافية للإجابة.'}</p>
              {lowest && (
                <div className="rounded-lg bg-surface/80 px-2.5 py-1.5">
                  <ConfidenceMeter c={lowest} />
                  <span className="text-[11px] text-faint"> (أدنى مستوى بين المصادر المستخدمة)</span>
                </div>
              )}
              <ul className="space-y-1 border-t border-violet-200 pt-2 text-[11px] text-faint">
                {ask.data.sources.map((s) => (
                  <li key={s.n}>
                    <span className="font-bold text-violet-800">[{s.n}]</span>{' '}
                    <Link to={s.link_path} onClick={onNavigate} className="font-bold text-brand-700">{s.title}</Link>
                    {' — '}{s.source_label}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] leading-snug text-faint">راجع المصادر قبل اتخاذ أي قرار تشغيلي. الإجابة لا تعتبر خبرة معتمدة.</p>
            </div>
          )}
        </div>
      )}

      {results.data && shown.length === 0 && (
        <Empty text="لا توجد نتائج هنا. جرّب كلمة أخرى، أو سجّل تجربة لتوثيق هذه الحالة في المختبر." icon="search" />
      )}
      <div className="space-y-2.5">
        {shown.map((r) => <ResultCard key={`${r.layer}-${r.ref_id}`} r={r} onNavigate={onNavigate} />)}
      </div>
    </div>
  )
}
