import { Link } from 'react-router-dom'
import Sheet from './Sheet'
import KnowledgeSearch from '../features/knowledge/KnowledgeSearch'

/** المساعد العائم: بحث سريع محلي في قاعدة المعرفة من أي صفحة */
export default function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="المساعد">
      <div className="max-h-[60dvh] overflow-y-auto pb-2">
        <KnowledgeSearch compact onNavigate={onClose} />
      </div>
      <Link to="/knowledge" onClick={onClose} className="mt-3 inline-block text-xs font-bold text-brand-700">
        فتح صفحة المعرفة كاملة
      </Link>
    </Sheet>
  )
}
