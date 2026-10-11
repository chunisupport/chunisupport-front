import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateOverPowerDifference,
  calculateOverPowerForScore,
  calculateOverPowerPercent,
  calculatePlayedAverageScore,
  calculatePlayedAverageScoreByConst,
  calculatePlayedAverageScoreRegression,
  calculateRequiredChartCount,
  calculateRequiredOverPower,
  calculateUnplayedOverPower,
  formatOverPowerInputValue,
  normalizeOverPowerCalculatorInput,
  parseOverPowerInput,
  predictPlayedAverageScoreByConstRegression,
} from './overPowerCalculator'

test('calculateOverPowerPercent は現在値と理論値から達成率を計算すること', () => {
  // Given
  const current = 975
  const max = 1000

  // When
  const result = calculateOverPowerPercent(current, max)

  // Then
  assert.equal(result, 97.5)
})

test('calculateRequiredOverPower は目標%から必要OVER POWER値を計算すること', () => {
  // Given
  const percent = 99.5
  const max = 1200

  // When
  const result = calculateRequiredOverPower(percent, max)

  // Then
  assert.equal(result, 1194)
})

test('calculateOverPowerDifference は必要値と現在値の差分を計算すること', () => {
  // Given
  const required = 1194
  const current = 1180.25

  // When
  const result = calculateOverPowerDifference(required, current)

  // Then
  assert.equal(result, 13.75)
})

test('parseOverPowerInput は空欄と不正な数値をnullへ変換すること', () => {
  // Given
  const emptyValue = ''
  const invalidValue = 'abc'

  // When & Then
  assert.equal(parseOverPowerInput(emptyValue), null)
  assert.equal(parseOverPowerInput(invalidValue), null)
})

test('formatOverPowerInputValue は小数点以下3桁を常時表示すること', () => {
  // Given
  const value = 123.4

  // When
  const result = formatOverPowerInputValue(value)

  // Then
  assert.equal(result, '123.400')
})

test('calculateOverPowerForScore はスコアと譜面定数からコンボ補正なしのOVER POWERを計算すること', () => {
  // Given
  const score = 1007500
  const chartConst = 14

  // When
  const result = calculateOverPowerForScore(score, chartConst)

  // Then
  assert.equal(result, 80)
})

test('calculatePlayedAverageScore は現在OP対象の既プレイ譜面だけで平均スコアを計算すること', () => {
  // Given
  const records = [
    { id: 'song-1', is_op_target: true, is_played: true, score: 1000000, overpower: 75 },
    { id: 'song-1', is_op_target: false, is_played: true, score: 1010000, overpower: 80 },
    { id: 'song-2', is_op_target: false, is_played: true, score: 1005000, overpower: 85 },
    { id: 'song-2', is_op_target: false, is_played: true, score: 1007500, overpower: 90 },
    { id: 'song-3', is_op_target: true, is_played: false, score: 0, overpower: 0 },
  ]

  // When
  const result = calculatePlayedAverageScore(records)

  // Then
  assert.equal(result, 1003750)
})

test('calculatePlayedAverageScoreByConst は現在OP対象の既プレイ譜面を譜面定数ごとに平均すること', () => {
  // Given
  const records = [
    {
      id: 'song-1',
      const: 14,
      is_op_target: true,
      is_played: true,
      score: 1000000,
      overpower: 75,
    },
    {
      id: 'song-1',
      const: 14.5,
      is_op_target: false,
      is_played: true,
      score: 1010000,
      overpower: 80,
    },
    {
      id: 'song-2',
      const: 14,
      is_op_target: false,
      is_played: true,
      score: 1005000,
      overpower: 85,
    },
    {
      id: 'song-2',
      const: 14,
      is_op_target: false,
      is_played: true,
      score: 1007000,
      overpower: 90,
    },
    {
      id: 'song-3',
      const: 15,
      is_op_target: true,
      is_played: false,
      score: 0,
      overpower: 0,
    },
  ]

  // When
  const result = calculatePlayedAverageScoreByConst(records)

  // Then
  assert.equal(result.get(14), 1003500)
  assert.equal(result.has(14.5), false)
  assert.equal(result.has(15), false)
})

