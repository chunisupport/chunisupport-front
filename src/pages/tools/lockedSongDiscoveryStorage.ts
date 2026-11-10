import type { LockedSongObservation } from '../../utils/lockedSongDiscovery'
import {
  LOCKED_SONG_DISCOVERY_OBSERVATIONS_STORAGE_PREFIX,
  type LockedSongDiscoveryAxis,
} from './lockedSongDiscovery.constants.ts'

/** 分類軸と分類IDをキーに持つ筐体入力値。 */
export type LockedSongObservations = Record<string, LockedSongObservation>

/**
 * ユーザー別に保存された筐体入力値を読み取る。
 *
 * @param username - ログインユーザー名。未認証時はundefined。
 * @returns 保存済みの文字列入力値。未認証・未保存・読み取り失敗時は空の入力値。
 */
export const readLockedSongObservations = (
  username: string | undefined
): LockedSongObservations => {
  if (!username) return {}
  try {
    const stored = window.localStorage.getItem(
      `${LOCKED_SONG_DISCOVERY_OBSERVATIONS_STORAGE_PREFIX}${username}`
    )
    const parsed: unknown = stored === null ? null : JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([, value]) =>
            value !== null &&
            typeof value === 'object' &&
            typeof value.overPower === 'string' &&
            typeof value.percent === 'string'
        )
        .map(([key, value]) => [key, { overPower: value.overPower, percent: value.percent }])
    )
  } catch {
    return {}
  }
}

/**
 * ユーザー別に筐体入力値を保存する。
 *
 * @param username - ログインユーザー名。未認証時はundefined。
 * @param observations - 入力途中・空欄を含む分類別のOPとOP%。
 * @returns なし。
 */
export const saveLockedSongObservations = (
  username: string | undefined,
  observations: LockedSongObservations
): void => {
  if (!username) return
  try {
    window.localStorage.setItem(
      `${LOCKED_SONG_DISCOVERY_OBSERVATIONS_STORAGE_PREFIX}${username}`,
      JSON.stringify(observations)
    )
  } catch {
    // 保存できない環境でも、入力操作は画面上で維持する。
  }
}

/**
 * 指定した分類の筐体入力値を消去する。
 *
 * @param observations - 消去前の分類別入力値。
 * @param axis - 入力値を消去する分類軸。
 * @returns 他の分類の入力値を維持した新しい入力値。
 */
export const clearLockedSongObservations = (
  observations: LockedSongObservations,
  axis: LockedSongDiscoveryAxis
): LockedSongObservations =>
  Object.fromEntries(Object.entries(observations).filter(([key]) => !key.startsWith(`${axis}:`)))
