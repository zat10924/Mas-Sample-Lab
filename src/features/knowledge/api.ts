import { supabase } from '../../lib/supabase'
import { callFunction } from '../../lib/functions'

export type KbLayer = 'encyclopedia' | 'lab' | 'approved_experience' | 'unapproved_experience'
export type Confidence = 'reference' | 'high' | 'medium' | 'low'
export type ExperienceStatus = 'draft' | 'analysis' | 'pending' | 'approved' | 'rejected' | 'returned'

export interface KbResult {
  layer: KbLayer
  ref_id: string
  title: string
  snippet: string
  source_label: string
  source_detail: string
  chapter_no: number | null
  category_name: string | null
  status: string | null
  confidence: Confidence
  rank: number
  link_path: string
}

export interface KbCategory { id: number; name_ar: string; name_en: string | null; sort_order: number }
export interface KbChapter { id: string; chapter_no: number | null; title: string; category_id: number | null; seq: number; document_id: string }
export interface KbDocument { id: string; doc_key: string; title: string; edition: string; volume: number | null }
export interface KbChunk { id: string; seq: number; kind: 'paragraph' | 'list' | 'table'; heading_path: string | null; content: string }

export interface KbExperience {
  id: string
  code: string
  title: string
  summary: string
  scope_note: string
  limitations: string
  evidence: string
  status: ExperienceStatus
  review_note: string | null
  created_at: string
  approved_at: string | null
}
export interface KbLink { id: string; link_type: 'sample' | 'recipe' | 'chunk'; ref_label: string; sample_id: string | null; recipe_id: string | null }
export interface KbReview { id: string; action: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string }

export const LAYER_FILTERS: { key: 'encyclopedia' | 'lab' | 'experience'; label: string }[] = [
  { key: 'encyclopedia', label: 'الموسوعة' },
  { key: 'lab', label: 'تجارب المختبر' },
  { key: 'experience', label: 'الخبرات' },
]

export const STATUS_AR: Record<ExperienceStatus, string> = {
  draft: 'مسودة',
  analysis: 'قيد التحليل',
  pending: 'بانتظار الاعتماد',
  approved: 'معتمدة',
  rejected: 'مرفوضة',
  returned: 'معادة للمراجعة',
}

export const CONFIDENCE_AR: Record<Confidence, string> = {
  reference: 'مرجعي (منشور)',
  high: 'مرتفعة',
  medium: 'متوسطة',
  low: 'منخفضة',
}

export async function searchKb(query: string, layers: string[] | null, category: number | null): Promise<KbResult[]> {
  const { data, error } = await supabase.rpc('lab_kb_search', {
    p_query: query,
    p_layers: layers && layers.length ? layers : null,
    p_category: category,
    p_limit: 40,
  })
  if (error) throw error
  return (data ?? []) as KbResult[]
}

export async function listCategories(): Promise<KbCategory[]> {
  const { data, error } = await supabase.from('lab_kb_categories').select('id,name_ar,name_en,sort_order').order('sort_order')
  if (error) throw error
  return (data ?? []) as KbCategory[]
}

export async function listChapters(): Promise<(KbChapter & { lab_kb_documents: KbDocument | null })[]> {
  const { data, error } = await supabase
    .from('lab_kb_chapters')
    .select('id,chapter_no,title,category_id,seq,document_id,lab_kb_documents(id,doc_key,title,edition,volume)')
    .order('chapter_no', { nullsFirst: false })
  if (error) throw error
  return (data ?? []) as unknown as (KbChapter & { lab_kb_documents: KbDocument | null })[]
}

export async function getChapter(id: string) {
  const [ch, chunks] = await Promise.all([
    supabase
      .from('lab_kb_chapters')
      .select('id,chapter_no,title,category_id,lab_kb_documents(title,edition,volume,file_name),lab_kb_categories(name_ar)')
      .eq('id', id)
      .single(),
    supabase.from('lab_kb_chunks').select('id,seq,kind,heading_path,content').eq('chapter_id', id).eq('is_current', true).order('seq'),
  ])
  if (ch.error) throw ch.error
  if (chunks.error) throw chunks.error
  return { chapter: ch.data as unknown as {
    id: string; chapter_no: number | null; title: string
    lab_kb_documents: { title: string; edition: string; volume: number | null; file_name: string } | null
    lab_kb_categories: { name_ar: string } | null
  }, chunks: (chunks.data ?? []) as KbChunk[] }
}

