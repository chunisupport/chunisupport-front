import { normalizeFilterState } from '../types/filterDefaults'
import type { FilterState } from '../types/types'

/** 保存されたフィルター情報 */
export interface SavedFilter {
  id: string
  name: string
  filter: FilterState
  savedAt: number
}

const SAVED_FILTERS_KEY = 'chunisup_saved_filters'

/**
 * 保存されたフィルター一覧をlocalStorageから取得する。
 *
 * @returns 保存済みフィルター一覧。不正な保存値の場合は空配列。
 */
export function loadSavedFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedFilter[]
    return parsed.map((savedFilter) => ({
      ...savedFilter,
      filter: normalizeFilterState(savedFilter.filter),
    }))
  } catch {
    return []
  }
}

/**
 * 新しいフィルターをlocalStorageへ保存する。
 *
 * @param name - 保存するフィルター名。
 * @param filter - 保存対象のフィルター状態。
 * @returns 保存したフィルターID。
 */
export function saveNewFilter(name: string, filter: FilterState): string {
  const filters = loadSavedFilters()
  const id = Date.now().toString()
  filters.push({ id, name, filter: normalizeFilterState(filter), savedAt: Date.now() })
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters))
  return id
}

/**
 * 指定IDの保存済みフィルターを削除する。
 *
 * @param id - 削除対象の保存済みフィルターID。
 * @returns なし。
 */
export function deleteFilter(id: string) {
  // 指定ID以外のフィルターを保存し直すことで削除を実現
  const filters = loadSavedFilters().filter((f) => f.id !== id)
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters))
}
