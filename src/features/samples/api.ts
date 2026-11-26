import { supabase } from '../../lib/supabase'
import { compressImage } from '../../lib/image'
import { callFunction } from '../../lib/functions'
import { buildResultCode } from '../../lib/codes'
import type {
  ColorMatch,
  ComponentUnit,
  Finish,
  SampleComponent,
  SampleDetail,
  SampleListItem,
  SampleResult,
  SampleStatus,
} from '../../types/db'

const BUCKET = 'lab-sample-images'

/** نص خطأ واضح لو جدول المكونات لسه ما اتعملش في Supabase */
function isMissingComponents(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  const m = (error.message ?? '').toLowerCase()
  return error.code === 'PGRST200' || error.code === '42P01' || error.code === 'PGRST205' || m.includes('lab_sample_components')
}

export interface ListSamplesOptions {
  /** أحدث N عينة بس (للوحة التحكم) */
  limit?: number
  /** عينات بحالة معينة بس */
  status?: SampleStatus
}

export async function listSamples(opts: ListSamplesOptions = {}): Promise<SampleListItem[]> {
  const fullSel = supabase
    .from('lab_samples')
    .select('*, recipe:lab_recipes(code,name), results:lab_sample_results(final_code,image_path), components:lab_sample_components(material,amount,unit,sort_order)')
  const fullFiltered = opts.status ? fullSel.eq('status', opts.status) : fullSel
  const fullOrdered = fullFiltered.order('created_at', { ascending: false })
  const full = await (opts.limit ? fullOrdered.limit(opts.limit) : fullOrdered)
  if (!full.error) return (full.data ?? []) as unknown as SampleListItem[]
  if (!isMissingComponents(full.error)) throw full.error

  // جدول المكونات لسه ما اتعملش (004): نكمّل بدونه بدل ما البرنامج يقف
  const basicSel = supabase.from('lab_samples').select('*, recipe:lab_recipes(code,name), results:lab_sample_results(final_code,image_path)')
  const basicFiltered = opts.status ? basicSel.eq('status', opts.status) : basicSel
  const basicOrdered = basicFiltered.order('created_at', { ascending: false })
  const basic = await (opts.limit ? basicOrdered.limit(opts.limit) : basicOrdered)
  if (basic.error) throw basic.error
  return ((basic.data ?? []) as unknown as Omit<SampleListItem, 'components'>[]).map((x) => ({ ...x, components: [] }))
}

export async function listComponents(sampleId: string): Promise<SampleComponent[]> {
  const { data, error } = await supabase
    .from('lab_sample_components')
    .select('*')
    .eq('sample_id', sampleId)
    .order('sort_order', { ascending: true })
  if (error) {
    if (isMissingComponents(error)) return []
    throw error
  }
  return (data ?? []) as SampleComponent[]
}

export interface ComponentInput {
  material: string
  amount: number
  unit: ComponentUnit
}

/** يستبدل مكونات العينة بالقائمة الجديدة */
export async function saveComponents(sampleId: string, rows: ComponentInput[]): Promise<void> {
  const del = await supabase.from('lab_sample_components').delete().eq('sample_id', sampleId)
  if (del.error) {
    if (isMissingComponents(del.error)) {
      if (rows.length === 0) return
      throw new Error('جدول مكونات العينة مش موجود: شغّل ملف 004_sample_components.sql في Supabase الأول')
    }
    throw del.error
  }
  if (rows.length === 0) return
  const { error } = await supabase.from('lab_sample_components').insert(
    rows.map((r, i) => ({ sample_id: sampleId, material: r.material.trim(), amount: r.amount, unit: r.unit, sort_order: i })),
  )
  if (error) throw error
}

export async function getSample(id: string): Promise<SampleDetail> {
  const { data, error } = await supabase
    .from('lab_samples')
    .select('*, recipe:lab_recipes(id,code,name,type,basis)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as SampleDetail
}

export interface SampleInput {
  recipe_id: string | null
  body_type: string | null
  batch_kg: number
  firing_temp: number | null
  firing_date: string | null
  application_method: string | null
  notes: string | null
}

export async function saveSample(id: string | null, input: SampleInput): Promise<string> {
  if (id) {
    const { error } = await supabase.from('lab_samples').update(input).eq('id', id)
    if (error) throw error
    return id
  }
  // الكود MAS-2026-0001 يتولد تلقائيًا من قاعدة البيانات
  const { data, error } = await supabase.from('lab_samples').insert(input).select('id').single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function updateSampleStatus(id: string, status: SampleStatus): Promise<void> {
  const { error } = await supabase.from('lab_samples').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteSample(id: string): Promise<void> {
  const { data: results, error: listError } = await supabase
    .from('lab_sample_results')
    .select('image_path')
    .eq('sample_id', id)
  if (listError) throw listError
  const paths = (results ?? []).map((r: { image_path: string }) => r.image_path)

  // نحذف الصف الأول (والنتائج بتتحذف معاه تلقائي)، وبعدها الصور، عشان لو الحذف اتمنع ما نخسرش الصور
  const { data, error } = await supabase.from('lab_samples').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('الحذف مرفوض: مفيش صلاحية')

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths)
    if (storageError) throw storageError
  }
}

export async function listResults(sampleId: string): Promise<SampleResult[]> {
  const { data, error } = await supabase
    .from('lab_sample_results')
    .select('*')
    .eq('sample_id', sampleId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as SampleResult[]
}

/** يضغط الصورة، يرفعها للتخزين الخاص، ويسجل النتيجة. العينة بتتحول لـ "محروقة" لو كانت مخططة */
export async function addResultImage(sampleId: string, file: File): Promise<SampleResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('لازم تسجل الدخول')

  const blob = await compressImage(file)
  const path = `${user.id}/${sampleId}/${crypto.randomUUID()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('lab_sample_results')
    .insert({ sample_id: sampleId, image_path: path })
    .select('*')
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }

  await supabase.from('lab_samples').update({ status: 'fired' }).eq('id', sampleId).eq('status', 'planned')
  return data as SampleResult
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function analyzeResult(resultId: string): Promise<void> {
  await callFunction<unknown>('lab-ai', { action: 'analyze', result_id: resultId })
}

export interface ReviewInput {
  finish: Finish
  color_match: ColorMatch
  defects: string[]
  reviewer_notes: string | null
}

export async function saveReview(result: SampleResult, review: ReviewInput): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const finalCode = buildResultCode(review.finish, review.color_match, review.defects)

  const { error } = await supabase
    .from('lab_sample_results')
    .update({
      finish: review.finish,
      color_match: review.color_match,
      defects: review.defects,
      final_code: finalCode,
      reviewer_notes: review.reviewer_notes,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', result.id)
  if (error) throw error

  const { error: statusError } = await supabase
    .from('lab_samples')
    .update({ status: 'reviewed' })
    .eq('id', result.sample_id)
  if (statusError) throw statusError
  return finalCode
}

export async function deleteResult(result: SampleResult): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([result.image_path])
  if (storageError) throw storageError
  const { error } = await supabase.from('lab_sample_results').delete().eq('id', result.id)
  if (error) throw error
}
