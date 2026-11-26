import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { COMPONENT_UNITS, formatNumber, parseNumber, totalWeightGrams } from '../../lib/units'
import { parseComponents } from '../../lib/quickEntry'
import type { ComponentUnit } from '../../types/db'

export interface ComponentRow {
  key: string
  material: string
  amount: string
  unit: ComponentUnit
}

export function newRow(partial: Partial<ComponentRow> = {}): ComponentRow {
  return { key: Math.random().toString(36).slice(2), material: '', amount: '', unit: 'g', ...partial }
}

interface Props {
  rows: ComponentRow[]
  onChange: (rows: ComponentRow[]) => void
  suggestions: string[]
  recipes: { id: string; label: string }[]
  onLoadRecipe: (recipeId: string) => Promise<void>
}

/** محرّر مكونات العينة: لصق سريع + صفوف + تحميل من تركيبة */
export default function ComponentsEditor({ rows, onChange, suggestions, recipes, onLoadRecipe }: Props) {
  const [paste, setPaste] = useState('')
  const [recipePick, setRecipePick] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key: string, patch: Partial<ComponentRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const remove = (key: string) => onChange(rows.filter((r) => r.key !== key))

  function addFromPaste() {
    const parsed = parseComponents(paste)
    if (parsed.length === 0) return
    const base = rows.length === 1 && rows[0].material === '' && rows[0].amount === '' ? [] : rows
    onChange([...base, ...parsed.map((p) => newRow(p))])
    setPaste('')
  }

  async function loadRecipe() {
    if (!recipePick) return
    setLoading(true)
    try {
      await onLoadRecipe(recipePick)
      setRecipePick('')
    } finally {
      setLoading(false)
    }
  }

  const valid = rows
    .map((r) => ({ amount: parseNumber(r.amount), unit: r.unit, material: r.material.trim() }))
    .filter((r): r is { amount: number; unit: ComponentUnit; material: string } => r.amount !== null && r.material !== '')
  const weight = totalWeightGrams(valid)
  const liquids = valid.filter((r) => r.unit === 'ml' || r.unit === 'l')

  return (
    <div className="space-y-3">
      <datalist id="component-material-list">
        {suggestions.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="rounded-xl border border-dashed border-line bg-page p-3">
        <label className="label !mb-1.5">اكتب كل المكونات مرة واحدة</label>
        <textarea
          className="input min-h-[4.5rem] text-sm"
          placeholder="جليز شفاف 1 كجم + أكسيد نحاس 20 جم + فريت 50 جم + كربونات كالسيوم 5 جم"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-faint">افصل بين المكونات بـ + أو سطر جديد</span>
          <button type="button" className="btn-secondary !px-3 !py-2" onClick={addFromPaste} disabled={paste.trim() === ''}>
            <Icon name="plus" size={16} />
            حوّلها لمكونات
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.key} className="pop-in rounded-xl border border-line bg-surface p-2.5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">
                {i + 1}
              </span>
              <input
                className="input !py-2"
                list="component-material-list"
                placeholder="اسم المكوّن (جليز شفاف، أكسيد نحاس...)"
                value={r.material}
                onChange={(e) => update(r.key, { material: e.target.value })}
              />
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-faint hover:bg-red-50 hover:text-red-600"
                onClick={() => remove(r.key)}
                aria-label="حذف المكوّن"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_6rem] gap-2 ps-8">
              <input
                className="input !py-2"
                inputMode="decimal"
                placeholder="الكمية"
                value={r.amount}
                onChange={(e) => update(r.key, { amount: e.target.value })}
              />
              <select
                className="input !py-2"
                value={r.unit}
                onChange={(e) => update(r.key, { unit: e.target.value as ComponentUnit })}
                aria-label="الوحدة"
              >
                {COMPONENT_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="py-4 text-center text-sm text-faint">لسه ما ضفتش مكونات</div>}
      </div>

      <button type="button" className="btn-secondary w-full" onClick={() => onChange([...rows, newRow()])}>
        <Icon name="plus" size={16} />
        إضافة مكوّن
      </button>

      {valid.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
          <span>{valid.length} مكوّن</span>
          <span className="font-bold tabular-nums">
            {weight > 0 && `الوزن: ${formatNumber(weight)} جم${weight >= 1000 ? ` (${formatNumber(weight / 1000, 3)} كجم)` : ''}`}
            {weight > 0 && liquids.length > 0 && ' + '}
            {liquids.map((l) => `${formatNumber(l.amount)} ${l.unit === 'l' ? 'لتر' : 'مل'}`).join(' + ')}
          </span>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            className="input !py-2 text-sm"
            value={recipePick}
            onChange={(e) => setRecipePick(e.target.value)}
            aria-label="تحميل مكونات من تركيبة"
          >
            <option value="">أو حمّل المكونات من تركيبة...</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary shrink-0 !px-3 !py-2" onClick={loadRecipe} disabled={!recipePick || loading}>
            {loading ? '...' : 'تحميل'}
          </button>
        </div>
      )}
    </div>
  )
}
