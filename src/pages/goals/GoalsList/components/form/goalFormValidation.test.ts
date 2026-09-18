import assert from 'node:assert/strict'
import test from 'node:test'
import { validateGoalForm } from './goalFormValidation'

const validInput = {
  title: 'SSS達成',
  achievementType: 'score_count',
  score: '1007500',
  rank: 'S',
  count: '10',
  countMode: 'number',
  total: '10',
  totalMode: 'number',
  constMin: '13',
  constMax: '15',
  allCount: 20,
  theoreticalTotal: 20,
} as const

test('タイトルが空の場合は保存前検証でエラーになる', () => {
  // Given / When
  const result = validateGoalForm({ ...validInput, title: '   ' })

  // Then
  assert.equal(result, 'タイトルを入力してください。')
})

test('件数目標が対象譜面数を超える場合は保存前検証でエラーになる', () => {
  // Given / When
  const result = validateGoalForm({ ...validInput, count: '21' })

  // Then
  assert.equal(result, '件数は20件以内で入力してください。')
})

test('対象譜面が0件の場合は割合指定の件数目標でも保存前検証でエラーになる', () => {
  // Given / When
  const result = validateGoalForm({
    ...validInput,
    countMode: 'percent',
    count: '50',
    allCount: 0,
  })

  // Then
  assert.equal(result, '条件に当てはまる譜面がありません。条件を見直してください。')
})

test('対象譜面が0件の場合はOVER POWER達成率目標でも保存前検証でエラーになる', () => {
  // Given / When
  const result = validateGoalForm({
    ...validInput,
    achievementType: 'overpower_percent',
    total: '90',
    allCount: 0,
  })

  // Then
  assert.equal(result, '条件に当てはまる譜面がありません。条件を見直してください。')
})

test('OVER POWER目標の小数桁数が多すぎる場合は保存前検証でエラーになる', () => {
  // Given / When
  const result = validateGoalForm({
    ...validInput,
    achievementType: 'overpower_value',
    total: '12.3456',
    totalMode: 'number',
    theoreticalTotal: 100,
  })

  // Then
  assert.equal(result, 'OVER POWERの目標値・残数・割合は小数第3位以内で入力してください。')
})

test('正しい入力の場合は保存前検証を通過する', () => {
  // Given / When
  const result = validateGoalForm(validInput)

  // Then
  assert.equal(result, undefined)
})

test('単曲レートは0.01以上かつ小数第2位以内を要求する', () => {
  // Given
  const baseInput = {
    title: '単曲レート目標',
    achievementType: 'rating_count' as const,
    score: '0',
    rank: 'S' as const,
    count: '1',
    countMode: 'all' as const,
    total: '0',
    totalMode: 'number' as const,
    constMin: '1',
    constMax: '16',
    allCount: 1,
    theoreticalTotal: 0,
  }

  // When / Then
  assert.match(validateGoalForm({ ...baseInput, rating: '' }) ?? '', /単曲レート/)
  assert.match(validateGoalForm({ ...baseInput, rating: '0' }) ?? '', /0\.01以上/)
  assert.match(validateGoalForm({ ...baseInput, rating: '18.001' }) ?? '', /小数第2位以内/)
  assert.equal(validateGoalForm({ ...baseInput, rating: '18.00' }), undefined)
})

test('単曲レート入力の不正は到達可能譜面0件より先に報告する', () => {
  // Given / When
  const result = validateGoalForm({
    title: '単曲レート目標',
    achievementType: 'rating_count',
    score: '0',
    rating: '',
    rank: 'S',
    count: '1',
    countMode: 'all',
    total: '0',
    totalMode: 'number',
    constMin: '1',
    constMax: '16',
    allCount: 0,
    theoreticalTotal: 0,
  })

  // Then
  assert.match(result ?? '', /単曲レート/)
})
