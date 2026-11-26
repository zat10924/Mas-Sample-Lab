import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** رمز QR كصورة (بيتولّد في المتصفح من غير إنترنت) */
export default function QrCode({ value, size = 96, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, {
      margin: 1,
      width: size * 3,
      errorCorrectionLevel: 'M',
      color: { dark: '#421b24', light: '#ffffff' },
    })
      .then((url) => {
        if (alive) setSrc(url)
      })
      .catch(() => {
        if (alive) setSrc('')
      })
    return () => {
      alive = false
    }
  }, [value, size])

  if (!src) return null
  return <img src={src} width={size} height={size} alt="QR" className={className} />
}
