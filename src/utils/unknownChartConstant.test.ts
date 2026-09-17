import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hasUnknownChartConstants,
  hasUnknownOverPowerChartConstants,
  hasUnknownOverPowerPercentChartConstants,
} from './unknownChartConstant'

test('定数未判明の譜面が1件でもあればtrueを返すこと', () => {
  // Given
  const records = [{ is_const_unknown: false }, { is_const_unknown: true }]

  // When
  const result = hasUnknownChartConstants(records)

  // Then
  assert.equal(result, true)
})

test('すべて判明済みならfalseを返すこと', () => {
  // Given
  const records = [{ is_const_unknown: false }, { is_const_unknown: false }]

  // When
  const result = hasUnknownChartConstants(records)

  // Then
  assert.equal(result, false)
})

test('対象が空ならfalseを返すこと', () => {
  // Given
  const records: { is_const_unknown: boolean }[] = []

  // When
  const result = hasUnknownChartConstants(records)

  // Then
  assert.equal(result, false)
})

test('現在OP対象に定数未判明があればtrueを返すこと', () => {
  // Given
  const records = [
    { is_op_target: false, is_const_unknown: true },
    { is_op_target: true, is_const_unknown: true },
  ]

  // When
  const result = hasUnknownOverPowerChartConstants(records)

  // Then
  assert.equal(result, true)
})

test('現在OP対象がすべて判明済みならfalseを返すこと', () => {
  // Given
  const records = [
    { is_op_target: false, is_const_unknown: true },
    { is_op_target: true, is_const_unknown: false },
  ]

  // When
  const result = hasUnknownOverPowerChartConstants(records)

  // Then
  assert.equal(result, false)
})

test('現在OP対象がなければfalseを返すこと', () => {
  // Given
  const records = [{ is_op_target: false, is_const_unknown: true }]

  // When
  const result = hasUnknownOverPowerChartConstants(records)

  // Then
  assert.equal(result, false)
})

test('未プレイの定数未判明譜面があればOP%判定はtrueを返すこと', () => {
  // Given
  const records = [
    { is_op_target: false, is_played: false, is_const_unknown: true },
    { is_op_target: true, is_played: true, is_const_unknown: false },
  ]

  // When
  const result = hasUnknownOverPowerPercentChartConstants(records)

  // Then
  assert.equal(result, true)
})

test('現在OP対象の定数未判明があればOP%判定はtrueを返すこと', () => {
  // Given
  const records = [{ is_op_target: true, is_played: true, is_const_unknown: true }]

  // When
  const result = hasUnknownOverPowerPercentChartConstants(records)

  // Then
  assert.equal(result, true)
})

test('プレイ済みの非OP対象だけが定数未判明ならOP%判定はfalseを返すこと', () => {
  // Given
  const records = [
    { is_op_target: false, is_played: true, is_const_unknown: true },
    { is_op_target: true, is_played: true, is_const_unknown: false },
  ]

  // When
  const result = hasUnknownOverPowerPercentChartConstants(records)

  // Then
  assert.equal(result, false)
})
