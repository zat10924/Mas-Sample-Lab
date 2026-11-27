import { Link, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { crumbsFor } from './nav'

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = crumbsFor(pathname)
  if (crumbs.length === 0) return null
  return (
    <nav aria-label="مسار التنقل" className="mb-2 flex flex-wrap items-center gap-1 text-xs font-medium text-faint print:hidden">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 && <Icon name="chevronLeft" size={12} />}
          {c.to ? (
            <Link to={c.to} className="hover:text-brand-700">
              {c.label}
            </Link>
          ) : (
            <span className="text-mute">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
