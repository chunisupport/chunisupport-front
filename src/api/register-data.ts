import { API_BASE_URL } from '../config.ts'
import type { PlayerDataResult } from '../types/api.ts'
import { fetchWithAuth } from './fetchWithAuth.ts'

type RegisterDataFormat = 'json' | 'text'

type RegisterDataPayload = {
  data: string
  format: RegisterDataFormat
}

export const postRegisterData = async (payload: RegisterDataPayload): Promise<void> => {
  const isJson = payload.format === 'json'
  await fetchWithAuth(`${API_BASE_URL}/internal/me/register-data${isJson ? '?format=json' : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': isJson ? 'application/json' : 'text/plain',
    },
    body: payload.data,
  })
}

/**
 * 一時保存済みプレイヤーデータを認証済みユーザーへ確定保存する。
 *
 * @param uploadToken - 一時保存時に発行されたアップロードトークン。
 * @returns プレイヤーデータ登録結果。
 */
export const postPlayerDataCommit = async (uploadToken: string): Promise<PlayerDataResult> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/player-data/commit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uploadToken }),
  })

  return response.json()
}
