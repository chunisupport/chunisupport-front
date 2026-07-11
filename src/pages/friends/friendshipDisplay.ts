import { FRIENDS_COPY } from './constants'

const friendDateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'short',
  timeStyle: 'short',
})

/**
 * API日時をフレンド画面用の短い日時表記に変換する。
 *
 * @param value - ISO8601形式の日時。未設定の場合は null または undefined。
 * @returns 表示用日時。不正値または未設定の場合はハイフン。
 */
export const formatFriendDateTime = (value: string | null | undefined): string => {
  if (!value) return FRIENDS_COPY.emptyValue

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? FRIENDS_COPY.emptyValue
    : friendDateTimeFormatter.format(date)
}

/**
 * レーティングを小数点以下2桁で表示する。
 *
 * @param rating - APIが返したレーティング。未連携の場合は null。
 * @returns 表示用レーティング。
 */
export const formatFriendRating = (rating: number | null): string =>
  rating === null ? FRIENDS_COPY.emptyValue : rating.toFixed(2)

/**
 * プレイヤー名を表示用に変換する。
 *
 * @param playerName - APIが返したプレイヤー名。未連携の場合は null。
 * @returns 表示用プレイヤー名。
 */
export const formatFriendPlayerName = (playerName: string | null): string =>
  playerName ?? FRIENDS_COPY.playerNotLinked

/**
 * プレイヤーレベルを表示用に変換する。
 *
 * @param level - APIが返したプレイヤーレベル。未連携の場合は null。
 * @returns 表示用プレイヤーレベル。
 */
export const formatFriendPlayerLevel = (level: number | null): string =>
  level === null ? FRIENDS_COPY.playerNotLinked : String(level)
