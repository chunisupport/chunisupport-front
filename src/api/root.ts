import { API_BASE_URL } from '../config'
import type { ApiVersionResponse } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * 管理者向けビルド情報エンドポイントからAPIのバージョン情報を取得する。
 *
 * @returns API のアプリケーション名、ビルド日、コミットハッシュ、Go バージョン。
 */
export const fetchApiVersion = async (): Promise<ApiVersionResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/admin/build-info`)
  if (!response.ok) {
    throw new Error('APIバージョン情報の取得に失敗しました')
  }

  return response.json()
}
