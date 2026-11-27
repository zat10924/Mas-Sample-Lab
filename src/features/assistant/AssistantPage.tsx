import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTitle, SectionTitle } from '../../components/ui'
import KnowledgeSearch from '../knowledge/KnowledgeSearch'
import RecipeAiInput from '../../components/RecipeAiInput'
import { listRecipes } from '../recipes/api'
import { materialNames } from '../recipes/recipeAi'
import { useAuth } from '../auth/AuthProvider'
import type { FormDraft } from '../../lib/recipeDraft'

/**
 * المساعد: يبحث محليًا في الموسوعة وتجارب المصنع والخبرات المعتمدة، ويعرض المصدر ودرجة الثقة.
 * الرد الذكي (Groq) اختياري ومبني على المصادر الظاهرة فقط.
 * لمن عنده صلاحية التعديل: إدخال تركيبة بالكلام أو الكتابة الحرة (مسودة للمراجعة).
 */
export default function AssistantPage() {
  const [params] = useSearchParams()
  const { canWrite } = useAuth()
  const navigate = useNavigate()
  const recipes = useQuery({ queryKey: ['recipes'], queryFn: listRecipes, enabled: canWrite })
  const materials = useMemo(() => materialNames(recipes.data ?? []), [recipes.data])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageTitle icon="sparkles" title="المساعد" subtitle="اسأل وسيجيبك من الموسوعة وتجارب المصنع مع ذكر المصادر" />
      <KnowledgeSearch initialQuery={params.get('q') ?? ''} />
      {canWrite && (
        <details className="card">
          <summary className="cursor-pointer list-none">
            <SectionTitle icon="flask">إدخال تركيبة بالمساعد</SectionTitle>
          </summary>
          <div className="mt-3">
            <RecipeAiInput
              materials={materials}
              applyLabel="فتح في نموذج تركيبة جديدة"
              onApply={(draft: FormDraft) => navigate('/recipes/new', { state: { aiDraft: draft } })}
            />
          </div>
        </details>
      )}
    </div>
  )
}