test('calculatePlayedAverageScoreRegression は譜面定数ごとの平均スコアから線形回帰モデルを作ること', () => {
  // Given
  const averageScoreByConst = new Map([
    [13, 1009000],
    [14, 1007000],
    [15, 1005000],
  ])

  // When
  const regression = calculatePlayedAverageScoreRegression(averageScoreByConst)
  const predicted = predictPlayedAverageScoreByConstRegression(regression, 14.5)

  // Then
  assert.deepEqual(regression, { slope: -2000, intercept: 1035000 })
  assert.equal(predicted, 1006000)
})

test('calculatePlayedAverageScoreRegression は1定数だけの場合に水平線モデルを作ること', () => {
  // Given
  const averageScoreByConst = new Map([[14, 1007000]])

  // When
  const regression = calculatePlayedAverageScoreRegression(averageScoreByConst)
  const predicted = predictPlayedAverageScoreByConstRegression(regression, 15)

  // Then
  assert.deepEqual(regression, { slope: 0, intercept: 1007000 })
  assert.equal(predicted, 1007000)
})

test('calculateUnplayedOverPower は何もしない場合に未プレイ曲を0点のまま扱うこと', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: 1007500,
    playedAverageScoreByConst: new Map(),
    playedAverageScoreRegression: null,
    mode: 'none',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 80)
  assert.equal(result.max, 175)
})

test('calculateUnplayedOverPower は存在を消す場合に未プレイ曲を総和から除外すること', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: 1007500,
    playedAverageScoreByConst: new Map(),
    playedAverageScoreRegression: null,
    mode: 'remove',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 80)
  assert.equal(result.max, 90)
})

test('calculateUnplayedOverPower は理論値で埋める場合に未プレイ曲を満点として扱うこと', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: 1007500,
    playedAverageScoreByConst: new Map(),
    playedAverageScoreRegression: null,
    mode: 'theoretical',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 165)
  assert.equal(result.max, 175)
})

test('calculateUnplayedOverPower は平均スコアで未プレイ曲を埋めること', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: 1007500,
    playedAverageScoreByConst: new Map(),
    playedAverageScoreRegression: null,
    mode: 'playedAverage',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 160)
  assert.equal(result.max, 175)
})

test('calculateUnplayedOverPower は譜面定数ごとの平均スコアで未プレイ曲を埋めること', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: null,
    playedAverageScoreByConst: new Map([[14, 1007500]]),
    playedAverageScoreRegression: null,
    mode: 'targetConstAverage',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 160)
  assert.equal(result.max, 175)
})

test('calculateUnplayedOverPower は対応する譜面定数の既プレイがない場合に0点で埋めること', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: null,
    playedAverageScoreByConst: new Map([[15, 1007500]]),
    playedAverageScoreRegression: null,
    mode: 'targetConstAverage',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 80)
  assert.equal(result.max, 175)
})

test('calculateUnplayedOverPower は譜面定数ごとの線形回帰予測スコアで未プレイ曲を埋めること', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 87.5, targetConst: 14.5, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: null,
    playedAverageScoreByConst: new Map(),
    playedAverageScoreRegression: { slope: -2000, intercept: 1035000 },
    mode: 'targetConstRegressionAverage',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 161)
  assert.equal(result.max, 177.5)
})

test('calculateUnplayedOverPower は線形回帰モデルがない場合に0点で埋めること', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: null,
    playedAverageScoreByConst: new Map(),
    playedAverageScoreRegression: null,
    mode: 'targetConstRegressionAverage',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 80)
  assert.equal(result.max, 175)
})

