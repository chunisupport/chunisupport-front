import { API_BASE_URL } from '../config.ts'
import type {
  AdminHonorDTO,
  AdminHonorsResponse,
  HonorRequestDTO,
  HonorTypesResponse,
} from '../types/api.ts'
import { fetchWithAuth } from './fetchWithAuth.ts'

/**
 * 管理者向けの称号一覧を取得する。
 *
 * @returns 称号一覧レスポンス。
 */
export const fetchAdminHonors = async (): Promise<AdminHonorsResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/honors`)

  return response.json()
}

/**
 * 管理者向けの称号タイプ一覧を取得する。
 *
 * @returns 称号タイプ一覧レスポンス。
 */
export const fetchHonorTypes = async (): Promise<HonorTypesResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master/honor-types`)

  return response.json()
}

/**
 * 指定した称号を更新する。
 *
 * @param id - 更新対象の称号ID。
 * @param request - 更新内容。
 * @returns 更新後の称号。
 */
export const updateHonor = async (id: number, request: HonorRequestDTO): Promise<AdminHonorDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/honors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return response.json()
}
