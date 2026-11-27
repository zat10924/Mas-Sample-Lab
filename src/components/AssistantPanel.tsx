import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Sheet from './Sheet'
import RecipeAiInput from './RecipeAiInput'
import KnowledgeSearch from '../features/knowledge/KnowledgeSearch'
import { listRecipes } from '../features/recipes/api'
import { materialNames } from '../features/recipes/recipeAi'
import { useAuth } from '../features/auth/AuthProvider'
import type { FormDraft } from '../lib/recipeDraft'

type Tab = 'search' | 'recipe'

/** المساعد العائم (متاح من أي صفحة): بحث في المعرفة، وإدخال تركيبة بالكلام لمن عنده صلاحية التعديل */
export default function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { canWrite } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('search')
  const recipes = useQuery({ queryKey: ['recipes'], queryFn: listRecipes, enabled: open && canWrite })
  const materials = useMemo(() => materialNames(recipes.data ?? []), [recipes.data])
  const active: Tab = canWrite ? tab : 'search'

  function openInForm(draft: FormDraft) {
    onClose()
    navigate('/recipes/new', { state: { aiDraft: draft } })
  }

  return (
    <Sheet open={open} onClose={onClose} title="المساعد">
      {canWrite && (
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-tint p-1" role="tablist">
          {(
            [
              ['search', 'بحث في المعرفة'],
              ['recipe', 'إدخال تركيبة'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active === k}
              onClick={() => setTab(k)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${active === k ? 'bg-surface text-brand-700 shadow-sm' : 'text-mute'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-[60dvh] overflow-y-auto pb-2">
        {active === 'search' ? (
          <KnowledgeSearch compact onNavigate={onClose} />
        ) : (
          <RecipeAiInput materials={materials} applyLabel="فتح في نموذج تركيبة جديدة" onApply={openInForm} />
        )}
      </div>

      {active === 'search' && (
        <Link to="/knowledge" onClick={onClose} className="mt-3 inline-block text-xs font-bold text-brand-700">
          فتح صفحة المعرفة كاملة
        </Link>
      )}
    </Sheet>
  )
}
