import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<LabMe | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  // المستخدم اللي اتحمّلت بياناته (عشان ما تظهرش شاشة "لا توجد صلاحية" بالغلط قبل التحميل)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    // نفس مشروع Supabase ونفس الدومين مع برنامج المصنع = الجلسة بتتقرأ تلقائيًا (دخول موحّد)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
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
    const { data } = await supabase.rpc('lab_me')
    setMe((data as LabMe | null) ?? null)
    setLoadedFor(userId)
  }, [userId])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setMe(null)
  }, [])

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
