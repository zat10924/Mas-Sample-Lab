import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { allowPersist, clearOfflineData } from '../../lib/idbPersister'
import type { LabMe } from '../../types/db'

interface AuthState {
  session: Session | null
  /** بيانات المستخدم من حسابات برنامج المصنع (null لو الحساب غير نشط أو بدون دور) */
  me: LabMe | null
  loading: boolean
  canRead: boolean
  canWrite: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/** آخر مستخدم دخل (للتشغيل بدون إنترنت). الحماية الفعلية دايمًا من سياسات RLS في السيرفر */
const OFFLINE_USER_KEY = 'lab-offline-user'
interface OfflineUser {
  id: string
  me: LabMe | null
}

function readOfflineUser(): OfflineUser | null {
  try {
    const raw = localStorage.getItem(OFFLINE_USER_KEY)
    return raw ? (JSON.parse(raw) as OfflineUser) : null
  } catch {
    return null
  }
}

function writeOfflineUser(u: OfflineUser | null): void {
  try {
    if (u) localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(OFFLINE_USER_KEY)
  } catch {
    // تجاهل
  }
}

/** جلسة مؤقتة لما مفيش نت ومقدرناش نجدّد الجلسة الحقيقية */
function offlineSession(): Session | null {
  const u = readOfflineUser()
  return u ? ({ user: { id: u.id } } as unknown as Session) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<LabMe | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  // المستخدم اللي اتحمّلت بياناته (عشان ما تظهرش شاشة "لا توجد صلاحية" بالغلط قبل التحميل)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    // نفس مشروع Supabase ونفس الدومين مع برنامج المصنع = الجلسة بتتقرأ تلقائيًا (دخول موحّد)
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        // بدون نت ممكن تجديد الجلسة يفشل: نكمّل بآخر مستخدم دخل عشان البرنامج يفتح
        setSession(data.session ?? (error || !navigator.onLine ? offlineSession() : null))
        setSessionLoading(false)
      })
      .catch(() => {
        setSession(offlineSession())
        setSessionLoading(false)
      })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next) setSession(next)
      else if (!navigator.onLine && readOfflineUser()) return
      else setSession(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null

  const loadMe = useCallback(async () => {
    if (!userId) {
      setMe(null)
      setLoadedFor(null)
      return
    }
    allowPersist()
    try {
      const { data, error } = await supabase.rpc('lab_me')
      if (error) throw error
      const next = (data as LabMe | null) ?? null
      setMe(next)
      writeOfflineUser({ id: userId, me: next })
    } catch {
      // مفيش اتصال بالسيرفر: نستخدم آخر صلاحيات اتحفظت لنفس المستخدم
      const cached = readOfflineUser()
      setMe(cached && cached.id === userId ? cached.me : null)
    }
    setLoadedFor(userId)
  }, [userId])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  // لما النت يرجع: نجدّد الجلسة الحقيقية ونحدّث الصلاحيات
  useEffect(() => {
    const onOnline = () => {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (data.session) setSession(data.session)
        })
        .catch(() => undefined)
      void loadMe()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [loadMe])

  const queryClient = useQueryClient()
  const signOut = useCallback(async () => {
    writeOfflineUser(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // بدون نت: الخروج المحلي كفاية
    }
    setMe(null)
    // نمسح النسخة المحلية من البيانات والصور عشان ما تفضلش على الجهاز بعد الخروج
    queryClient.clear()
    await clearOfflineData()
  }, [queryClient])

  const value = useMemo<AuthState>(() => {
    const level = me?.level ?? null
    return {
      session,
      me,
      loading: sessionLoading || (!!userId && loadedFor !== userId),
      canRead: level === 'view' || level === 'edit',
      canWrite: level === 'edit',
      isAdmin: me?.role === 'admin' && level === 'edit',
      signOut,
      refreshMe: loadMe,
    }
  }, [session, me, sessionLoading, loadedFor, userId, signOut, loadMe])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider')
  return ctx
}
