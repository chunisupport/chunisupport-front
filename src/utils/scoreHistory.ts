import type { ScoreHistoryDifficulty } from '../api/songs'

const scoreHistoryDateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * クエリ文字列の難易度をスコア履歴対象のドメイン値へ変換する。
 *
 * @param value - URLから取得した難易度。
 * @returns 有効な大文字難易度。対象外の場合は null。
 */
export const parseScoreHistoryDifficulty = (
  value: string | string[] | undefined
): ScoreHistoryDifficulty | null => {
  const normalized = Array.isArray(value) ? value[0]?.toUpperCase() : value?.toUpperCase()
  if (normalized === 'EXPERT' || normalized === 'MASTER' || normalized === 'ULTIMA') {
    return normalized
  }
  return null
}

/**
 * スコア履歴の更新日時を日本語表示へ整形する。
 *
 * @param value - ISO 8601形式の更新日時。
 * @returns 整形済み日時。不正値の場合はハイフン。
 */
export const formatScoreHistoryDateTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : scoreHistoryDateTimeFormatter.format(date)
}
