import type { FilterState } from '../types/types'

/** 保存されたフィルター情報 */
export interface SavedFilter {
  id: string
  name: string
  filter: FilterState
  savedAt: number
}

const SAVED_FILTERS_KEY = 'chunisup_saved_filters'

/** 保存されたフィルター一覧をlocalStrageから取得 */
export function loadSavedFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/** 新しいフィルターを保存 */
export function saveNewFilter(name: string, filter: FilterState): string {
  const filters = loadSavedFilters()
  const id = Date.now().toString()
  filters.push({ id, name, filter, savedAt: Date.now() })
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters))
  return id
}

/** フィルターを削除 */
export function deleteFilter(id: string) {
  // 指定ID以外のフィルターを保存し直すことで削除を実現
  const filters = loadSavedFilters().filter((f) => f.id !== id)
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters))
}
