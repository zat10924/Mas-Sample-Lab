import { useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../components/ui'
import KnowledgeSearch from '../knowledge/KnowledgeSearch'

/**
 * المساعد: يبحث محليًا في الموسوعة وتجارب المصنع والخبرات المعتمدة، ويعرض المصدر ودرجة الثقة.
 * الرد الذكي (Groq) اختياري ومبني على المصادر الظاهرة فقط.
 */
export default function AssistantPage() {
  const [params] = useSearchParams()
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle icon="sparkles" title="المساعد" subtitle="اسأل وسيجيبك من الموسوعة وتجارب المصنع مع ذكر المصادر" />
      <KnowledgeSearch initialQuery={params.get('q') ?? ''} />
    </div>
  )
}
