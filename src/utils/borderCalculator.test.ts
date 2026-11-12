import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateBorder, calculateLossBudget } from './borderCalculator'

test('2800ノーツ、目標1007500の場合は許容失点が700になること', () => {
  // Given
  const notes = 2800
  const targetScore = 1007500

  // When
  const lossBudget = calculateLossBudget(notes, targetScore)

  // Then
  assert.equal(lossBudget, 700)
})

test('2800ノーツ、目標1007500、目標JUSTICE数100の場合は数学的な許容上限を返すこと', () => {
  // Given
  const input = {
    notes: 2800,
    targetScore: 1007500,
    targetJustice: 100,
    fullComboOnly: false,
  }

  // When
  const result = calculateBorder(input)

  // Then: 各候補は許容失点700 (JUSTICE 1 + ATTACK 51 + MISS 101) をちょうど使い切り、
  // スコアは (101 * 2800 - 700) * 10000 / 2800 = 1007500 になる。
  assert.equal(result.reachable, true)
  assert.equal(result.mode, 'candidates')
  assert.deepEqual(result.candidates, [
    { justice: 144, attack: 1, miss: 5, loss: 700, score: 1007500 },
    { justice: 143, attack: 3, miss: 4, loss: 700, score: 1007500 },
    { justice: 142, attack: 5, miss: 3, loss: 700, score: 1007500 },
    { justice: 141, attack: 7, miss: 2, loss: 700, score: 1007500 },
    { justice: 140, attack: 9, miss: 1, loss: 700, score: 1007500 },
    { justice: 139, attack: 11, miss: 0, loss: 700, score: 1007500 },
  ])
})

test('目標JUSTICE数と同値の候補を含むこと', () => {
  // Given: 理論値ぴったりの目標スコアと、JUSTICE数0を目標にする。
  const input = {
    notes: 100,
    targetScore: 1010000,
    targetJustice: 0,
    fullComboOnly: false,
  }

  // When
  const result = calculateBorder(input)

  // Then: 目標JUSTICE数そのものの候補を除外しない。
  assert.equal(result.reachable, true)
  assert.equal(result.mode, 'candidates')
  assert.deepEqual(result.candidates, [{ justice: 0, attack: 0, miss: 0, loss: 0, score: 1010000 }])
})

test('目標JUSTICE数が未指定の場合はJUSTICE数を制限せず候補一覧を返すこと', () => {
  // Given
  const input = {
    notes: 2800,
    targetScore: 1007500,
    fullComboOnly: false,
  }

  // When
  const result = calculateBorder(input)

  // Then
  assert.equal(result.reachable, true)
  assert.equal(result.mode, 'candidates')
  assert.deepEqual(
    result.candidates.map(({ justice, attack, miss }) => ({ justice, attack, miss })),
    [
      { justice: 43, attack: 1, miss: 6 },
      { justice: 42, attack: 3, miss: 5 },
      { justice: 41, attack: 5, miss: 4 },
      { justice: 40, attack: 7, miss: 3 },
      { justice: 39, attack: 9, miss: 2 },
      { justice: 38, attack: 11, miss: 1 },
      { justice: 37, attack: 13, miss: 0 },
    ]
  )
})

test('FULL COMBO指定の場合は候補のMISSがすべて0になること', () => {
  // Given
  const input = {
    notes: 2800,
    targetScore: 1007500,
    targetJustice: 100,
    fullComboOnly: true,
  }

  // When
  const result = calculateBorder(input)

  // Then
  assert.equal(result.reachable, true)
  assert.equal(result.mode, 'candidates')
  assert.ok(result.candidates.length > 0)
  assert.ok(result.candidates.every((candidate) => candidate.miss === 0))
})

test('目標スコアが理論値を超える場合は到達不能になること', () => {
  // Given
  const input = {
    notes: 2800,
    targetScore: 1010001,
  }

  // When
  const result = calculateBorder(input)

  // Then
  assert.equal(result.reachable, false)
})
