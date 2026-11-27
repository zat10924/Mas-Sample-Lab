import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { readPref, usePref, writePref } from './prefs'
import { useToast } from '../components/Toast'
import { errorMessage } from '../components/ui'

/**
 * مفضّلة / مجموعات / عروض محفوظة متزامنة عبر Supabase (ملف 008).
 * لو الجداول لسه ما اتعملتش، بنرجع تلقائيًا للتخزين على الجهاز عشان البرنامج ما يقفش.
 * أول مرة تنجح فيها القراءة، اللي كان محفوظ على الجهاز بيترفع مرة واحدة.
 */

const KEYS = { fav: ['lab-favorites'], coll: ['lab-collections'], views: ['lab-saved-views'] } as const

/* ---------------- المفضّلة ---------------- */

async function fetchFavorites(): Promise<string[]> {
  const { data, error } = await supabase.from('lab_recipe_favorites').select('recipe_id')
  if (error) throw error
  const remote = (data ?? []).map((r: { recipe_id: string }) => r.recipe_id)
  const local = readPref<string[]>('lab-fav-recipes', [])
  if (local.length > 0 && !readPref<boolean>('lab-fav-migrated', false)) {
    const missing = local.filter((id) => !remote.includes(id))
    if (missing.length > 0) {
      await supabase
        .from('lab_recipe_favorites')
        .upsert(missing.map((recipe_id) => ({ recipe_id })), { onConflict: 'user_id,recipe_id', ignoreDuplicates: true })
    }
    writePref('lab-fav-migrated', true)
    return [...remote, ...missing]
  }
  return remote
}

export function useFavorites() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [localIds, setLocalIds] = usePref<string[]>('lab-fav-recipes', [])
  const q = useQuery({ queryKey: KEYS.fav, queryFn: fetchFavorites, staleTime: 60_000, retry: false })
  const remote = q.data !== undefined && !q.isError
  const ids: string[] = (remote ? q.data : undefined) ?? localIds

  const mutate = useMutation({
    mutationFn: async ({ id, on }: { id: string; on: boolean }) => {
      const res = on
        ? await supabase.from('lab_recipe_favorites').upsert({ recipe_id: id }, { onConflict: 'user_id,recipe_id', ignoreDuplicates: true })
        : await supabase.from('lab_recipe_favorites').delete().eq('recipe_id', id)
      if (res.error) throw res.error
    },
    onMutate: async ({ id, on }) => {
      await queryClient.cancelQueries({ queryKey: KEYS.fav })
      const prev = queryClient.getQueryData<string[]>(KEYS.fav)
      queryClient.setQueryData<string[]>(KEYS.fav, (p) => (on ? [...new Set([...(p ?? []), id])] : (p ?? []).filter((x) => x !== id)))
      return { prev }
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(KEYS.fav, ctx.prev)
      toast(errorMessage(e), 'error')
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: KEYS.fav }),
  })

  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => {
      const on = !ids.includes(id)
      if (remote) mutate.mutate({ id, on })
      else setLocalIds((p) => (on ? [...p, id] : p.filter((x) => x !== id)))
    },
  }
}

/* ---------------- المجموعات ---------------- */

async function fetchCollections(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('lab_recipe_collections').select('recipe_id,name')
  if (error) throw error
  const map: Record<string, string> = {}
  for (const r of (data ?? []) as { recipe_id: string; name: string }[]) map[r.recipe_id] = r.name
  const local = readPref<Record<string, string>>('lab-recipe-collections', {})
  const missing = Object.entries(local).filter(([id]) => !(id in map))
  if (missing.length > 0 && !readPref<boolean>('lab-coll-migrated', false)) {
    const res = await supabase
      .from('lab_recipe_collections')
      .upsert(missing.map(([recipe_id, name]) => ({ recipe_id, name })), { onConflict: 'recipe_id' })
    writePref('lab-coll-migrated', true)
    if (!res.error) for (const [id, name] of missing) map[id] = name
  } else if (!readPref<boolean>('lab-coll-migrated', false)) {
    writePref('lab-coll-migrated', true)
  }
  return map
}

