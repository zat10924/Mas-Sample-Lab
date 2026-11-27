import { readPref, usePref, writePref } from './prefs'

const RECENTS_KEY = 'lab-recents'

export function pushRecent(path: string): void {
  const cur = readPref<string[]>(RECENTS_KEY, [])
  writePref(RECENTS_KEY, [path, ...cur.filter((p) => p !== path)].slice(0, 8))
}

export function useRecents(): string[] {
  const [list] = usePref<string[]>(RECENTS_KEY, [])
  return list
}
