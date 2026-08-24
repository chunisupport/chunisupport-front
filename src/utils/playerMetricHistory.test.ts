import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerMetricHistoryEntryDTO } from '../types/api'
import {
  buildPlayerMetricHistoryChartPoints,
  formatPlayerMetricHistoryAxisTimestamp,
  formatPlayerMetricHistoryDateTime,
  formatPlayerMetricHistoryTooltipTimestamp,
  hasPlayerMetricHistoryValues,
  isPlayerMetricHistoryNotFoundError,
  sortPlayerMetricHistoryEntries,
} from './playerMetricHistory'

/**
 * 公式指標履歴テスト用の1件を生成する。
 *
 * @param dataCollectedAt - データ取得日時。
 * @param rating - 公式RATING。
 * @param overpower - 公式OVER POWER。
 * @param overpowerPercent - 公式OP%。
 * @returns 指定値を持つ履歴DTO。
 */
const createHistoryEntry = (
  dataCollectedAt: string,
  rating: number,
  overpower: number,
  overpowerPercent: number | null = null
): PlayerMetricHistoryEntryDTO => ({
  rating,
  overpower,
  overpower_percent: overpowerPercent,
  data_collected_at: dataCollectedAt,
})

test('公式OPパーセントの未記録値をグラフの切れ目として残す', () => {
  // Given
  const oldest = createHistoryEntry('2026-07-01T12:00:00Z', 17.1, 12_000, null)
  const middle = createHistoryEntry('2026-07-15T12:00:00Z', 17.2, 12_100, 98.7)
  const latest = createHistoryEntry('2026-08-08T12:00:00Z', 17.25, 12_345.67, 98.76)

  // When
  const result = buildPlayerMetricHistoryChartPoints([latest, oldest, middle], 'overpower_percent')

  // Then
  assert.deepEqual(result, [
    { x: new Date(oldest.data_collected_at).getTime(), y: null },
    { x: new Date(middle.data_collected_at).getTime(), y: 98.7 },
    { x: new Date(latest.data_collected_at).getTime(), y: 98.76 },
  ])
})

test('公式指標に記録済みの値があるか判定する', () => {
  // Given
  const unknown = createHistoryEntry('2026-07-01T12:00:00Z', 17.1, 12_000, null)
  const known = createHistoryEntry('2026-08-08T12:00:00Z', 17.25, 12_345.67, 98.76)

  // When / Then
  assert.equal(hasPlayerMetricHistoryValues([unknown], 'overpower_percent'), false)
  assert.equal(hasPlayerMetricHistoryValues([unknown, known], 'overpower_percent'), true)
  assert.equal(hasPlayerMetricHistoryValues([unknown], 'rating'), true)
})

test('公式指標履歴を元配列を変更せず古い順へ並べ替える', () => {
  // Given
  const latest = createHistoryEntry('2026-08-08T12:00:00Z', 17.25, 12_345.67)
  const oldest = createHistoryEntry('2026-07-01T12:00:00Z', 17.1, 12_000)
  const entries = [latest, oldest]

  // When
  const result = sortPlayerMetricHistoryEntries(entries, 'ascending')

  // Then
  assert.deepEqual(result, [oldest, latest])
  assert.deepEqual(entries, [latest, oldest])
})

test('公式指標履歴を新しい順へ並べ替え、不正日時は末尾へ配置する', () => {
  // Given
  const oldest = createHistoryEntry('2026-07-01T12:00:00Z', 17.1, 12_000)
  const latest = createHistoryEntry('2026-08-08T12:00:00Z', 17.25, 12_345.67)
  const invalid = createHistoryEntry('invalid', 0, 0)

  // When
  const result = sortPlayerMetricHistoryEntries([oldest, invalid, latest], 'descending')

  // Then
  assert.deepEqual(result, [latest, oldest, invalid])
})

test('指定した公式指標を不正日時を除外した古い順のグラフ座標へ変換する', () => {
  // Given
  const latest = createHistoryEntry('2026-08-08T12:00:00Z', 17.25, 12_345.67)
  const oldest = createHistoryEntry('2026-07-01T12:00:00Z', 17.1, 12_000)
  const invalid = createHistoryEntry('invalid', 99, 99)

  // When
  const result = buildPlayerMetricHistoryChartPoints([latest, invalid, oldest], 'rating')

  // Then
  assert.deepEqual(result, [
    { x: new Date(oldest.data_collected_at).getTime(), y: 17.1 },
    { x: new Date(latest.data_collected_at).getTime(), y: 17.25 },
  ])
})

test('公式指標履歴の取得日時と横軸日時を日本時間で整形する', () => {
  // Given
  const value = '2026-08-08T12:34:00Z'
  const timestamp = new Date(value).getTime()

  // When
  const dateTime = formatPlayerMetricHistoryDateTime(value)
  const axisDate = formatPlayerMetricHistoryAxisTimestamp(timestamp)
  const tooltipDateTime = formatPlayerMetricHistoryTooltipTimestamp(timestamp)

  // Then
  assert.equal(dateTime, '2026/08/08 21:34')
  assert.equal(axisDate, '26/08/08')
  assert.equal(tooltipDateTime, '2026/08/08 21:34')
})

test('不正日時はハイフンへ変換する', () => {
  // Given / When / Then
  assert.equal(formatPlayerMetricHistoryDateTime('invalid'), '-')
  assert.equal(formatPlayerMetricHistoryAxisTimestamp(Number.NaN), '-')
  assert.equal(formatPlayerMetricHistoryTooltipTimestamp(Number.NaN), '-')
})

test('公式指標履歴なしのAPIエラーだけを識別する', () => {
  // Given
  const historyNotFound = { status: 404, code: 'player_metric_history_not_found' }
  const userNotFound = { status: 404, code: 'user_not_found' }

  // When / Then
  assert.equal(isPlayerMetricHistoryNotFoundError(historyNotFound), true)
  assert.equal(isPlayerMetricHistoryNotFoundError(userNotFound), false)
  assert.equal(isPlayerMetricHistoryNotFoundError(null), false)
})
