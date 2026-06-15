import { API_BASE_URL } from '../config'
import type { ApiRootResponse, ApiVersionResponse } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * API ルートから公開メタ情報を取得する。
 *
 * @returns API のアプリケーション名やビルド情報。
 */
export const fetchApiRoot = async (): Promise<ApiRootResponse> => {
  const response = await fetch(API_BASE_URL)
  if (!response.ok) {
    throw new Error('APIバージョン情報の取得に失敗しました')
  }

  return response.json()
}

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
