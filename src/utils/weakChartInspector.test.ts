import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import {
  inspectWeakCharts,
  isWeakChartDisplayTarget,
  sortWeakChartOutliers,
} from './weakChartInspector'

/**
 * テスト用の通常譜面レコードを生成する。
 *
 * @param score - 獲得スコア。
 * @param chartConst - 譜面定数。
 * @param isPlayed - プレイ済みか。
 * @param clearLamp - クリアランプ。
 * @returns テスト用レコード。
 */
const createRecord = (
  score: number,
  chartConst = 14.0,
  isPlayed = true,
  clearLamp: PlayerRecordDTO['clear_lamp'] = null
): PlayerRecordDTO => ({
  is_played: isPlayed,
  is_op_target: false,
  updated_at: null,
  difficulty: 'MASTER',
  id: `${chartConst}-${score}`,
  title: `譜面 ${score}`,
  artist: 'テスト',
  const: chartConst,
  is_const_unknown: false,
  score,
  rating: 0,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: clearLamp,
  combo_lamp: null,
  full_chain: null,
  slot: null,
})

test('Tukey法の下側外れ値を苦手譜面として抽出すること', () => {
  // Given
  const records = [975000, 1000000, 1001000, 1002000, 1003000].map((score) => createRecord(score))

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.outliers.length, 1)
  assert.equal(result.outliers[0].record.score, 975000)
  assert.equal(result.outliers[0].direction, 'LOW')
})

test('未プレイ譜面を分布と外れ値の計算から除外すること', () => {
  // Given
  const records = [
    createRecord(0, 14.0, false),
    createRecord(1000000, 14.0),
    createRecord(1005000, 14.0),
  ]

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.distributions[0].count, 2)
  assert.equal(result.distributions[0].lowerWhisker, 1000000)
  assert.equal(result.outliers.length, 0)
})

test('FAILED譜面を分布と外れ値の計算から除外すること', () => {
  // Given
  const records = [
    createRecord(800000, 14.0, true, 'FAILED'),
    createRecord(1000000, 14.0),
    createRecord(1005000, 14.0),
  ]

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.distributions[0].count, 2)
  assert.equal(result.distributions[0].lowerWhisker, 1000000)
  assert.equal(result.outliers.length, 0)
})

test('S未満を集計に含め、理論値超過だけを除外すること', () => {
  // Given
  const records = [
    createRecord(900000),
    createRecord(975000),
    createRecord(1010000),
    createRecord(1010001),
  ]

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.distributions[0].count, 3)
  assert.equal(result.distributions[0].lowerWhisker, 900000)
  assert.equal(result.distributions[0].upperWhisker, 1010000)
})

test('表示対象を1000000以上に限定すること', () => {
  // Given
  const hiddenRecord = createRecord(999999)
  const visibleRecord = createRecord(1000000)

  // When & Then
  assert.equal(isWeakChartDisplayTarget(hiddenRecord), false)
  assert.equal(isWeakChartDisplayTarget(visibleRecord), true)
})

test('レベル10未満の譜面も分布と外れ値の計算に含めること', () => {
  // Given
  const records = [
    createRecord(990000, 9.9),
    createRecord(1000000, 10.0),
    createRecord(1005000, 10.0),
  ]

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.distributions.length, 2)
  assert.equal(result.distributions[0].chartConst, 9.9)
  assert.equal(result.distributions[0].count, 1)
  assert.equal(result.distributions[1].chartConst, 10.0)
  assert.equal(result.distributions[1].count, 2)
})

test('MASTER以外の難易度も分布と外れ値の計算に含めること', () => {
  // Given
  const expertRecord = { ...createRecord(990000), difficulty: 'EXPERT' as const }
  const masterRecord = createRecord(1000000)
  const ultimaRecord = { ...createRecord(1005000), difficulty: 'ULTIMA' as const }

  // When
  const result = inspectWeakCharts([expertRecord, masterRecord, ultimaRecord])

  // Then
  assert.equal(result.distributions[0].count, 3)
})

test('譜面定数ごとに独立した分布を昇順で生成すること', () => {
  // Given
  const records = [createRecord(1000000, 14.5), createRecord(990000, 13.0)]

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.deepEqual(
    result.distributions.map((distribution) => distribution.chartConst),
    [13.0, 14.5]
  )
})

test('苦手譜面一覧を指定列と方向でソートできること', () => {
  // Given
  const lowerScore = { record: createRecord(980000, 14.0), direction: 'LOW' as const, distance: 1 }
  const higherScore = {
    record: createRecord(1000000, 13.0),
    direction: 'LOW' as const,
    distance: 2,
  }

  // When
  const ascending = sortWeakChartOutliers([higherScore, lowerScore], 'score', 'asc')
  const descending = sortWeakChartOutliers([higherScore, lowerScore], 'const', 'desc')

  // Then
  assert.deepEqual(
    ascending.map(({ record }) => record.score),
    [980000, 1000000]
  )
  assert.deepEqual(
    descending.map(({ record }) => record.const),
    [14.0, 13.0]
  )
})