export async function listExperiences(): Promise<KbExperience[]> {
  const { data, error } = await supabase
    .from('lab_kb_experiences')
    .select('id,code,title,summary,scope_note,limitations,evidence,status,review_note,created_at,approved_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as KbExperience[]
}

export async function getExperience(id: string) {
  const [e, links, reviews] = await Promise.all([
    supabase.from('lab_kb_experiences').select('*').eq('id', id).single(),
    supabase.from('lab_kb_links').select('id,link_type,ref_label,sample_id,recipe_id').eq('experience_id', id),
    supabase.from('lab_kb_experience_reviews').select('id,action,from_status,to_status,note,created_at').eq('experience_id', id).order('created_at'),
  ])
  if (e.error) throw e.error
  if (links.error) throw links.error
  if (reviews.error) throw reviews.error
  const conf = await supabase.rpc('lab_kb_experience_confidence', { p_id: id })
  return {
    experience: e.data as KbExperience,
    links: (links.data ?? []) as KbLink[],
    reviews: (reviews.data ?? []) as KbReview[],
    confidence: ((conf.data as Confidence | null) ?? 'low') as Confidence,
  }
}

export async function createExperience(input: Pick<KbExperience, 'title' | 'summary' | 'scope_note' | 'limitations' | 'evidence'>): Promise<string> {
  const { data, error } = await supabase.from('lab_kb_experiences').insert(input).select('id').single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function updateExperience(id: string, input: Partial<Pick<KbExperience, 'title' | 'summary' | 'scope_note' | 'limitations' | 'evidence'>>): Promise<void> {
  const { error } = await supabase.from('lab_kb_experiences').update(input).eq('id', id)
  if (error) throw error
}

export async function transitionExperience(id: string, to: ExperienceStatus, note?: string): Promise<void> {
  const { error } = await supabase.rpc('lab_kb_transition', { p_id: id, p_to: to, p_note: note ?? null })
  if (error) throw error
}

/** يربط خبرة بعينة أو تركيبة بالكود (MAS-2026-0001 أو كود التركيبة) */
export async function linkByCode(experienceId: string, code: string): Promise<void> {
  const c = code.trim()
  if (!c) throw new Error('اكتب كود العينة أو التركيبة')
  const s = await supabase.from('lab_samples').select('id,code').ilike('code', c).maybeSingle()
  if (s.error) throw s.error
  if (s.data) {
    const { error } = await supabase.from('lab_kb_links').insert({ experience_id: experienceId, link_type: 'sample', sample_id: s.data.id, ref_label: s.data.code })
    if (error) throw error
    return
  }
  const r = await supabase.from('lab_recipes').select('id,code').ilike('code', c).maybeSingle()
  if (r.error) throw r.error
  if (!r.data) throw new Error('لم يتم العثور على عينة أو تركيبة بهذا الكود')
  const { error } = await supabase.from('lab_kb_links').insert({ experience_id: experienceId, link_type: 'recipe', recipe_id: r.data.id, ref_label: r.data.code })
  if (error) throw error
}

export async function removeLink(id: string): Promise<void> {
  const { error } = await supabase.from('lab_kb_links').delete().eq('id', id)
  if (error) throw error
}

export async function isApprover(): Promise<boolean> {
  const { data, error } = await supabase.rpc('lab_kb_is_approver')
  if (error) return false
  return data === true
}

export async function approverNames(): Promise<string[]> {
  const { data, error } = await supabase.rpc('lab_kb_approver_names')
  if (error) return []
  return ((data ?? []) as { full_name: string | null }[]).map((x) => x.full_name ?? '—')
}

export interface KbAnswer {
  answer: string | null
  reason?: string
  model?: string
  sources: { n: number; layer: KbLayer; title: string; source_label: string; source_detail: string; confidence: Confidence; confidence_ar: string; link_path: string }[]
}

/** صياغة إجابة من نتائج البحث عبر Groq (بطلب صريح من المستخدم) */
export async function askKb(question: string): Promise<KbAnswer> {
  return callFunction<KbAnswer>('lab-ai', { action: 'kb_answer', question })
}

export async function kbStats(): Promise<{ chapters: number; chunks: number; terms: number; approved: number }> {
  const [ch, ck, tm, ex] = await Promise.all([
    supabase.from('lab_kb_chapters').select('id', { count: 'exact', head: true }),
    supabase.from('lab_kb_chunks').select('id', { count: 'exact', head: true }).eq('is_current', true),
    supabase.from('lab_kb_terms').select('id', { count: 'exact', head: true }),
    supabase.from('lab_kb_experiences').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])
  return { chapters: ch.count ?? 0, chunks: ck.count ?? 0, terms: tm.count ?? 0, approved: ex.count ?? 0 }
}
