import type { FriendshipUserDTO } from '../../types/api'
import { formatOverPowerValue } from '../../utils/overPowerFormat'
import { formatNullablePlayerRating } from '../../utils/ratingFormat'
import type { FriendsTabValue } from './constants'
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
 * OVER POWER値をプロフィールカードと同じ桁数で表示する。
 *
 * @param value - APIが返したOVER POWER値。未連携の場合は null。
 * @returns 表示用OVER POWER値。
 */
export const formatFriendOverPowerValue = (value: number | null): string =>
  value === null ? FRIENDS_COPY.emptyValue : formatOverPowerValue(value)

/**
 * プレイヤー名を表示用に変換する。
 *
 * @param playerName - APIが返したプレイヤー名。未連携の場合は null。
 * @returns 表示用プレイヤー名。
 */
export const formatFriendPlayerName = (playerName: string | null): string =>
  playerName ?? FRIENDS_COPY.playerNotLinked

/**
 * フレンドカードでプロフィール情報とリンクを非表示にするか判定する。
 *
 * @param variant - 表示中のフレンド画面タブ。
 * @param user - 公開設定を持つ表示対象ユーザー。
 * @returns 未承認の非公開ユーザーなら true。
 */
export const shouldHideFriendProfile = (
  variant: FriendsTabValue,
  user: Pick<FriendshipUserDTO, 'is_private'>
): boolean => variant !== 'friends' && user.is_private

/** フレンドカードに表示する整形済みの値 */
export type FriendCardDisplay = {
  /** プレイヤーレベル */
  level: string
  /** プレイヤー名 */
  playerName: string
  /** レーティング */
  rating: string
  /** OVER POWER値 */
  overPower: string
}

const MASKED_FRIEND_CARD_DISPLAY: FriendCardDisplay = {
  level: FRIENDS_COPY.maskedLevel,
  playerName: FRIENDS_COPY.maskedPlayerName,
  rating: FRIENDS_COPY.maskedValue,
  overPower: FRIENDS_COPY.maskedValue,
}

/**
 * フレンドカードに表示する値を整形する。非公開で隠す対象は全項目を伏せ字にする。
 *
 * @param user - 表示対象のユーザー概要。
 * @param hidesProfile - プロフィール情報を隠すか。
 * @returns カード表示用の文字列。
 */
export const buildFriendCardDisplay = (
  user: Pick<FriendshipUserDTO, 'player_level' | 'player_name' | 'rating' | 'overpower_value'>,
  hidesProfile: boolean
): FriendCardDisplay =>
  hidesProfile
    ? MASKED_FRIEND_CARD_DISPLAY
    : {
        level: user.player_level === null ? FRIENDS_COPY.emptyValue : String(user.player_level),
        playerName: formatFriendPlayerName(user.player_name),
        rating: formatNullablePlayerRating(user.rating),
        overPower: formatFriendOverPowerValue(user.overpower_value),
      }
