import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isWithinDecimalPlaces,
  resolveGoalGaugeStartGroupErrorMessage,
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

test('スコア目標は下限・上限の直外を拒否し境界値は許可する', () => {
  // Given: スコア件数と平均スコアの入力。
  for (const achievementType of ['score_count', 'avg_score'] as const) {
    for (const score of ['-1', '0', '1010000', '1010001']) {
      // When
      const result = validateGoalForm({ ...validInput, achievementType, score })

      // Then: 上限+1も拒否し、0と理論値は許可する。
      assert.equal(
        result,
        score === '-1' || score === '1010001'
          ? 'スコアは 0 ～ 1,010,000 の範囲で入力してください。'
          : undefined
      )
    }
  }
})

test('件数モードごとの下限・上限と整数制約を検証する', () => {
  // Given: 対象20譜面に対する数値・残数・割合・全件モード。
  const cases = [
    { countMode: 'number', count: '0', error: '件数は1以上の整数で入力してください。' },
    { countMode: 'number', count: '1', error: undefined },
    { countMode: 'number', count: '20', error: undefined },
    { countMode: 'number', count: '21', error: '件数は20件以内で入力してください。' },
    { countMode: 'remaining', count: '0', error: undefined },
    { countMode: 'remaining', count: '0.5', error: '件数は0以上の整数で入力してください。' },
    { countMode: 'remaining', count: '20', error: undefined },
    { countMode: 'remaining', count: '21', error: '件数は20件以内で入力してください。' },
    { countMode: 'percent', count: '0', error: undefined },
    { countMode: 'percent', count: '0.5', error: undefined },
    { countMode: 'percent', count: '100', error: undefined },
    { countMode: 'percent', count: '100.1', error: '割合は100%以内で入力してください。' },
    { countMode: 'all', count: 'not-a-number', error: undefined },
  ] as const

  // When & Then: 割合は対象譜面数ではなく100を上限とし、小数を許可する。
  for (const { countMode, count, error } of cases) {
    assert.equal(
      validateGoalForm({ ...validInput, countMode, count }),
      error,
      `${countMode}:${count}`
    )
  }
})

test('総スコア・OP合計の割合指定は理論値にかかわらず100を上限にする', () => {
  // Given: 100より小さい理論値と大きい理論値。
  for (const achievementType of ['total_score', 'overpower_value'] as const) {
    for (const theoreticalTotal of [20, 1000]) {
      for (const total of ['0', '0.5', '100', '100.001']) {
        // When
        const result = validateGoalForm({
          ...validInput,
          achievementType,
          totalMode: 'percent',
          total,
          theoreticalTotal,
        })

        // Then: 割合だけを基準に上限を判定する。
        const label = achievementType === 'total_score' ? '総スコア目標' : 'OVER POWER合計目標'
        assert.equal(
          result,
          total === '100.001' ? `${label}は最大 100 以下で入力してください。` : undefined
        )
      }
    }
  }
})

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

test('「現在値から」は現在値が0なら目標値に関係なくエラーになる', () => {
  // Given / When: 目標値も0でも、起点0は「最初から」と同じになる
  const result = validateGoalGaugeStart({
    ...gaugeStartInput,
    gaugeStartMode: 'current',
    current: 0,
    target: 0,
  })

  // Then
  assert.equal(result, '現在値が0のため、現在値からは始められません。')
})

test('「現在値から」は現在値が正から0になると保存前検証でエラーになる', () => {
  // Given: 現在値が正で目標値未満のときは保存できる
  const selectable = validateGoalGaugeStart({
    achievementType: 'rank_count',
    gaugeStartMode: 'current',
    gaugeStart: '',
    current: 4,
    target: 10,
  })

  // When: 達成条件の変更で現在値だけが0になる（対象譜面自体はある）
  const droppedToZero = validateGoalGaugeStart({
    achievementType: 'rank_count',
    gaugeStartMode: 'current',
    gaugeStart: '',
    current: 0,
    target: 10,
  })
  const truncatedToZero = validateGoalGaugeStart({
    achievementType: 'overpower_percent',
    gaugeStartMode: 'current',
    gaugeStart: '',
    current: 0.0004,
    target: 99.8,
  })

  // Then
  assert.equal(selectable, undefined)
  assert.equal(droppedToZero, '現在値が0のため、現在値からは始められません。')
  assert.equal(truncatedToZero, '現在値が0のため、現在値からは始められません。')
})

test('「現在値から」は対象が0件になると保存前検証と選択欄の両方でエラーになる', () => {
  // Given: 対象があるあいだは保存でき、選択欄にもエラーを出さない
  const selectable = validateGoalGaugeStart({
    ...gaugeStartInput,
    gaugeStartMode: 'current',
    current: 8,
    target: 20,
  })
  const selectableMessage = resolveGoalGaugeStartGroupErrorMessage({
    gaugeStartMode: 'current',
    currentGaugeStart: 8,
    achieved: false,
    targetCount: 20,
  })

  // When: 譜面条件の変更で対象が0件になり、現在値も0になる
  const noCharts = validateGoalGaugeStart({
    ...gaugeStartInput,
    gaugeStartMode: 'current',
    current: 0,
    target: 20,
  })
  const noChartsMessage = resolveGoalGaugeStartGroupErrorMessage({
    gaugeStartMode: 'current',
    currentGaugeStart: 0,
    achieved: false,
    targetCount: 0,
  })

  // Then
  assert.equal(selectable, undefined)
  assert.equal(selectableMessage, '')
  assert.equal(noCharts, '現在値が0のため、現在値からは始められません。')
  assert.equal(noChartsMessage, '対象がないため、現在値からは始められません。')
})

