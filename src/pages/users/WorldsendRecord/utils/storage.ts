import { normalizeWorldsendFilterState } from '../types/filterDefaults'
import type { WorldsendFilterState } from '../types/filterTypes'

const SAVED_WORLDSEND_FILTER_SCHEMA_VERSION = 2
const SAVED_WORLDSEND_FILTERS_KEY = 'chunisup_saved_worldsend_filters'

/** 保存された WORLD'S END フィルター情報。 */
export interface SavedWorldsendFilter {
  schemaVersion: typeof SAVED_WORLDSEND_FILTER_SCHEMA_VERSION
  id: string
  name: string
  filter: WorldsendFilterState
  savedAt: number
}

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
 * 保存済み WORLD'S END フィルターが現行スキーマかどうかを判定する。
 *
 * @param value - localStorageから復元した値。
 * @returns 現行スキーマの保存済み WORLD'S END フィルターの場合はtrue。
 */
function isCurrentSavedWorldsendFilter(value: unknown): value is SavedWorldsendFilter {
  if (!isObjectRecord(value)) return false
  const filter = value.filter
  if (!isObjectRecord(filter)) return false
  return (
    value.schemaVersion === SAVED_WORLDSEND_FILTER_SCHEMA_VERSION &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.savedAt === 'number' &&
    Array.isArray(filter.attributes) &&
    isNumberRange(filter.levelStarRange) &&
    Array.isArray(filter.genres) &&
    Array.isArray(filter.versions) &&
    isNumberRange(filter.score) &&
    isNullableNumberRange(filter.justiceCount)
  )
}

/**
 * 保存済み WORLD'S END フィルター一覧をlocalStorageへ書き戻す。
 *
 * @param filters - 保存する現行スキーマの WORLD'S END フィルター一覧。
 * @returns なし。
 */
function persistSavedWorldsendFilters(filters: SavedWorldsendFilter[]): void {
  localStorage.setItem(SAVED_WORLDSEND_FILTERS_KEY, JSON.stringify(filters))
}

/**
 * 保存済み WORLD'S END フィルター一覧をlocalStorageから取得する。
 *
 * @returns 保存済みフィルター一覧。不正または旧スキーマの保存値は破棄する。
 */
export function loadSavedWorldsendFilters(): SavedWorldsendFilter[] {
  try {
    const raw = localStorage.getItem(SAVED_WORLDSEND_FILTERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const filters = parsed.filter(isCurrentSavedWorldsendFilter).map((savedFilter) => ({
      ...savedFilter,
      filter: normalizeWorldsendFilterState(savedFilter.filter),
    }))
    if (filters.length !== parsed.length) {
      persistSavedWorldsendFilters(filters)
    }
    return filters
  } catch {
    return []
  }
}

/**
 * 新しい WORLD'S END フィルターをlocalStorageへ保存する。
 *
 * @param name - 保存するフィルター名。
 * @param filter - 保存対象の WORLD'S END フィルター状態。
 * @returns 保存したフィルターID。
 */
export function saveNewWorldsendFilter(name: string, filter: WorldsendFilterState): string {
  const filters = loadSavedWorldsendFilters()
  const id = Date.now().toString()
  filters.push({
    schemaVersion: SAVED_WORLDSEND_FILTER_SCHEMA_VERSION,
    id,
    name,
    filter: normalizeWorldsendFilterState(filter),
    savedAt: Date.now(),
  })
  persistSavedWorldsendFilters(filters)
  return id
}

/**
 * 指定IDの保存済み WORLD'S END フィルターを削除する。
 *
 * @param id - 削除対象の保存済み WORLD'S END フィルターID。
 * @returns なし。
 */
export function deleteWorldsendFilter(id: string): void {
  const filters = loadSavedWorldsendFilters().filter((filter) => filter.id !== id)
  persistSavedWorldsendFilters(filters)
}
