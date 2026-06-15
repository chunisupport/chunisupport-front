import {
  createRecordFilter,
  deleteRecordFilter,
  fetchRecordFilters,
  updateRecordFilter,
} from '../../../../api/recordFilters'
import type { RecordFilterDTO, RecordFilterRequest } from '../../../../types/api'
import type { SavedRecordFilterItem } from '../../components/SavedRecordFiltersDialog'
import { normalizeWorldsendFilterState } from '../types/filterDefaults'
import type { WorldsendFilterState } from '../types/filterTypes'

export const SAVED_WORLDSEND_FILTER_SCHEMA_VERSION = 2
const WORLDSEND_RECORD_FILTER_TYPE = 'worldsend'
const INVALID_SCHEMA_MESSAGE = '古い形式のため無効です。'

export type SavedWorldsendFilter = SavedRecordFilterItem<WorldsendFilterState>

/**
 * 値が null ではないオブジェクトかどうかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns null ではないオブジェクトの場合は true。
 */
function isObjectRecord(value: unknown): value is Partial<WorldsendFilterState> {
  return typeof value === 'object' && value !== null
}

/**
 * API DTO を画面表示用の保存済み WORLD'S END フィルターへ変換する。
 *
 * @param dto - API から返された保存済みフィルター。
 * @returns 画面表示用の保存済み WORLD'S END フィルター。
 */
export function toSavedWorldsendFilter(dto: RecordFilterDTO<unknown>): SavedWorldsendFilter {
  const validSchema = dto.schema_version === SAVED_WORLDSEND_FILTER_SCHEMA_VERSION
  const validFilter = isObjectRecord(dto.filter)

  return {
    id: dto.id,
    name: dto.name,
    schemaVersion: dto.schema_version,
    filter: validSchema && validFilter ? normalizeWorldsendFilterState(dto.filter) : null,
    isValid: validSchema && validFilter,
    invalidReason: validSchema ? undefined : INVALID_SCHEMA_MESSAGE,
  }
}

/**
 * WORLD'S END フィルター保存 API のリクエストを生成する。
 *
 * @param name - 保存するフィルター名。
 * @param filter - 保存対象の WORLD'S END フィルター状態。
 * @returns WORLD'S END フィルター保存 API のリクエスト。
 */
export function buildSavedWorldsendFilterRequest(
  name: string,
  filter: WorldsendFilterState
): RecordFilterRequest<WorldsendFilterState> {
  return {
    name,
    filter_type: WORLDSEND_RECORD_FILTER_TYPE,
    schema_version: SAVED_WORLDSEND_FILTER_SCHEMA_VERSION,
    filter: normalizeWorldsendFilterState(filter),
  }
}

/**
 * 保存済み WORLD'S END フィルター一覧をサーバーから取得する。
 *
 * @returns 保存済み WORLD'S END フィルター一覧。
 */
export async function loadSavedWorldsendFilters(): Promise<SavedWorldsendFilter[]> {
  const response = await fetchRecordFilters(WORLDSEND_RECORD_FILTER_TYPE)
  return response.filters.map(toSavedWorldsendFilter)
}

/**
 * 新しい WORLD'S END フィルターをサーバーへ保存する。
 *
 * @param name - 保存するフィルター名。
 * @param filter - 保存対象の WORLD'S END フィルター状態。
 * @returns なし。
 */
export async function saveNewWorldsendFilter(
  name: string,
  filter: WorldsendFilterState
): Promise<void> {
  await createRecordFilter(buildSavedWorldsendFilterRequest(name, filter))
}

/**
 * 保存済み WORLD'S END フィルターを完全上書き更新する。
 *
 * @param id - 更新対象の保存済みフィルターID。
 * @param name - 更新後のフィルター名。
 * @param filter - 更新後の WORLD'S END フィルター状態。
 * @returns なし。
 */
export async function updateSavedWorldsendFilter(
  id: string,
  name: string,
  filter: WorldsendFilterState
): Promise<void> {
  await updateRecordFilter(id, buildSavedWorldsendFilterRequest(name, filter))
}

/**
 * 指定IDの保存済み WORLD'S END フィルターを削除する。
 *
 * @param id - 削除対象の保存済み WORLD'S END フィルターID。
 * @returns なし。
 */
export async function deleteWorldsendFilter(id: string): Promise<void> {
  await deleteRecordFilter(id)
}
