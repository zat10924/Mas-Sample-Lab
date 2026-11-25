import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthProvider'
import { errorMessage } from './ui'
import { Icon } from './Icon'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  /** بتتنفذ بعد التأكد من كلمة السر. لو رمت خطأ بيظهر جوه النافذة. */
  onConfirm: () => Promise<void>
  onClose: () => void
}

/** نافذة تأكيد بكلمة سر المستخدم الحالي قبل أي حذف نهائي. */
export default function PasswordConfirm({
  open,
  title,
  message,
  confirmLabel = 'تأكيد الحذف',
  onConfirm,
  onClose,
}: Props) {
  const { session } = useAuth()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPassword('')
      setError(null)
      setBusy(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    const email = session?.user.email
    if (!email) {
      setError('تعذّر التحقق من الحساب. سجّل الدخول من جديد')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        const m = authError.message.toLowerCase()
        throw new Error(
          m.includes('invalid') ? 'كلمة السر غير صحيحة' : m.includes('rate') ? 'محاولات كتير، استنى شوية' : authError.message,
        )
      }
      await onConfirm()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
            <Icon name="lock" size={20} />
          </span>
          <div>
            <h2 className="font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-mute">{message}</p>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="confirm-pw">
            اكتب كلمة السر بتاعتك للتأكيد
          </label>
          <input
            id="confirm-pw"
            ref={inputRef}
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className="btn-danger flex-1" disabled={busy || !password}>
            {busy ? 'لحظة...' : confirmLabel}
          </button>
          <button type="button" className="btn-secondary flex-1" disabled={busy} onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
