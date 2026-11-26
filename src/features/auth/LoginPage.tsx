import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MAIN_APP_URL } from '../../lib/mainApp'
import { Icon } from '../../components/Icon'
import { useAuth } from './AuthProvider'
import { readReturnPath } from '../../lib/returnTo'
import { errorMessage } from '../../components/ui'
import logo from '../../assets/logo-login.png'

// نفس طريقة برنامج المصنع: الاسم بيتنضّف (مسافات + حروف صغيرة) ويتحوّل لإيميل عن طريق دالة login_email
const normName = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'الاسم أو كلمة المرور غير صحيحة'
  if (m.includes('rate limit')) return 'محاولات كتير، استنى شوية وجرّب تاني'
  return message
}

export default function LoginPage() {
  const { session } = useAuth()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) return <Navigate to={readReturnPath()} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      let email = identity.trim()
      if (!email.includes('@')) {
        const { data, error: rpcError } = await supabase.rpc('login_email', {
          p_name: normName(identity),
        })
        if (rpcError) throw rpcError
        if (!data) throw new Error('الاسم غير موجود أو متكرر. اتأكد من كتابته زي ما هو في برنامج المصنع')
        email = data as string
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
    } catch (err) {
      setError(translateAuthError(errorMessage(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="login-bg flex min-h-[100dvh] items-center justify-center px-4 py-8"
    >
      <div className="login-grid" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm">
        <img
          src={logo}
          alt="الماس للخزف والصيني"
          className="float-slow mx-auto mb-5 w-60 rounded-2xl border-2 border-gold shadow-2xl"
        />
        <h1 className="mb-4 text-center text-2xl font-extrabold text-white">
          مختبر <span className="text-gold-light">الماس</span>
        </h1>

        <form onSubmit={onSubmit} className="card login-card space-y-4">
          <div>
            <label className="label" htmlFor="identity">الاسم</label>
            <div className="relative">
              <Icon name="user" size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              id="identity"
              className="input !ps-10"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              autoComplete="username"
              placeholder="نفس اسم الدخول في برنامج المصنع"
              required
            />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">كلمة المرور</label>
            <div className="relative">
              <Icon name="lock" size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              id="password"
              type="password"
              dir="ltr"
              className="input !ps-10 text-start"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            <Icon name="key" size={18} />
            {busy ? 'لحظة...' : 'دخول'}
          </button>

          <a
            href={MAIN_APP_URL}
            className="flex items-center justify-center gap-1.5 text-sm font-bold text-brand-700"
          >
            <Icon name="arrowRight" size={16} />
            الرجوع لبرنامج المصنع
          </a>
        </form>

        <p className="mt-4 text-center text-xs text-white/60">
          الحسابات بتتعمل من برنامج المصنع (المستخدمين والصلاحيات)
        </p>
      </div>
    </div>
  )
}
