import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, PageTitle, SearchBox, Spinner } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
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

const LEVEL_ICON: Record<string, { icon: IconName; tone: string }> = {
  edit: { icon: 'pencil', tone: 'bg-emerald-100 text-emerald-700' },
  view: { icon: 'eye', tone: 'bg-sky-100 text-sky-700' },
  none: { icon: 'lock', tone: 'bg-red-100 text-red-700' },
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
        icon="shield" title="صلاحيات المختبر"
        subtitle="تحكم في وصول كل مستخدم للمختبر (حتى المدراء). المدير وصاحب المصنع عندهم وصول افتراضي وتقدر تسحبه منهم"
      />

      <SearchBox className="mb-3 lg:max-w-md" placeholder="ابحث بالاسم..." value={search} onChange={setSearch} />

      {users.isLoading && <Spinner compact />}
      {users.error && <ErrorBox error={users.error} />}
      {change.error && <ErrorBox error={change.error} />}
      {!users.isLoading && !users.error && items.length === 0 && <Empty text="مفيش مستخدمين مطابقين" />}

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((u) => {
          const self = u.id === me?.id
          return (
            <div key={u.id} className="card flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${(LEVEL_ICON[u.level ?? 'none'] ?? LEVEL_ICON.none).tone}`}>
                  <Icon name={(LEVEL_ICON[u.level ?? 'none'] ?? LEVEL_ICON.none).icon} size={20} />
                </span>
                <div className="min-w-0">
                  <div className="truncate font-bold text-ink">{u.full_name || 'بدون اسم'}</div>
                  <div className="flex items-center gap-1 text-xs text-mute">
                    <Icon name="user" size={12} />
                    {ROLE_AR[u.role] ?? u.role}
                  </div>
                </div>
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
