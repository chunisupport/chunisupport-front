import assert from 'node:assert/strict'
import test from 'node:test'
import { getOverPowerColorTier, getOverPowerColorTierClass } from './overPowerColorTier'

test('達成率が各段階の境界値ちょうどの場合はその段階として判定されること', () => {
  // Given
  const boundaries = [0, 70, 80, 90, 95, 100]

  // When
  const result = boundaries.map(getOverPowerColorTier)

  // Then
  assert.deepEqual(result, ['white', 'silver', 'gold', 'platinum', 'rainbow', 'rainbow'])
})

test('達成率が境界値をわずかに下回る場合は1つ下の段階として判定されること', () => {
  // Given
  const belowBoundaries = [69.99999, 79.99999, 89.99999, 94.99999]

  // When
  const result = belowBoundaries.map(getOverPowerColorTier)

  // Then
  assert.deepEqual(result, ['white', 'silver', 'gold', 'platinum'])
})

test('色段階に対応する色付けクラスが返されること', () => {
  // Given
  const percent = 85

  // When
  const result = getOverPowerColorTierClass(percent)

  // Then
  assert.equal(result, 'over-power-tier--gold')
})

test('白段階では色付けクラスが返されないこと', () => {
  // Given
  const percent = 69.99

  // When
  const result = getOverPowerColorTierClass(percent)

  // Then
  assert.equal(result, undefined)
})
