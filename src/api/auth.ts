import { API_BASE_URL } from '../config'
import type { UserDTO } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

type SignupPayload = {
  username: string
  turnstile_token: string
}

type LoginPayload = {
  turnstile_token: string
}

/**
 * Firebase認証済みユーザーのログインをバックエンドで検証する。
 *
 * @param payload Cloudflare Turnstile の応答トークンを含むリクエストボディ。
 * @returns ログイン済みユーザー情報。
 */
export const postLogin = async (payload: LoginPayload): Promise<UserDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    suppressUnauthorizedRedirectForCodes: ['invalid_turnstile_token', 'invalid_token'],
  })

  return response.json()
}

/**
 * Firebase認証済みユーザーを新規登録する。
 *
 * @param payload ユーザー名とCloudflare Turnstile の応答トークンを含むリクエストボディ。
 * @returns 作成されたユーザー情報。
 */
export const postSignup = async (payload: SignupPayload): Promise<UserDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    suppressUnauthorizedRedirectForCodes: ['invalid_turnstile_token', 'invalid_token'],
  })

  return response.json()
}
