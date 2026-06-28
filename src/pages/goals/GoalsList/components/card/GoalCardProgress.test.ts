import assert from 'node:assert/strict'
import test from 'node:test'
import { formatGoalCardValue, resolveGoalCardDisplayProgress } from './goalCardProgressModel'

test('OVER POWER値は小数点以下3桁で表示される', () => {
  // Given / When
  const result = formatGoalCardValue(1234.5, 'overpower_value')

  // Then
  assert.equal(result, '1,234.500')
})

test('反転表示では残り値と残り割合を表示し、ゲージ値は通常進捗を使う', () => {
  // Given
  const progress = {
    current: 30,
    target: 100,
    percent: 30,
    achieved: false,
    hasUnknownMaxOp: false,
  }

  // When
  const result = resolveGoalCardDisplayProgress(progress, 'score_count', true)

  // Then
  assert.deepEqual(result, {
    currentText: '70',
    targetText: '100',
    percentText: '70.00%',
    progressValue: 30,
  })
})
