import type { IconName } from './Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
  adminOnly?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'العمل اليومي',
    items: [
      { to: '/', label: 'الرئيسية والتقارير', icon: 'home', end: true },
      { to: '/samples', label: 'العينات', icon: 'vase' },
      { to: '/recipes', label: 'التركيبات', icon: 'flask' },
    ],
  },
  {
    title: 'التحليل',
    items: [
      { to: '/compare', label: 'المقارنة', icon: 'compare' },
      { to: '/assistant', label: 'المساعد الذكي', icon: 'sparkles' },
    ],
  },
  {
    title: 'الإدارة',
    items: [{ to: '/access', label: 'الصلاحيات', icon: 'key', adminOnly: true }],
  },
]

export const MORE_PATHS = ['/compare', '/assistant', '/access']

const SECTION_LABEL: Record<string, string> = {
  recipes: 'التركيبات',
  samples: 'العينات',
}

export interface Crumb {
  label: string
  to?: string
}

/** مسار التنقّل (breadcrumbs) للصفحات الداخلية: /samples/:id/edit مثلًا */
export function crumbsFor(pathname: string): Crumb[] {
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length < 2 || !SECTION_LABEL[segs[0]]) return []
  const base = `/${segs[0]}`
  const out: Crumb[] = [{ label: 'الرئيسية', to: '/' }, { label: SECTION_LABEL[segs[0]], to: base }]
  const noun = segs[0] === 'samples' ? 'عينة' : 'تركيبة'
  if (segs[1] === 'new') {
    out.push({ label: `${noun} جديدة` })
  } else if (segs[2] === 'edit') {
    out.push({ label: 'التفاصيل', to: `${base}/${segs[1]}` }, { label: 'تعديل' })
  } else {
    out.push({ label: 'التفاصيل' })
  }
  return out
}
