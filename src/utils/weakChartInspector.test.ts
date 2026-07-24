import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO } from '../types/api'
import {
  filterWeakChartAggregationRecords,
  inspectWeakCharts,
  sortWeakChartOutliers,
  toggleWeakChartAggregationDifficulty,
  WEAK_CHART_OP_TARGET_FILTER,
} from './weakChartInspector'

/**
 * テスト用の通常譜面レコードを生成する。
 *
 * @param score - 獲得スコア。
 * @param chartConst - 譜面定数。
 * @param isPlayed - プレイ済みか。
 * @param clearLamp - クリアランプ。
 * @param overrides - 上書きするレコード項目。
 * @returns テスト用レコード。
 */
const createRecord = (
  score: number,
  chartConst = 14.0,
  isPlayed = true,
  clearLamp: PlayerRecordDTO['clear_lamp'] = null,
  overrides: Partial<PlayerRecordDTO> = {}
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
  ...overrides,
})

/** 集計対象範囲を制限しないテスト用設定。 */
const FULL_AGGREGATION_RANGE = {
  scoreMin: 0,
  scoreMax: 1010000,
  constMin: 1,
  constMax: 16,
} as const

test('理論値OP対象では現在のOP対象フラグではなく楽曲マスタの対象難易度を使う', () => {
  // Given: 現在のOP対象と理論値OP対象が反対になっている2曲。
  const records = [
    createRecord(1000000, 14, true, null, {
      id: 'song-1',
      difficulty: 'MASTER',
      is_op_target: true,
    }),
    createRecord(1005000, 15, true, null, {
      id: 'song-1',
      difficulty: 'ULTIMA',
      is_op_target: false,
    }),
    createRecord(1004000, 14.5, true, null, {
      id: 'song-2',
      difficulty: 'MASTER',
      is_op_target: false,
    }),
    createRecord(1001000, 14, true, null, {
      id: 'song-2',
      difficulty: 'ULTIMA',
      is_op_target: true,
    }),
  ]
  const targetDifficultyBySongId = new Map([
    ['song-1', 'ULTIMA'] as const,
    ['song-2', 'MASTER'] as const,
  ])

  // When: 理論値OP対象だけに絞り込む。
  const result = filterWeakChartAggregationRecords(
    records,
    targetDifficultyBySongId,
    [WEAK_CHART_OP_TARGET_FILTER],
    FULL_AGGREGATION_RANGE
  )

  // Then: 各曲の楽曲マスタが示す難易度だけが残る。
  assert.deepEqual(
    result.map((record) => `${record.id}:${record.difficulty}`),
    ['song-1:ULTIMA', 'song-2:MASTER']
  )
})

test('理論値OP対象では未プレイ譜面と対象難易度を解決できないレコードを除外する', () => {
  // Given: 未プレイの理論値対象譜面、対象難易度なし、楽曲マスタなしのレコード。
  const records = [
    createRecord(0, 15, false, null, {
      id: 'unplayed',
      difficulty: 'ULTIMA',
    }),
    createRecord(1000000, 14, true, null, {
      id: 'without-target',
      difficulty: 'MASTER',
    }),
    createRecord(1000000, 14, true, null, {
      id: 'missing-song',
      difficulty: 'MASTER',
    }),
  ]
  const targetDifficultyBySongId = new Map([['unplayed', 'ULTIMA'] as const])

  // When: 理論値OP対象だけに絞り込む。
  const result = filterWeakChartAggregationRecords(
    records,
    targetDifficultyBySongId,
    [WEAK_CHART_OP_TARGET_FILTER],
    FULL_AGGREGATION_RANGE
  )

  // Then: フォールバックせず全件が除外される。
  assert.deepEqual(result, [])
})

