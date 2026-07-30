import { API_BASE_URL } from '../config'
import { SUPPORTED_LATEST_SCORE_UPDATE_SCHEMA_VERSIONS } from '../constants/playerLatestUpdate'
import type { PlayerDataResult, PlayerLatestUpdateResult } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

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

/**
 * 認証済みユーザーの保存済み最新プレイヤーデータ更新結果を取得する。
 *
 * @returns 最新更新結果。保存済みの結果がない場合はnull。
 */
export const fetchLatestPlayerDataUpdate = async (): Promise<PlayerLatestUpdateResult | null> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/player-data/latest-update`, {
    requireAuthentication: true,
  })

  if (response.status === 204) {
    return null
  }

  const result: PlayerLatestUpdateResult = await response.json()
  if (
    !SUPPORTED_LATEST_SCORE_UPDATE_SCHEMA_VERSIONS.some(
      (schemaVersion) => schemaVersion === result.schema_version
    )
  ) {
    throw new Error('保存済み更新結果の形式に対応していません。')
  }

  return result
}
