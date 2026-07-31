import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildScoreHistoryTableRows,
  formatScoreHistoryDateTime,
  formatScoreHistoryTimestamp,
  parseScoreHistoryDifficulty,
} from './scoreHistory'

/**
 * テスト用のスコア履歴を生成する。
 *
 * @param updatedAt - スコア更新日時。
 * @param score - スコア。
 * @returns 指定値を持つスコア履歴。
 */
const createHistoryEntry = (updatedAt: string, score: number) => ({
  score,
  clear_lamp: null,
  combo_lamp: null,
  full_chain: null,
  updated_at: updatedAt,
})

test('難易度クエリを大文字のドメイン値へ変換する', () => {
  // Given / When / Then
  assert.equal(parseScoreHistoryDifficulty('master'), 'MASTER')
  assert.equal(parseScoreHistoryDifficulty('ULTIMA'), 'ULTIMA')
})

test('履歴対象外の難易度を拒否する', () => {
  // Given / When / Then
  assert.equal(parseScoreHistoryDifficulty('basic'), null)
  assert.equal(parseScoreHistoryDifficulty(undefined), null)
})

test('不正な更新日時をハイフンへ変換する', () => {
  // Given / When / Then
  assert.equal(formatScoreHistoryDateTime('not-a-date'), '-')
})

test('更新日時を年2桁の日付だけで表示する', () => {
  // Given / When / Then
  assert.equal(formatScoreHistoryDateTime('2026-06-22T12:00:00+09:00'), '26/06/22')
})

test('横軸のUNIX時刻を年2桁の日付だけで表示する', () => {
  // Given
  const timestamp = new Date('2026-06-22T12:00:00+09:00').getTime()

  // When
  const result = formatScoreHistoryTimestamp(timestamp)

  // Then
  assert.equal(result, '26/06/22')
})

test('稼働日をまたぐ位置と最古履歴の末尾へバージョン行を挿入する', () => {
  // Given
  const entries = [
    createHistoryEntry('2026-07-20T12:00:00+09:00', 1_010_000),
    createHistoryEntry('2026-01-10T12:00:00+09:00', 1_005_000),
    createHistoryEntry('2025-01-10T12:00:00+09:00', 1_000_000),
  ]
  const versions = [
    { name: 'CHUNITHM X-VERSE-X', released_at: '2026-06-18' },
    { name: 'CHUNITHM X-VERSE', released_at: '2025-12-11' },
    { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
    { name: 'CHUNITHM LUMINOUS PLUS', released_at: '2024-06-20' },
  ]

  // When
  const result = buildScoreHistoryTableRows(entries, versions)

  // Then
  assert.deepEqual(
    result.map((row) => (row.type === 'score' ? row.entry.score : row.name)),
    [1_010_000, 'CHUNITHM X-VERSE-X', 1_005_000, 'CHUNITHM X-VERSE', 1_000_000, 'CHUNITHM VERSE']
  )
})

test('稼働日当日の履歴を新バージョン側へ含める', () => {
  // Given
  const entries = [
    createHistoryEntry('2026-06-18T10:00:00+09:00', 1_010_000),
    createHistoryEntry('2026-06-17T23:59:59+09:00', 1_005_000),
  ]
  const versions = [
    { name: 'CHUNITHM X-VERSE-X', released_at: '2026-06-18' },
    { name: 'CHUNITHM X-VERSE', released_at: '2025-12-11' },
  ]

  // When
  const result = buildScoreHistoryTableRows(entries, versions)

  // Then
  assert.deepEqual(
    result.map((row) => (row.type === 'score' ? row.entry.score : row.name)),
    [1_010_000, 'CHUNITHM X-VERSE-X', 1_005_000, 'CHUNITHM X-VERSE']
  )
})

test('履歴が空の場合はバージョン行を表示しない', () => {
  // Given / When
  const result = buildScoreHistoryTableRows(
    [],
    [{ name: 'CHUNITHM X-VERSE-X', released_at: '2026-06-18' }]
  )

  // Then
  assert.deepEqual(result, [])
})

test('不正日時を含む履歴でもバージョン行を重複させない', () => {
  // Given
  const entries = [
    createHistoryEntry('2026-07-20T12:00:00+09:00', 1_010_000),
    createHistoryEntry('invalid', 1_007_500),
    createHistoryEntry('2025-01-10T12:00:00+09:00', 1_005_000),
  ]
  const versions = [
    { name: 'CHUNITHM X-VERSE-X', released_at: '2026-06-18' },
    { name: 'CHUNITHM X-VERSE', released_at: '2025-12-11' },
    { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
  ]

  // When
  const result = buildScoreHistoryTableRows(entries, versions)

  // Then
  assert.deepEqual(
    result.map((row) => (row.type === 'score' ? row.entry.score : row.name)),
    [1_010_000, 'CHUNITHM X-VERSE-X', 'CHUNITHM X-VERSE', 1_007_500, 1_005_000, 'CHUNITHM VERSE']
  )
})
