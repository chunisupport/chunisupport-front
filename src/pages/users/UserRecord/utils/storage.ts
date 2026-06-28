import {
  createRecordFilter,
  deleteRecordFilter,
  fetchRecordFilters,
  updateRecordFilter,
} from '../../../../api/recordFilters.ts'
import type { RecordFilterDTO, RecordFilterRequest } from '../../../../types/api.ts'
import type { SavedRecordFilterItem } from '../../components/SavedRecordFiltersDialog.tsx'
import { isValidSavedStandardFilter } from '../../components/savedRecordFilters.ts'
import { normalizeFilterState } from '../types/filterDefaults.ts'
import type { FilterState } from '../types/types.ts'

export const SAVED_FILTER_SCHEMA_VERSION = 3
const STANDARD_RECORD_FILTER_TYPE = 'standard'
const INVALID_SCHEMA_MESSAGE = '古い形式のため無効です。'
const INVALID_FILTER_MESSAGE = '保存値が壊れているため無効です。'

export type SavedFilter = SavedRecordFilterItem<FilterState>

/**
 * 値が null ではないオブジェクトかどうかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns null ではないオブジェクトの場合は true。
 */
function isObjectRecord(value: unknown): value is Partial<FilterState> {
  return typeof value === 'object' && value !== null
}

/**
 * API DTO を画面表示用の保存済み通常フィルターへ変換する。
 *
 * @param dto - API から返された保存済みフィルター。
 * @returns 画面表示用の保存済み通常フィルター。
 */
export function toSavedFilter(dto: RecordFilterDTO<unknown>): SavedFilter {
  const validSchema = dto.schema_version === SAVED_FILTER_SCHEMA_VERSION
  const filter =
    validSchema && isObjectRecord(dto.filter) && isValidSavedStandardFilter(dto.filter)
      ? dto.filter
      : null

  return {
    id: dto.id,
    name: dto.name,
    schemaVersion: dto.schema_version,
    filter: filter ? normalizeFilterState(filter) : null,
    isValid: Boolean(filter),
    invalidReason: validSchema
      ? filter
        ? undefined
        : INVALID_FILTER_MESSAGE
      : INVALID_SCHEMA_MESSAGE,
  }
}

/**
 * 通常レコードフィルター保存 API のリクエストを生成する。
 *
 * @param name - 保存するフィルター名。
 * @param filter - 保存対象の通常レコードフィルター状態。
 * @returns 通常レコードフィルター保存 API のリクエスト。
 */
export function buildSavedFilterRequest(
  name: string,
  filter: FilterState
): RecordFilterRequest<FilterState> {
  return {
    name,
    filter_type: STANDARD_RECORD_FILTER_TYPE,
    schema_version: SAVED_FILTER_SCHEMA_VERSION,
    filter: normalizeFilterState(filter),
  }
}

/**
 * 保存済み通常レコードフィルター一覧をサーバーから取得する。
 *
 * @returns 保存済み通常レコードフィルター一覧。
 */
export async function loadSavedFilters(): Promise<SavedFilter[]> {
  const response = await fetchRecordFilters(STANDARD_RECORD_FILTER_TYPE)
  return response.filters.map(toSavedFilter)
}

/**
 * 新しい通常レコードフィルターをサーバーへ保存する。
 *
 * @param name - 保存するフィルター名。
 * @param filter - 保存対象の通常レコードフィルター状態。
 * @returns なし。
 */
export async function saveNewFilter(name: string, filter: FilterState): Promise<void> {
  await createRecordFilter(buildSavedFilterRequest(name, filter))
}

/**
 * 保存済み通常レコードフィルターを完全上書き更新する。
 *
 * @param id - 更新対象の保存済みフィルターID。
 * @param name - 更新後のフィルター名。
 * @param filter - 更新後の通常レコードフィルター状態。
 * @returns なし。
 */
export async function updateSavedFilter(
  id: string,
  name: string,
  filter: FilterState
): Promise<void> {
  await updateRecordFilter(id, buildSavedFilterRequest(name, filter))
}

/**
 * 指定IDの保存済み通常レコードフィルターを削除する。
 *
 * @param id - 削除対象の保存済みフィルターID。
 * @returns なし。
 */
export async function deleteFilter(id: string): Promise<void> {
  await deleteRecordFilter(id)
}
