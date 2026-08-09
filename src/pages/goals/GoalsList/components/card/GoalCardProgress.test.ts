import assert from 'node:assert/strict'
import test from 'node:test'
import { formatGoalCardValue, resolveGoalCardDisplayProgress } from './goalCardProgressModel'

test('折りたたみ表示の達成率は反転設定に応じた接頭辞を含む', () => {
  // Given
  const progress = {
    current: 30,
    target: 100,
    percent: 30,
    achieved: false,
    hasUnknownMaxOp: false,
  }

  // When
  const normalProgress = resolveGoalCardDisplayProgress(progress, 'score_count', false, false)
  const invertedProgress = resolveGoalCardDisplayProgress(progress, 'score_count', false, true)

  // Then
  assert.deepEqual([normalProgress.percentPrefixText, normalProgress.percentText], ['', '30.00%'])
  assert.deepEqual(
    [invertedProgress.percentPrefixText, invertedProgress.percentText],
    ['あと', '70.00%']
  )
})

test('OVER POWER値は小数点以下3桁で表示される', () => {
  // Given / When
  const result = formatGoalCardValue(1234.5, 'overpower_value')

  // Then
  assert.equal(result, '1,234.500')
})

test('OVER POWER値は小数点以下3桁で切り捨て表示される', () => {
  // Given
  const roundedUpByToLocaleString = 1234.5679

  // When
  const result = formatGoalCardValue(roundedUpByToLocaleString, 'overpower_value')

  // Then
  assert.equal(result, '1,234.567')
})

test('OVER POWER達成率は小数点以下3桁で切り捨て表示される', () => {
  // Given
  const roundedUpByToLocaleString = 97.5369

  // When
  const result = formatGoalCardValue(roundedUpByToLocaleString, 'overpower_percent')

  // Then
  assert.equal(result, '97.536')
})

test('実数値と割合の反転表示を独立して適用し、ゲージ値は通常進捗を使う', () => {
  // Given
  const progress = {
    current: 30,
    target: 100,
    percent: 30,
    achieved: false,
    hasUnknownMaxOp: false,
  }

  // When
  const valueOnly = resolveGoalCardDisplayProgress(progress, 'score_count', true, false)
  const percentageOnly = resolveGoalCardDisplayProgress(progress, 'score_count', false, true)

  // Then
  assert.deepEqual(valueOnly, {
    currentText: '70',
    targetText: '100',
    percentPrefixText: '',
    percentText: '30.00%',
    ariaValueText: '達成率 30.00%',
    progressValue: 30,
  })
  assert.deepEqual(percentageOnly, {
    currentText: '30',
    targetText: '100',
    percentPrefixText: 'あと',
    percentText: '70.00%',
    ariaValueText: '達成率 30.00%、あと70.00%',
    progressValue: 30,
  })
})
