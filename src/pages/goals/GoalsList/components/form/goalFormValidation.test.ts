import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isWithinDecimalPlaces,
  validateGoalForm,
  validateGoalGaugeStart,
} from './goalFormValidation'

const validInput = {
  title: 'SSS達成',
  achievementType: 'score_count',
  score: '1007500',
  rank: 'S',
  count: '10',
  countMode: 'number',
  total: '10',
  totalMode: 'number',
  constRange: { min: 13, max: 15 },
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

test('OVER POWER達成率は小数第3位までを許可し、第4位以下は保存前検証でエラーになる', () => {
  // Given
  const baseInput = {
    ...validInput,
    achievementType: 'overpower_percent' as const,
    totalMode: 'number' as const,
    allCount: 20,
    theoreticalTotal: 100,
  }
  const decimalError = 'OVER POWER達成率は小数第3位以内で入力してください。'

  // When / Then: 小数第3位ちょうど、およびそれ未満は通過する
  assert.equal(validateGoalForm({ ...baseInput, total: '0' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, total: '0.001' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, total: '99.1' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, total: '99.123' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, total: '99.1230' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, total: '99.999' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, total: '100' }), undefined)

  // When / Then: 小数第4位以下は達成率の桁数エラーになる
  assert.equal(validateGoalForm({ ...baseInput, total: '0.0001' }), decimalError)
  assert.equal(validateGoalForm({ ...baseInput, total: '99.1234' }), decimalError)
  assert.equal(validateGoalForm({ ...baseInput, total: '99.1235' }), decimalError)
  assert.equal(validateGoalForm({ ...baseInput, total: '99.9999' }), decimalError)
})

test('OVER POWER達成率が100を超える場合は小数桁より先に上限エラーになる', () => {
  // Given / When
  const overMax = validateGoalForm({
    ...validInput,
    achievementType: 'overpower_percent',
    total: '100.001',
    totalMode: 'number',
    allCount: 20,
    theoreticalTotal: 100,
  })
  const overMaxWithExtraDecimals = validateGoalForm({
    ...validInput,
    achievementType: 'overpower_percent',
    total: '100.0001',
    totalMode: 'number',
    allCount: 20,
    theoreticalTotal: 100,
  })

  // Then
  assert.equal(overMax, 'OVER POWER達成率は100%以下で入力してください。')
  assert.equal(overMaxWithExtraDecimals, 'OVER POWER達成率は100%以下で入力してください。')
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
    constRange: { min: 1, max: 16 },
    allCount: 1,
    theoreticalTotal: 0,
  }

  // When / Then
  assert.match(validateGoalForm({ ...baseInput, rating: '' }) ?? '', /単曲レート/)
  assert.match(validateGoalForm({ ...baseInput, rating: '0' }) ?? '', /0\.01以上/)
  assert.match(validateGoalForm({ ...baseInput, rating: '18.001' }) ?? '', /小数第2位以内/)
  assert.equal(validateGoalForm({ ...baseInput, rating: '18.00' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, rating: '17.1' }), undefined)
  assert.equal(validateGoalForm({ ...baseInput, rating: '17.15' }), undefined)
})

test('小数桁数判定は17.1のような2進表現誤差を許容する', () => {
  // Given / When / Then
  assert.equal(isWithinDecimalPlaces(17.1, 2), true)
  assert.equal(isWithinDecimalPlaces(17.15, 2), true)
  assert.equal(isWithinDecimalPlaces(16.1, 2), true)
  assert.equal(isWithinDecimalPlaces(18.001, 2), false)
  assert.equal(isWithinDecimalPlaces(12.345, 3), true)
  assert.equal(isWithinDecimalPlaces(12.3456, 3), false)
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
    constRange: { min: 1, max: 16 },
    allCount: 0,
    theoreticalTotal: 0,
  })

  // Then
  assert.match(result ?? '', /単曲レート/)
})

const gaugeStartInput = {
  achievementType: 'score_count',
  gaugeStartMode: 'custom',
  gaugeStart: '50',
  current: 40,
  target: 100,
} as const

