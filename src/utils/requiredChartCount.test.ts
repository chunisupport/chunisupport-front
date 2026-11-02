import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateRequiredChartCountResult } from './requiredChartCount'

const TARGET = { max: 100, current: 0, percent: 100 }

test('高スコアの更新は定数入力なしで単一の必要譜面数を表示する', () => {
  // Given: SS+からSSSの増分は通常2.5、FC3、AJ3.5 OP。
  const cases = [
    [null, '40'],
    ['FULL COMBO', '34'],
    ['ALL JUSTICE', '29'],
  ] as const
  // When & Then
  for (const [lamp, label] of cases) {
    assert.deepEqual(calculateRequiredChartCountResult(TARGET, 1007500, lamp, 1005000, 100), {
      label,
      exceedsLimit: false,
    })
  }
})

test('必要数が収録曲数以下なら表示し、超過した場合は×にする', () => {
  // Given: 必要譜面数40。
  // When & Then
  for (const [songCount, label, exceedsLimit] of [
    [41, '40', false],
    [40, '40', false],
    [39, '×', true],
    [0, '×', true],
  ] as const) {
    assert.deepEqual(calculateRequiredChartCountResult(TARGET, 1007500, null, 1005000, songCount), {
      label,
      exceedsLimit,
    })
  }
})

test('90万点以下は定数16.0と1.0による必要数を少ない順の範囲で表示する', () => {
  // Given: 80万→85万、定数16はFCで14.25増、定数1はFCで0.5増。
  // When
  const result = calculateRequiredChartCountResult(TARGET, 850000, 'FULL COMBO', 800000, 200)
  // Then
  assert.deepEqual(result, { label: '8 〜 200', exceedsLimit: false })
})

test('範囲の一部だけ収録曲数を超える場合は数値と×を表示する', () => {
  // Given & When
  const result = calculateRequiredChartCountResult(TARGET, 850000, 'FULL COMBO', 800000, 199)
  // Then
  assert.deepEqual(result, { label: '8 〜 ×', exceedsLimit: true })
})

test('範囲全体が収録曲数を超える場合は×だけを表示する', () => {
  // Given & When
  const result = calculateRequiredChartCountResult(TARGET, 850000, 'FULL COMBO', 800000, 7)
  // Then
  assert.deepEqual(result, { label: '×', exceedsLimit: true })
})

test('定数1.0で増分がない場合は範囲の上端を×にする', () => {
  // Given & When: 定数16は13.75 OP増加、定数1は0 OPのまま。
  const result = calculateRequiredChartCountResult(TARGET, 850000, null, 800000, 100)
  // Then
  assert.deepEqual(result, { label: '8 〜 ×', exceedsLimit: true })
})

test('目標90万点ちょうどと、90万点をまたぐ更新も範囲計算する', () => {
  // Given & When & Then
  assert.deepEqual(calculateRequiredChartCountResult(TARGET, 900000, null, 800000, 100), {
    label: '4 〜 ×',
    exceedsLimit: true,
  })
  assert.deepEqual(calculateRequiredChartCountResult(TARGET, 950000, null, 850000, 100), {
    label: '4 〜 ×',
    exceedsLimit: true,
  })
})

test('達成済み・増分なし・理論値のランプ列は既存の表示を保つ', () => {
  // Given & When & Then
  assert.deepEqual(
    calculateRequiredChartCountResult({ ...TARGET, current: 100 }, 850000, null, 800000, 0),
    {
      label: '0',
      exceedsLimit: false,
    }
  )
  for (const lamp of [null, 'FULL COMBO', 'ALL JUSTICE']) {
    assert.deepEqual(calculateRequiredChartCountResult(TARGET, 1000000, lamp, 1007500, 100), {
      label: '—',
      exceedsLimit: false,
    })
  }
  assert.deepEqual(calculateRequiredChartCountResult(TARGET, 1010000, 'FULL COMBO', 0, 100), {
    label: '—',
    exceedsLimit: false,
  })
})

test('90万点超でも低定数のOP下限補正による範囲を保つ', () => {
  // Given & When & Then: 90万点を超えても定数1ではOPが0になる場合がある。
  assert.deepEqual(calculateRequiredChartCountResult(TARGET, 950000, null, 900000, 100), {
    label: '7 〜 ×',
    exceedsLimit: true,
  })
  assert.deepEqual(calculateRequiredChartCountResult(TARGET, 1000000, null, 950000, 100), {
    label: '8 〜 10',
    exceedsLimit: false,
  })
})
