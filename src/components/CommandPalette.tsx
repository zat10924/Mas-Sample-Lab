import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listSamples } from '../features/samples/api'
import { listRecipes } from '../features/recipes/api'
import { useAuth } from '../features/auth/AuthProvider'
import { Icon, type IconName } from './Icon'
import { finalCodeOf } from '../lib/stats'
import { parseQuickEntry, sampleFormUrl } from '../lib/quickEntry'

interface Item {
  id: string
  group: string
  label: string
  sub?: string
  icon: IconName
  highlight?: boolean
  run: () => void
}

/** بحث شامل + مساعد إدخال سريع. بيفتح بـ Ctrl+K أو من زرار البحث */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { canWrite } = useAuth()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const samples = useQuery({ queryKey: ['samples'], queryFn: listSamples, enabled: open })
  const recipes = useQuery({ queryKey: ['recipes'], queryFn: listRecipes, enabled: open })

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const go = (path: string) => {
    onClose()
    navigate(path)
  }

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase()
    const out: Item[] = []

    if (!q) {
      if (canWrite) {
        out.push({ id: 'a-new-sample', group: 'إجراءات سريعة', label: 'عينة جديدة', icon: 'plus', run: () => go('/samples/new') })
        out.push({ id: 'a-new-recipe', group: 'إجراءات سريعة', label: 'تركيبة جديدة', icon: 'plus', run: () => go('/recipes/new') })
      }
      out.push({ id: 'a-compare', group: 'إجراءات سريعة', label: 'مقارنة', icon: 'compare', run: () => go('/compare') })
      out.push({ id: 'a-ai', group: 'إجراءات سريعة', label: 'المساعد الذكي', icon: 'sparkles', run: () => go('/assistant') })
      for (const s of (samples.data ?? []).slice(0, 4)) {
        out.push({
          id: `s-${s.id}`,
          group: 'آخر العينات',
          label: s.code,
          sub: s.recipe?.name ?? 'بدون تركيبة',
          icon: 'vase',
          run: () => go(`/samples/${s.id}`),
        })
      }
      return out
    }

    // مساعد الإدخال: «عينة GL-005 1.5 كجم حرق 1200 غمس»
    const quick = canWrite ? parseQuickEntry(query) : null
    if (quick) {
      const recipe = quick.recipeCode ? (recipes.data ?? []).find((r) => r.code === quick.recipeCode) : null
      const parts = [
        quick.recipeCode ? (recipe ? `${recipe.code} · ${recipe.name}` : `${quick.recipeCode} (مش موجودة)`) : null,
        quick.kg ? `${quick.kg} كجم` : null,
        quick.temp ? `${quick.temp}°م` : null,
        quick.method,
      ].filter(Boolean)
      out.push({
        id: 'quick',
        group: 'مساعد الإدخال',
        label: 'سجّل عينة بالبيانات دي',
        sub: parts.join(' · '),
        icon: 'sparkles',
        highlight: true,
        run: () => go(sampleFormUrl({ recipeId: recipe?.id, kg: quick.kg, temp: quick.temp, method: quick.method })),
      })
    }

    const sm = (samples.data ?? [])
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          (s.recipe?.name ?? '').toLowerCase().includes(q) ||
          (s.recipe?.code ?? '').toLowerCase().includes(q) ||
          (finalCodeOf(s) ?? '').toLowerCase().includes(q) ||
          (s.body_type ?? '').toLowerCase().includes(q) ||
          s.components.some((c) => c.material.toLowerCase().includes(q)),
      )
      .slice(0, 6)
    for (const s of sm) {
      const fc = finalCodeOf(s)
      out.push({
        id: `s-${s.id}`,
        group: 'العينات',
        label: s.code,
        sub: [s.recipe?.name, fc].filter(Boolean).join(' · '),
        icon: 'vase',
        run: () => go(`/samples/${s.id}`),
      })
    }

    const rm = (recipes.data ?? [])
      .filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.material.toLowerCase().includes(q)),
      )
      .slice(0, 6)
    for (const r of rm) {
      const viaMaterial = !r.code.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q)
      out.push({
        id: `r-${r.id}`,
        group: 'التركيبات',
        label: `${r.code} · ${r.name}`,
        sub: viaMaterial ? `فيها خامة مطابقة للبحث` : undefined,
        icon: 'flask',
        run: () => go(`/recipes/${r.id}`),
      })
    }

    if (q.length >= 3) {
      out.push({
        id: 'ask-ai',
        group: 'اسأل المساعد',
        label: `اسأل: ${query.trim()}`,
        icon: 'sparkles',
        run: () => go(`/assistant?q=${encodeURIComponent(query.trim())}`),
      })
    }
    return out
  }, [query, samples.data, recipes.data, canWrite]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setActive(0), [query])

  if (!open) return null

  function onKeyDown(e: ReactKeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[active]?.run()
    }
  }

  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-3 pt-[8vh] backdrop-blur-sm fade-in" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="بحث شامل"
        className="pop-in w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Icon name="search" size={18} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            className="w-full bg-transparent py-3.5 text-base text-ink placeholder:text-faint focus:outline-none"
            placeholder="ابحث، أو اكتب: عينة GL-005 1.5 كجم حرق 1200 غمس"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" onClick={onClose} className="shrink-0 rounded-md bg-tint px-2 py-1 text-[11px] font-bold text-mute">
            Esc
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-mute">
              {samples.isLoading || recipes.isLoading ? 'جاري البحث...' : 'مفيش نتائج'}
            </div>
          )}
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? it.group : null
            lastGroup = it.group
            return (
              <div key={it.id}>
                {header && <div className="px-3 pb-1 pt-2 text-[11px] font-bold text-faint">{header}</div>}
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={it.run}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors ${
                    i === active ? 'bg-brand-50 text-brand-900' : 'text-ink'
                  } ${it.highlight ? 'ring-1 ring-gold' : ''}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${it.highlight ? 'bg-gold text-white' : 'bg-tint text-mute'}`}>
                    <Icon name={it.icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{it.label}</span>
                    {it.sub && <span className="block truncate text-xs text-mute">{it.sub}</span>}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