test('「最初から」は目標値に関係なくゲージのスタート位置の検証を通過する', () => {
  // Given / When
  const result = validateGoalGaugeStart({ ...gaugeStartInput, gaugeStartMode: 'zero', target: 0 })

  // Then
  assert.equal(result, undefined)
})

test('「現在値から」は現在値が目標値に達している場合にエラーになる', () => {
  // Given / When
  const reached = validateGoalGaugeStart({
    ...gaugeStartInput,
    gaugeStartMode: 'current',
    current: 100,
  })
  const below = validateGoalGaugeStart({ ...gaugeStartInput, gaugeStartMode: 'current' })

  // Then
  assert.equal(reached, '現在値が目標値に達しているため、現在値からは始められません。')
  assert.equal(below, undefined)
})

test('「任意の数値から」で空欄や数値でない入力はエラーになる', () => {
  // Given / When
  const empty = validateGoalGaugeStart({ ...gaugeStartInput, gaugeStart: '' })
  const invalid = validateGoalGaugeStart({
    ...gaugeStartInput,
    achievementType: 'overpower_value',
    gaugeStart: '1..2',
  })

  // Then
  assert.equal(empty, 'ゲージのスタート位置は0以上の整数で入力してください。')
  assert.equal(invalid, 'ゲージのスタート位置は0以上、小数第3位以内で入力してください。')
})

test('件数系の「任意の数値から」は整数だけを許可する', () => {
  // Given / When
  const result = validateGoalGaugeStart({ ...gaugeStartInput, gaugeStart: '10.5' })

  // Then
  assert.equal(result, 'ゲージのスタート位置は0以上の整数で入力してください。')
})

test('OVER POWER系の「任意の数値から」は小数第3位まで許可する', () => {
  // Given
  const overPowerInput = {
    ...gaugeStartInput,
    achievementType: 'overpower_percent',
    target: 99.8,
  } as const

  // When
  const valid = validateGoalGaugeStart({ ...overPowerInput, gaugeStart: '99.612' })
  const invalid = validateGoalGaugeStart({ ...overPowerInput, gaugeStart: '99.6123' })

  // Then
  assert.equal(valid, undefined)
  assert.equal(invalid, 'ゲージのスタート位置は0以上、小数第3位以内で入力してください。')
})

test('「任意の数値から」が目標値以上の場合はエラーになる', () => {
  // Given
  const averageInput = {
    ...gaugeStartInput,
    achievementType: 'avg_score',
    target: 1008000,
  } as const

  // When
  const equal = validateGoalGaugeStart({ ...averageInput, gaugeStart: '1008000' })
  const below = validateGoalGaugeStart({ ...averageInput, gaugeStart: '1007999' })

  // Then
  assert.equal(equal, 'ゲージのスタート位置は目標値より小さくしてください。')
  assert.equal(below, undefined)
})

test('「任意の数値から」で0を入力した場合は目標値に関係なく許可する', () => {
  // Given / When
  const result = validateGoalGaugeStart({ ...gaugeStartInput, gaugeStart: '0', target: 0 })

  // Then
  assert.equal(result, undefined)
})

test('「現在値から」は現在値と目標値がともに0なら許可する', () => {
  // Given / When
  const result = validateGoalGaugeStart({
    ...gaugeStartInput,
    gaugeStartMode: 'current',
    current: 0,
    target: 0,
  })

  // Then
  assert.equal(result, undefined)
})

test('「現在値から」は切り捨て後の現在値が目標値に届くかで判定する', () => {
  // Given
  const overPowerInput = {
    ...gaugeStartInput,
    achievementType: 'overpower_percent',
    gaugeStartMode: 'current',
    target: 99.8,
  } as const

  // When
  const reached = validateGoalGaugeStart({ ...overPowerInput, current: 99.8004 })
  const below = validateGoalGaugeStart({ ...overPowerInput, current: 99.7999 })

  // Then
  assert.equal(reached, '現在値が目標値に達しているため、現在値からは始められません。')
  assert.equal(below, undefined)
})
