import assert from 'node:assert/strict'
import test from 'node:test'
import {
  COMBO_LAMP_UNACHIEVED_FILTERS,
  HARD_LAMP_UNACHIEVED_FILTERS,
  isComboLampGoalValue,
  isHardLampGoalValue,
  resolveHardLampRecordName,
} from './goalLamp'

test('ハードランプ目標値はレコード上のランプ名へ変換される', () => {
  // Given
  const goalLamp = 'ABS'

  // When
  const result = resolveHardLampRecordName(goalLamp)

  // Then
  assert.equal(result, 'ABSOLUTE')
})

test('ランプ目標値の型ガードは定義済みの値だけを許可する', () => {
  // Given / When / Then
  assert.equal(isHardLampGoalValue('CTS'), true)
  assert.equal(isHardLampGoalValue('CLEAR'), false)
  assert.equal(isComboLampGoalValue('AJ'), true)
  assert.equal(isComboLampGoalValue('FULL COMBO'), false)
})

test('未達成フィルターは目標未満のランプだけを含む', () => {
  // Given / When / Then
  assert.deepEqual(HARD_LAMP_UNACHIEVED_FILTERS.ABS, ['BRAVE', 'HARD', 'CLEAR', 'FAILED', null])
  assert.deepEqual(COMBO_LAMP_UNACHIEVED_FILTERS.AJ, ['FULL COMBO', null])
})