test('「現在値から」の選択欄は現在値0と達成済みへの変化を保存前から示す', () => {
  // Given
  const base = {
    gaugeStartMode: 'current' as const,
    currentGaugeStart: 12,
    achieved: false,
    targetCount: 20,
  }

  // When
  const droppedToZero = resolveGoalGaugeStartGroupErrorMessage({
    ...base,
    currentGaugeStart: 0,
  })
  const achieved = resolveGoalGaugeStartGroupErrorMessage({
    ...base,
    currentGaugeStart: 30,
    achieved: true,
  })
  const otherMode = resolveGoalGaugeStartGroupErrorMessage({
    ...base,
    gaugeStartMode: 'zero',
    currentGaugeStart: 0,
    targetCount: 0,
  })

  // Then
  assert.equal(resolveGoalGaugeStartGroupErrorMessage(base), '')
  assert.equal(droppedToZero, '現在値が0のため、現在値からは始められません。')
  assert.equal(achieved, '現在値が目標値に達しているため、現在値からは始められません。')
  assert.equal(otherMode, '')
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

test('ランク目標ではスコア文字列が範囲外でも保存前検証を通過する', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'rank_count' as const,
    score: '9999999',
    rank: 'S' as const,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})

test('単曲レートが下限ちょうどの場合は保存前検証を通過する', () => {
  // Given
  const input = {
    title: '単曲レート目標',
    achievementType: 'rating_count' as const,
    score: '0',
    rating: '0.01',
    rank: 'S' as const,
    count: '1',
    countMode: 'all' as const,
    total: '0',
    totalMode: 'number' as const,
    constRange: { min: 1, max: 16 },
    allCount: 1,
    theoreticalTotal: 0,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})

test('定数範囲の最小値が最大値を超える場合は保存前検証でエラーになる', () => {
  // Given
  const input = { ...validInput, constRange: { min: 15, max: 13 } }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '定数の最小値は最大値以下にしてください。')
})

test('定数範囲の最小値と最大値が等しい場合は保存前検証を通過する', () => {
  // Given
  const input = { ...validInput, constRange: { min: 13, max: 13 } }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})

test('単曲レート目標ではスコア文字列が範囲外でもスコアエラーにならない', () => {
  // Given
  const input = {
    title: '単曲レート目標',
    achievementType: 'rating_count' as const,
    score: '9999999',
    rating: '18.00',
    rank: 'S' as const,
    count: '1',
    countMode: 'all' as const,
    total: '0',
    totalMode: 'number' as const,
    constRange: { min: 1, max: 16 },
    allCount: 1,
    theoreticalTotal: 0,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})

test('平均スコア目標で範囲外のスコアは保存前検証でエラーになる', () => {
  // Given
  const input = { ...validInput, achievementType: 'avg_score' as const, score: '9999999' }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, 'スコアは 0 ～ 1,010,000 の範囲で入力してください。')
})

test('スコアが0の場合は保存前検証を通過する', () => {
  // Given
  const input = { ...validInput, score: '0' }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})

test('スコアが1010000の場合は保存前検証を通過する', () => {
  // Given
  const input = { ...validInput, score: '1010000' }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})

test('件数指定で小数を含む場合は保存前検証でエラーになる', () => {
  // Given
  const input = { ...validInput, count: '1.5' }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '件数は1以上の整数で入力してください。')
})

test('割合指定で負の値の場合は割合のエラーメッセージになる', () => {
  // Given
  const input = { ...validInput, countMode: 'percent' as const, count: '-1' }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '割合は0以上の数値で入力してください。')
})

test('件数が対象譜面数ちょうどの場合は保存前検証を通過する', () => {
  // Given
  const input = { ...validInput, count: '20' }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})

test('OVER POWER達成率が負の場合は保存前検証でエラーになる', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'overpower_percent' as const,
    total: '-1',
    totalMode: 'number' as const,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '合計/割合の目標値は0以上で入力してください。')
})

test('総スコア目標で数値指定の負値は保存前検証でエラーになる', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'total_score' as const,
    total: '-1',
    totalMode: 'number' as const,
    theoreticalTotal: 100,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '合計/割合の目標値は0以上で入力してください。')
})

test('総スコア目標で数値指定の小数は保存前検証でエラーになる', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'total_score' as const,
    total: '10.5',
    totalMode: 'number' as const,
    theoreticalTotal: 100,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '総スコアの目標値と残数は整数で入力してください。')
})

test('総スコア目標で残数指定の小数は保存前検証でエラーになる', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'total_score' as const,
    total: '10.5',
    totalMode: 'remaining' as const,
    theoreticalTotal: 100,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '総スコアの目標値と残数は整数で入力してください。')
})

test('OVER POWER合計が上限を超える場合は保存前検証でエラーになる', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'overpower_value' as const,
    total: '101',
    totalMode: 'number' as const,
    theoreticalTotal: 100,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, 'OVER POWER合計目標は最大 100 以下で入力してください。')
})

test('総スコア目標が上限を超える場合は保存前検証でエラーになる', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'total_score' as const,
    total: '101',
    totalMode: 'number' as const,
    theoreticalTotal: 100,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, '総スコア目標は最大 100 以下で入力してください。')
})

test('OVER POWER合計が上限以内の場合は保存前検証を通過する', () => {
  // Given
  const input = {
    ...validInput,
    achievementType: 'overpower_value' as const,
    total: '50',
    totalMode: 'number' as const,
    theoreticalTotal: 100,
  }

  // When
  const result = validateGoalForm(input)

  // Then
  assert.equal(result, undefined)
})
