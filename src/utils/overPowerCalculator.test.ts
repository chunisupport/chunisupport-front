import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateOverPowerDifference,
  calculateOverPowerForScore,
  calculateOverPowerPercent,
  calculatePlayedAverageScore,
  calculateRequiredOverPower,
  calculateUnplayedOverPower,
  formatOverPowerInputValue,
  parseOverPowerInput,
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

test('formatOverPowerInputValue は不要な末尾0を省くこと', () => {
  // Given
  const value = 123.4

  // When
  const result = formatOverPowerInputValue(value)

  // Then
  assert.equal(result, '123.4')
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

test('calculatePlayedAverageScore は既プレイ譜面だけで平均スコアを計算すること', () => {
  // Given
  const records = [
    { is_played: true, score: 1000000 },
    { is_played: true, score: 1010000 },
    { is_played: false, score: 0 },
  ]

  // When
  const result = calculatePlayedAverageScore(records)

  // Then
  assert.equal(result, 1005000)
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
    mode: 'playedAverage',
    manualScore: 1007500,
  })

  // Then
  assert.equal(result.current, 160)
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
    mode: 'manual',
    manualScore: 1010000,
  })

  // Then
  assert.equal(result.current, 163.75)
  assert.equal(result.max, 175)
})
