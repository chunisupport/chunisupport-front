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

test('理論値OP対象譜面が定数未判明ならOP%判定はtrueを返すこと', () => {
  // Given
  const records = [
    { id: 'song-a', difficulty: 'ULTIMA' as const, is_const_unknown: true },
    { id: 'song-a', difficulty: 'MASTER' as const, is_const_unknown: false },
  ]
  const targetDifficultyBySongId = new Map([['song-a', 'ULTIMA' as const]])

  // When
  const result = hasUnknownOverPowerPercentChartConstants(records, targetDifficultyBySongId)

  // Then
  assert.equal(result, true)
})

test('理論値OP対象以外のMASTERが定数未判明ならOP%判定はfalseを返すこと', () => {
  // Given
  const records = [
    { id: 'song-a', difficulty: 'MASTER' as const, is_const_unknown: true },
    { id: 'song-a', difficulty: 'ULTIMA' as const, is_const_unknown: false },
  ]
  const targetDifficultyBySongId = new Map([['song-a', 'ULTIMA' as const]])

  // When
  const result = hasUnknownOverPowerPercentChartConstants(records, targetDifficultyBySongId)

  // Then
  assert.equal(result, false)
})

test('理論値OP対象以外のEXPERTが定数未判明ならOP%判定はfalseを返すこと', () => {
  // Given
  const records = [
    { id: 'song-a', difficulty: 'EXPERT' as const, is_const_unknown: true },
    { id: 'song-a', difficulty: 'MASTER' as const, is_const_unknown: false },
  ]
  const targetDifficultyBySongId = new Map([['song-a', 'MASTER' as const]])

  // When
  const result = hasUnknownOverPowerPercentChartConstants(records, targetDifficultyBySongId)

  // Then
  assert.equal(result, false)
})

test('理論値OP対象を解決できない場合はOP%判定はfalseを返すこと', () => {
  // Given
  const records = [{ id: 'song-a', difficulty: 'MASTER' as const, is_const_unknown: true }]

  // When
  const result = hasUnknownOverPowerPercentChartConstants(records, new Map())

  // Then
  assert.equal(result, false)
})
