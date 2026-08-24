import type { PlayerMetricHistoryEntryDTO } from '../types/api'

/** 公式指標履歴の並び順 */
export type PlayerMetricHistorySortOrder = 'ascending' | 'descending'

/** 公式指標履歴でグラフ化する値 */
export type PlayerMetricHistoryMetric = 'rating' | 'overpower' | 'overpower_percent'

/** Chart.jsへ渡す公式指標履歴の座標 */
export type PlayerMetricHistoryChartPoint = { x: number; y: number | null }

const PLAYER_METRIC_HISTORY_NOT_FOUND_CODE = 'player_metric_history_not_found'
const INVALID_DATE_LABEL = '-'
const PLAYER_METRIC_HISTORY_TIME_ZONE = 'Asia/Tokyo'
const playerMetricHistoryDateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: PLAYER_METRIC_HISTORY_TIME_ZONE,
})
const playerMetricHistoryAxisDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  timeZone: PLAYER_METRIC_HISTORY_TIME_ZONE,
})

/** APIエラーコードを参照できる最小限の構造 */
type ApiErrorLike = {
  code?: string
}

/**
 * unknownの値からAPIエラーコードを参照できる構造を取り出す。
 *
 * @param error - 判定対象のエラー。
 * @returns APIエラーとして参照できる値。オブジェクトでなければnull。
 */
const toApiErrorLike = (error: unknown): ApiErrorLike | null =>
  typeof error === 'object' && error !== null ? (error as ApiErrorLike) : null

/**
 * 公式指標履歴を取得日時で並べ替える。
 *
 * @param entries - APIが返した公式指標履歴。
 * @param order - 古い順または新しい順。
 * @returns 元配列を変更せず、指定順へ並べ替えた履歴。不正日時は末尾へ配置する。
 */
export const sortPlayerMetricHistoryEntries = (
  entries: readonly PlayerMetricHistoryEntryDTO[],
  order: PlayerMetricHistorySortOrder
): PlayerMetricHistoryEntryDTO[] =>
  [...entries].sort((left, right) => {
    const leftTimestamp = new Date(left.data_collected_at).getTime()
    const rightTimestamp = new Date(right.data_collected_at).getTime()
    const leftIsInvalid = Number.isNaN(leftTimestamp)
    const rightIsInvalid = Number.isNaN(rightTimestamp)

    if (leftIsInvalid && rightIsInvalid) return 0
    if (leftIsInvalid) return 1
    if (rightIsInvalid) return -1

    return order === 'ascending' ? leftTimestamp - rightTimestamp : rightTimestamp - leftTimestamp
  })

/**
 * 公式指標履歴をChart.js用の古い順の座標へ変換する。
 *
 * @param entries - APIが返した公式指標履歴。
 * @param metric - RATING、OVER POWER、OP%のいずれか。
 * @returns 不正日時を除外し、未記録値を線の切れ目として残した古い順のグラフ座標。
 */
export const buildPlayerMetricHistoryChartPoints = (
  entries: readonly PlayerMetricHistoryEntryDTO[],
  metric: PlayerMetricHistoryMetric
): PlayerMetricHistoryChartPoint[] =>
  sortPlayerMetricHistoryEntries(entries, 'ascending').flatMap((entry) => {
    const timestamp = new Date(entry.data_collected_at).getTime()
    if (Number.isNaN(timestamp)) return []

    const value = entry[metric]
    return [{ x: timestamp, y: value }]
  })

/**
 * 指定した公式指標に記録済みの値が1件以上あるか判定する。
 *
 * @param entries - APIが返した公式指標履歴。
 * @param metric - 判定対象の公式指標。
 * @returns nullでない値が1件以上あればtrue。
 */
export const hasPlayerMetricHistoryValues = (
  entries: readonly PlayerMetricHistoryEntryDTO[],
  metric: PlayerMetricHistoryMetric
): boolean => entries.some((entry) => entry[metric] !== null)

/**
 * 公式指標履歴の取得日時を日本時間の日時表示へ整形する。
 *
 * @param value - ISO 8601形式の取得日時。
 * @returns yyyy/MM/dd HH:mm形式の日時。不正値の場合はハイフン。
 */
export const formatPlayerMetricHistoryDateTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? INVALID_DATE_LABEL
    : playerMetricHistoryDateTimeFormatter.format(date)
}

/**
 * 公式指標履歴グラフの横軸日時を日本時間の日付表示へ整形する。
 *
 * @param value - UNIXエポックからの経過ミリ秒。
 * @returns yy/MM/dd形式の日付。不正値の場合はハイフン。
 */
export const formatPlayerMetricHistoryAxisTimestamp = (value: number): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? INVALID_DATE_LABEL
    : playerMetricHistoryAxisDateFormatter.format(date)
}

/**
 * 公式指標履歴グラフのツールチップ日時を日本時間で整形する。
 *
 * @param value - UNIXエポックからの経過ミリ秒。
 * @returns yyyy/MM/dd HH:mm形式の日時。不正値の場合はハイフン。
 */
export const formatPlayerMetricHistoryTooltipTimestamp = (value: number): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? INVALID_DATE_LABEL
    : playerMetricHistoryDateTimeFormatter.format(date)
}

/**
 * APIエラーが公式指標履歴なしを表すか判定する。
 *
 * @param error - 判定対象のエラー。
 * @returns player_metric_history_not_foundの場合はtrue。
 */
export const isPlayerMetricHistoryNotFoundError = (error: unknown): boolean =>
  toApiErrorLike(error)?.code === PLAYER_METRIC_HISTORY_NOT_FOUND_CODE
