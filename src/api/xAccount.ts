import { API_BASE_URL } from '../config'
import type { XAccountDTO, XAccountResponse, XAccountSyncRequest } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/** 連携中の X アカウント情報を扱う API のパス */
const X_ACCOUNT_API_PATH = `${API_BASE_URL}/internal/me/x-account`

/**
 * API に保存された、連携中の X アカウントの識別情報を取得する。
 *
 * @returns 保存済みの X アカウント。一度も取得していない場合は null。
 */
export const fetchXAccount = async (): Promise<XAccountDTO | null> => {
  const response = await fetchWithAuth(X_ACCOUNT_API_PATH, { method: 'GET' })
  const data = (await response.json()) as XAccountResponse
  return data.x_account
}

/**
 * X ログイン直後のアクセストークンを API に送り、X から本人のユーザー名を取得し直して保存させる。
 * 画面遷移の裏で呼ぶことがあるため、失敗してもログイン画面へは移動させない。
 *
 * @param request - X ログイン直後の OAuth 1.0a アクセストークンとシークレット。
 * @returns API が X から取得して保存した X アカウント。
 */
export const syncXAccount = async (request: XAccountSyncRequest): Promise<XAccountDTO> => {
  const response = await fetchWithAuth(X_ACCOUNT_API_PATH, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    redirectOnUnauthorized: false,
  })
  return response.json()
}
