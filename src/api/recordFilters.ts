import { API_BASE_URL } from '../config'
import type {
  RecordFilterDTO,
  RecordFilterRequest,
  RecordFiltersResponse,
  RecordFilterType,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * 保存済みレコードフィルター一覧を取得する。
 *
 * @param filterType - 取得対象のフィルター種別。未指定の場合は全種別を取得する。
 * @returns 保存済みレコードフィルター一覧。
 */
export const fetchRecordFilters = async <TFilter = unknown>(
  filterType?: RecordFilterType
): Promise<RecordFiltersResponse<TFilter>> => {
  const query = filterType ? `?filter_type=${encodeURIComponent(filterType)}` : ''
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/record-filters${query}`, {
    method: 'GET',
  })

  return response.json()
}

/**
 * レコードフィルターを新規保存する。
 *
 * @param data - 保存するフィルター情報。
 * @returns 作成された保存済みレコードフィルター。
 */
export const createRecordFilter = async <TFilter>(
  data: RecordFilterRequest<TFilter>
): Promise<RecordFilterDTO<TFilter>> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/record-filters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}

/**
 * レコードフィルターを完全上書き更新する。
 *
 * @param id - 更新対象の保存済みフィルターID。
 * @param data - 上書きするフィルター情報。
 * @returns 更新後の保存済みレコードフィルター。
 */
export const updateRecordFilter = async <TFilter>(
  id: string,
  data: RecordFilterRequest<TFilter>
): Promise<RecordFilterDTO<TFilter>> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/me/record-filters/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )

  return response.json()
}

/**
 * 保存済みレコードフィルターを削除する。
 *
 * @param id - 削除対象の保存済みフィルターID。
 * @returns なし。
 */
export const deleteRecordFilter = async (id: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/record-filters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