test('calculateUnplayedOverPower は手動指定スコアで未プレイ曲を埋めること', () => {
  // Given
  const entries = [
    { current: 80, max: 90, targetConst: 15, isUnplayed: false },
    { current: 0, max: 85, targetConst: 14, isUnplayed: true },
  ]

  // When
  const result = calculateUnplayedOverPower({
    entries,
    playedAverageScore: null,
    playedAverageScoreByConst: new Map(),
    playedAverageScoreRegression: null,
    mode: 'manual',
    manualScore: 1010000,
  })

  // Then
  assert.equal(result.current, 163.75)
  assert.equal(result.max, 175)
})

test('入力の小数桁数を固定し、目標達成率を0〜100へ制限する', () => {
  // Given
  const decimalPlaces = 5
  // When & Then
  assert.equal(normalizeOverPowerCalculatorInput('97.5', decimalPlaces, 0, 100), '97.50000')
  assert.equal(normalizeOverPowerCalculatorInput('-1', decimalPlaces, 0, 100), '0.00000')
  assert.equal(normalizeOverPowerCalculatorInput('101', decimalPlaces, 0, 100), '100.00000')
  assert.equal(normalizeOverPowerCalculatorInput('', 3), '0.000')
  assert.equal(normalizeOverPowerCalculatorInput('123,4567', 3), '123.457')
})

test('目標達成に必要な譜面数はランク境界点の単曲OPで切り上げる', () => {
  // Given: 定数14のSSは75 OP、FCは75.5、AJは76
  const difference = 151
  // When & Then
  assert.equal(calculateRequiredChartCount(difference, 1000000, 14, null), 3)
  assert.equal(calculateRequiredChartCount(difference, 1000000, 14, 'FULL COMBO'), 2)
  assert.equal(calculateRequiredChartCount(difference, 1000000, 14, 'ALL JUSTICE'), 2)
})

test('理論値は通常のみ必要数を表示し、FC・AJ列は非表示となる', () => {
  // Given
  const difference = 170
  // When & Then
  assert.equal(calculateRequiredChartCount(difference, 1009000, 14, 'ALL JUSTICE CRITICAL'), null)
  assert.equal(calculateRequiredChartCount(difference, 1010000, 14, null), 2)
  for (const lamp of ['FULL COMBO', 'ALL JUSTICE']) {
    assert.equal(calculateRequiredChartCount(difference, 1010000, 14, lamp), null)
  }
})

test('目標達成済みは0譜面で、小数誤差で達成数が余分に増えない', () => {
  // Given
  const difference = 75 + 0.1 + 0.2 - 0.3
  // When & Then
  assert.equal(calculateRequiredChartCount(0, 1000000, 14, null), 0)
  assert.equal(calculateRequiredChartCount(-10, 1000000, 14, null), 0)
  assert.equal(calculateRequiredChartCount(difference, 1000000, 14, null), 1)
})

test('現在から目標へのOP増加量で必要譜面数を計算する', () => {
  // Given: 定数14、SSからSSSへの増加量は通常5、FC5.5、AJ6
  const difference = 11
  // When & Then
  assert.equal(calculateRequiredChartCount(difference, 1007500, 14, null, 1000000), 3)
  assert.equal(calculateRequiredChartCount(difference, 1007500, 14, 'FULL COMBO', 1000000), 2)
  assert.equal(calculateRequiredChartCount(difference, 1007500, 14, 'ALL JUSTICE', 1000000), 2)
})

test('スコアを伸ばしてもOPが増えない場合は必要譜面数を算出しない', () => {
  // Given & When & Then
  assert.equal(calculateRequiredChartCount(10, 1000000, 14, null, 1000000), null)
  assert.equal(calculateRequiredChartCount(10, 1000000, 14, null, 1007500), null)
  assert.equal(calculateRequiredChartCount(0, 1000000, 14, null, 1000000), 0)
})
