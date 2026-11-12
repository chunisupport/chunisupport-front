import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatGoalValue,
  getGoalValueUnit,
  splitGoalNumberText,
  splitGoalValueDisplay,
} from './goalValueFormat'

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

test('小数を含む目標値は小数点以降を小数部に分け、連結すると元に戻る', () => {
  // Given
  const overPower = formatGoalValue(1234.5679, 'overpower_value')
  const overPowerPercent = splitGoalValueDisplay(
    formatGoalValue(97.5369, 'overpower_percent'),
    '%'
  ).numberText

  // When
  const overPowerParts = splitGoalNumberText(overPower)
  const percentParts = splitGoalNumberText(overPowerPercent)

  // Then
  assert.deepEqual(overPowerParts, { integerText: '1,234', fractionText: '.567' })
  assert.equal(`${overPowerParts.integerText}${overPowerParts.fractionText}`, overPower)
  assert.deepEqual(percentParts, { integerText: '97', fractionText: '.536' })
  assert.equal(`${percentParts.integerText}${percentParts.fractionText}`, overPowerPercent)
})

test('小数のない目標値は整数部だけを返す', () => {
  // Given
  const text = formatGoalValue(1234.9, 'score_count')

  // When
  const parts = splitGoalNumberText(text)

  // Then
  assert.deepEqual(parts, { integerText: '1,234', fractionText: '' })
})
