import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateGoalGaugePercent, resolveGoalGaugeStart } from './goalGauge'

test('スタート位置が0なら従来どおり現在値÷目標値の達成率になること', () => {
  // Given
  const current = 30
  const target = 100

  // When
  const result = calculateGoalGaugePercent(current, target, 0)

  // Then
  assert.equal(result, 30)
})

test('スタート位置から目標値までを100%として達成率を計算すること', () => {
  // Given: OVER POWER達成率 99.6% から 99.8% を目指している
  const current = 99.7
  const target = 99.8
  const gaugeStart = 99.6

  // When
  const result = calculateGoalGaugePercent(current, target, gaugeStart)

  // Then: 近い値どうしの差で生じる浮動小数点誤差を残さない
  assert.equal(result, 50)
})

test('現在値がスタート位置を下回った場合は0%になること', () => {
  // Given: 新曲追加でOVER POWER達成率がスタート位置より下がった
  const current = 99.5
  const target = 99.8
  const gaugeStart = 99.6

  // When
  const result = calculateGoalGaugePercent(current, target, gaugeStart)

  // Then
  assert.equal(result, 0)
})

test('スタート位置が目標値以上の場合は無視して0から計算すること', () => {
  // Given: 譜面削除で動的な目標値がスタート位置を下回った
  const current = 40
  const target = 80
  const gaugeStart = 90

  // When
  const effectiveStart = resolveGoalGaugeStart(gaugeStart, target)
  const result = calculateGoalGaugePercent(current, target, gaugeStart)

  // Then
  assert.equal(effectiveStart, 0)
  assert.equal(result, 50)
})

test('目標値を超えた場合は100%を超えた達成率を返すこと', () => {
  // Given
  const current = 120
  const target = 100
  const gaugeStart = 50

  // When
  const result = calculateGoalGaugePercent(current, target, gaugeStart)

  // Then
  assert.equal(result, 140)
})

test('目標値が0以下の場合も数値として扱える達成率を返すこと', () => {
  // Given
  const current = 0
  const target = 0

  // When
  const result = calculateGoalGaugePercent(current, target, 10)

  // Then
  assert.equal(result, 0)
})

test('スタート位置が目標値と等しい場合は無視して0から計算すること', () => {
  // Given
  const current = 50
  const target = 100

  // When
  const effectiveStart = resolveGoalGaugeStart(100, target)
  const result = calculateGoalGaugePercent(current, target, 100)

  // Then
  assert.equal(effectiveStart, 0)
  assert.equal(result, 50)
})