export function useCollections() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [localMap, setLocalMap] = usePref<Record<string, string>>('lab-recipe-collections', {})
  const q = useQuery({ queryKey: KEYS.coll, queryFn: fetchCollections, staleTime: 60_000, retry: false })
  const remote = q.data !== undefined && !q.isError
  const map: Record<string, string> = (remote ? q.data : undefined) ?? localMap

  const mutate = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = name
        ? await supabase.from('lab_recipe_collections').upsert({ recipe_id: id, name, updated_at: new Date().toISOString() }, { onConflict: 'recipe_id' })
        : await supabase.from('lab_recipe_collections').delete().eq('recipe_id', id)
      if (res.error) throw res.error
    },
    onError: (e) => toast(errorMessage(e), 'error'),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: KEYS.coll }),
  })

  const names = [...new Set(Object.values(map))].sort((a, b) => a.localeCompare(b, 'ar'))
  const set = useCallback(
    (id: string, name: string) => {
      const t = name.trim()
      if (remote) {
        queryClient.setQueryData<Record<string, string>>(KEYS.coll, (p) => {
          const next = { ...(p ?? {}) }
          if (t) next[id] = t
          else delete next[id]
          return next
        })
        mutate.mutate({ id, name: t })
      } else {
        setLocalMap((p) => {
          const next = { ...p }
          if (t) next[id] = t
          else delete next[id]
          return next
        })
      }
    },
    [remote], // eslint-disable-line react-hooks/exhaustive-deps
  )
  return { map, names, set }
}

/* ---------------- العروض المحفوظة ---------------- */

export interface SavedViewRow<T> {
  id: string
  name: string
  payload: T
}

async function fetchViews(): Promise<SavedViewRow<unknown>[]> {
  const { data, error } = await supabase.from('lab_saved_views').select('id,name,payload').order('created_at', { ascending: true })
  if (error) throw error
  const remote = (data ?? []) as SavedViewRow<unknown>[]
  const local = readPref<{ id: string; name: string; filter: unknown; sort: unknown; adv: unknown; search: unknown }[]>('lab-saved-views', [])
  if (local.length > 0 && !readPref<boolean>('lab-views-migrated', false)) {
    const rows = local.map((v) => ({ name: v.name, payload: { filter: v.filter, sort: v.sort, adv: v.adv, search: v.search } }))
    const res = await supabase.from('lab_saved_views').insert(rows).select('id,name,payload')
    writePref('lab-views-migrated', true)
    if (!res.error) return [...remote, ...((res.data ?? []) as SavedViewRow<unknown>[])]
  }
  return remote
}

export function useSavedViews<T>() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [localList, setLocalList] = usePref<SavedViewRow<T>[]>('lab-saved-views-v2', [])
  const q = useQuery({ queryKey: KEYS.views, queryFn: fetchViews, staleTime: 60_000, retry: false })
  const remote = q.data !== undefined && !q.isError
  const list = (remote ? (q.data as SavedViewRow<T>[]) : localList) ?? []

  const add = useMutation({
    mutationFn: async ({ name, payload }: { name: string; payload: T }) => {
      const res = await supabase.from('lab_saved_views').insert({ name, payload })
      if (res.error) throw res.error
    },
    onError: (e) => toast(errorMessage(e), 'error'),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: KEYS.views }),
  })
  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await supabase.from('lab_saved_views').delete().eq('id', id)
      if (res.error) throw res.error
    },
    onMutate: async (id) => {
      queryClient.setQueryData<SavedViewRow<unknown>[]>(KEYS.views, (p) => (p ?? []).filter((v) => v.id !== id))
    },
    onError: (e) => toast(errorMessage(e), 'error'),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: KEYS.views }),
  })

  return {
    list,
    add: (name: string, payload: T) => {
      if (remote) add.mutate({ name, payload })
      else setLocalList((p) => [...p, { id: String(Date.now()), name, payload }])
    },
    remove: (id: string) => {
      if (remote) del.mutate(id)
      else setLocalList((p) => p.filter((v) => v.id !== id))
    },
  }
}
