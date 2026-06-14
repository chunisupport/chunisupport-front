import { API_BASE_URL } from '../config'
import type { ApiRootResponse } from '../types/api'

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
