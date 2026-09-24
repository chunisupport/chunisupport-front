import { API_BASE_URL } from '../config'
import type {
  FriendScoreComparisonResponseDTO,
  PlayerDataDifficulty,
  WorldsendFriendScoreComparisonResponseDTO,
} from '../types/api'
import { assertValidUsername } from '../utils/usernameInput'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * 承認済みフレンドとの指定難易度の全譜面比較を取得する。
 *
 * @param username - 比較するフレンドのユーザー名。
 * @param difficulty - 大文字の難易度。
 * @param signal - リクエスト中断シグナル。
 * @returns 勝敗集計と譜面ごとのスコア。
 */
export const fetchFriendComparison = async (
  username: string,
  difficulty: PlayerDataDifficulty,
  signal?: AbortSignal
): Promise<FriendScoreComparisonResponseDTO> => {
  assertValidUsername(username)
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/friend-comparisons/${encodeURIComponent(username)}/charts/${difficulty}`,
    { method: 'GET', signal, requireAuthentication: true }
  )
  return response.json()
}

/**
 * 承認済みフレンドとの全WORLD'S END譜面比較を取得する。
 *
 * @param username - 比較するフレンドのユーザー名。
 * @param signal - リクエスト中断シグナル。
 * @returns 勝敗集計と譜面ごとのスコア。
 */
export const fetchWorldsendFriendComparison = async (
  username: string,
  signal?: AbortSignal
): Promise<WorldsendFriendScoreComparisonResponseDTO> => {
  assertValidUsername(username)
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/friend-comparisons/${encodeURIComponent(username)}/worldsend`,
    { method: 'GET', signal, requireAuthentication: true }
  )
  return response.json()
}
