import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalAchievementType } from '../../../types/api'
import { formatGoalValue, getGoalValueUnit, splitGoalValueDisplay } from './goalValueFormat'

const GOAL_ACHIEVEMENT_TYPES = [
  'rank_count',
  'score_count',
  'rating_count',
  'avg_score',
  'hardlamp_count',
  'combolamp_count',
  'fullchain_count',
  'rainbow_count',
  'total_score',
  'overpower_value',
  'overpower_percent',
] as const satisfies readonly GoalAchievementType[]

test('目標値の表示単位はOVER POWER達成率だけ%を返す', () => {
  // Given / When / Then
  for (const type of GOAL_ACHIEVEMENT_TYPES) {
    assert.equal(getGoalValueUnit(type), type === 'overpower_percent' ? '%' : '', type)
  }
})

test('OVER POWER達成率は小数点以下3桁のまま末尾に%を付ける', () => {
  // Given
  const roundedUpByToLocaleString = 97.5369

  // When
  const result = formatGoalValue(roundedUpByToLocaleString, 'overpower_percent')

  // Then
  assert.equal(result, '97.536%')
})

test('OVER POWER値は小数点以下3桁で切り捨て、単位は付けない', () => {
  // Given
  const roundedUpByToLocaleString = 1234.5679

  // When
  const result = formatGoalValue(roundedUpByToLocaleString, 'overpower_value')

  // Then
  assert.equal(result, '1,234.567')
})

test('件数系の目標値は整数のまま単位を付けない', () => {
  // Given
  const value = 1234.9

  // When
  const result = formatGoalValue(value, 'score_count')

  // Then
  assert.equal(result, '1,234')
})

test('OVER POWER達成率の表示文字列は数値と%に分けられ、連結すると元に戻る', () => {
  // Given
  const text = formatGoalValue(97.5369, 'overpower_percent')

  // When
  const parts = splitGoalValueDisplay(text, getGoalValueUnit('overpower_percent'))

  // Then
  assert.deepEqual(parts, { numberText: '97.536', unitText: '%' })
  assert.equal(`${parts.numberText}${parts.unitText}`, text)
})

test('単位のない目標値は分けずにそのまま返す', () => {
  // Given
  const text = formatGoalValue(1234.5679, 'overpower_value')

  // When
  const parts = splitGoalValueDisplay(text, getGoalValueUnit('overpower_value'))

  // Then
  assert.deepEqual(parts, { numberText: '1,234.567', unitText: '' })
})
