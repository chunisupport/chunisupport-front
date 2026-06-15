import { normalizeFilterState } from '../types/filterDefaults'
import type { FilterState } from '../types/types'

const SAVED_FILTER_SCHEMA_VERSION = 3

/** 保存されたフィルター情報。 */
export interface SavedFilter {
  schemaVersion: typeof SAVED_FILTER_SCHEMA_VERSION
  id: string
  name: string
  filter: FilterState
  savedAt: number
}

const SAVED_FILTERS_KEY = 'chunisup_saved_filters'

/**
 * 値がオブジェクトかどうかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns nullではないオブジェクトの場合はtrue。
 */
function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * 値が数値範囲オブジェクトかどうかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns min/maxが数値の範囲オブジェクトの場合はtrue。
 */
function isNumberRange(value: unknown): value is { min: number; max: number } {
  return isObjectRecord(value) && typeof value.min === 'number' && typeof value.max === 'number'
}

/**
 * 値がnullを許す数値範囲オブジェクトかどうかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns min/maxが数値またはnullの範囲オブジェクトの場合はtrue。
 */
function isNullableNumberRange(
  value: unknown
): value is { min: number | null; max: number | null } {
  return (
    isObjectRecord(value) &&
    (typeof value.min === 'number' || value.min === null) &&
    (typeof value.max === 'number' || value.max === null)
  )
}

/**
 * 保存済みフィルターが現行スキーマかどうかを判定する。
 *
 * @param value - localStorageから復元した値。
 * @returns 現行スキーマの保存済みフィルターの場合はtrue。
 */
function isCurrentSavedFilter(value: unknown): value is SavedFilter {
  if (!isObjectRecord(value)) return false
  const filter = value.filter
  if (!isObjectRecord(filter)) return false
  return (
    value.schemaVersion === SAVED_FILTER_SCHEMA_VERSION &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.savedAt === 'number' &&
    isNumberRange(filter.const) &&
    isNumberRange(filter.score) &&
    isNullableNumberRange(filter.justiceCount) &&
    isNullableNumberRange(filter.overPower)
  )
}

/**
 * 保存済みフィルター一覧をlocalStorageへ書き戻す。
 *
 * @param filters - 保存する現行スキーマのフィルター一覧。
 * @returns なし。
 */
function persistSavedFilters(filters: SavedFilter[]): void {
  localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters))
}

/**
 * 保存されたフィルター一覧をlocalStorageから取得する。
 *
 * @returns 保存済みフィルター一覧。不正または旧スキーマの保存値は破棄する。
 */
export function loadSavedFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const filters = parsed.filter(isCurrentSavedFilter).map((savedFilter) => ({
      ...savedFilter,
      filter: normalizeFilterState(savedFilter.filter),
    }))
    if (filters.length !== parsed.length) {
      persistSavedFilters(filters)
    }
    return filters
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
  filters.push({
    schemaVersion: SAVED_FILTER_SCHEMA_VERSION,
    id,
    name,
    filter: normalizeFilterState(filter),
    savedAt: Date.now(),
  })
  persistSavedFilters(filters)
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
  persistSavedFilters(filters)
}
