import { API_BASE_URL } from '../config'
import type { ApiRootResponse, ApiVersionResponse } from '../types/api'
import { isNotFoundApiError } from '../utils/apiError'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * API ルートから公開メタ情報を取得する。
 *
 * @returns API のアプリケーション名やビルド情報。
 */
export const fetchApiRoot = async (): Promise<ApiRootResponse> => {
  const response = await fetchWithAuth(API_BASE_URL)
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

/**
 * API で feature-flag の確認用機能 `feature_flag_probe` が有効かを取得する。
 * 無効な環境ではルート自体が登録されず 404 になるため、404 を無効として扱う。
 *
 * @returns 有効なら true、無効なら false。
 * @throws 404 以外の理由で取得に失敗した場合。
 */
export const fetchApiFeatureFlagProbe = async (): Promise<boolean> => {
  try {
    await fetchWithAuth(`${API_BASE_URL}/internal/admin/feature-flag-probe`)
    return true
  } catch (error) {
    if (isNotFoundApiError(error)) return false
    throw error
  }
}