test('通常難易度選択ではOP対象フラグに関係なく選択難易度だけを残す', () => {
  // Given: 現在のOP対象フラグが異なるMASTERとULTIMA。
  const records = [
    createRecord(1000000, 14, true, null, {
      id: 'song-1',
      difficulty: 'MASTER',
      is_op_target: false,
    }),
    createRecord(1005000, 15, true, null, {
      id: 'song-1',
      difficulty: 'ULTIMA',
      is_op_target: true,
    }),
  ]

  // When: MASTERを通常難易度として選択する。
  const result = filterWeakChartAggregationRecords(
    records,
    new Map([['song-1', 'ULTIMA']]),
    ['MASTER'],
    FULL_AGGREGATION_RANGE
  )

  // Then: OP対象フラグに関係なくMASTERだけが残る。
  assert.deepEqual(
    result.map((record) => record.difficulty),
    ['MASTER']
  )
})

test('集計対象のスコアと譜面定数は境界値を含む範囲で絞り込む', () => {
  // Given: スコアと譜面定数が集計範囲の内外にあるMASTER譜面。
  const records = [
    createRecord(999999, 14, true, null, { id: 'low-score' }),
    createRecord(1000000, 14, true, null, { id: 'lower-bound' }),
    createRecord(1005000, 15, true, null, { id: 'upper-bound' }),
    createRecord(1005001, 15, true, null, { id: 'high-score' }),
    createRecord(1001000, 13.9, true, null, { id: 'low-const' }),
    createRecord(1001000, 15.1, true, null, { id: 'high-const' }),
  ]

  // When: スコア1,000,000～1,005,000、定数14.0～15.0で絞り込む。
  const result = filterWeakChartAggregationRecords(records, new Map(), ['MASTER'], {
    scoreMin: 1000000,
    scoreMax: 1005000,
    constMin: 14,
    constMax: 15,
  })

  // Then: 両方の範囲に収まる境界値の譜面だけが残る。
  assert.deepEqual(
    result.map((record) => record.id),
    ['lower-bound', 'upper-bound']
  )
})

test('理論値OP対象と通常難易度は排他選択になる', () => {
  // Given: MASTERとULTIMAを選択中。
  const selected = ['MASTER', 'ULTIMA'] as const

  // When: 理論値OP対象を選び、解除後にMASTERを選び直す。
  const opTargetSelected = toggleWeakChartAggregationDifficulty(
    selected,
    WEAK_CHART_OP_TARGET_FILTER
  )
  const opTargetCleared = toggleWeakChartAggregationDifficulty(
    opTargetSelected,
    WEAK_CHART_OP_TARGET_FILTER
  )
  const masterSelected = toggleWeakChartAggregationDifficulty(opTargetSelected, 'MASTER')

  // Then: 理論値OP対象は単独選択となり、解除と通常難易度への切り替えができる。
  assert.deepEqual(opTargetSelected, [WEAK_CHART_OP_TARGET_FILTER])
  assert.deepEqual(opTargetCleared, [])
  assert.deepEqual(masterSelected, ['MASTER'])
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

test('Tukey法の上側外れ値を得意かもしれない譜面として抽出すること', () => {
  // Given
  const records = [1000000, 1001000, 1002000, 1003000, 1010000].map((score) => createRecord(score))

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.outliers.length, 1)
  assert.equal(result.outliers[0].record.score, 1010000)
  assert.equal(result.outliers[0].direction, 'HIGH')
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

test('FAILED譜面も分布と外れ値の計算に含めること', () => {
  // Given
  const records = [
    createRecord(800000, 14.0, true, 'FAILED'),
    createRecord(1000000, 14.0),
    createRecord(1005000, 14.0),
  ]

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.distributions[0].count, 3)
  assert.equal(result.distributions[0].lowerWhisker, 800000)
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

test('譜面定数の集計キーは小数点以下1桁で切り捨てること', () => {
  // Given
  const records = [createRecord(1000000, 13.79), createRecord(1005000, 13.7)]

  // When
  const result = inspectWeakCharts(records)

  // Then
  assert.equal(result.distributions.length, 1)
  assert.equal(result.distributions[0].chartConst, 13.7)
  assert.equal(result.distributions[0].count, 2)
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
