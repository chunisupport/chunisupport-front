import { API_BASE_URL } from '../config'
import type { AdminHonorsResponse } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * 管理者向けの称号一覧を取得する。
 *
 * @returns 称号一覧レスポンス。
 */
export const fetchAdminHonors = async (): Promise<AdminHonorsResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/honors`)

  return response.json()
}
