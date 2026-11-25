import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, PageTitle, Spinner } from '../../components/ui'
import { LEVEL_AR, ROLE_AR } from '../../lib/roles'
import type { LabUser } from '../../types/db'

async function listUsers(): Promise<LabUser[]> {
  const { data, error } = await supabase.rpc('lab_list_users')
  if (error) throw error
  return (data ?? []) as LabUser[]
}

async function setAccess(userId: string, level: string): Promise<void> {
  const { error } = await supabase.rpc('lab_set_access', { p_user: userId, p_level: level })
  if (error) throw error
}

export default function AccessPage() {
  const { isAdmin, me } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const users = useQuery({ queryKey: ['lab-users'], queryFn: listUsers, enabled: isAdmin })

  const change = useMutation({
    mutationFn: ({ id, level }: { id: string; level: string }) => setAccess(id, level),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lab-users'] }),
  })

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (users.data ?? []).filter((u) => !q || u.full_name.toLowerCase().includes(q))
  }, [users.data, search])

  if (!isAdmin) return <ErrorBox error="الصفحة دي للمدير فقط" />

  return (
    <div>
      <PageTitle
        title="صلاحيات المختبر"
        subtitle="تحكم في وصول كل مستخدم للمختبر (حتى المدراء). المدير وصاحب المصنع عندهم وصول افتراضي وتقدر تسحبه منهم"
      />

      <input
        className="input mb-3 lg:max-w-md"
        placeholder="ابحث بالاسم..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {users.isLoading && <Spinner />}
      {users.error && <ErrorBox error={users.error} />}
      {change.error && <ErrorBox error={change.error} />}
      {!users.isLoading && !users.error && items.length === 0 && <Empty text="مفيش مستخدمين مطابقين" />}

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((u) => {
          const self = u.id === me?.id
          return (
            <div key={u.id} className="card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">{u.full_name || 'بدون اسم'}</div>
                <div className="text-xs text-mute">{ROLE_AR[u.role] ?? u.role}</div>
              </div>
              {self ? (
                <span className="badge bg-brand-50 text-brand-800">
                  أنت · {LEVEL_AR[u.level ?? 'none']}
                </span>
              ) : (
                <select
                  className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                  value={u.level ?? 'none'}
                  disabled={change.isPending}
                  onChange={(e) => change.mutate({ id: u.id, level: e.target.value })}
                >
                  <option value="none">بدون وصول</option>
                  <option value="view">عرض فقط</option>
                  <option value="edit">تعديل</option>
                </select>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
