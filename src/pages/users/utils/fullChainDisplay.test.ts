import assert from 'node:assert/strict'
import test from 'node:test'

import { formatFullChainLampLabel } from './fullChainDisplay.ts'

test('FULL CHAIN GOLDは表示用ラベルに変換されること', () => {
  // Given
  const fullChain = 'FULL CHAIN GOLD'

  // When
  const result = formatFullChainLampLabel(fullChain)

  // Then
  assert.equal(result, 'FULL CHAIN (GOLD)')
})

test('FULL CHAIN PLATINUMは表示用ラベルに変換されること', () => {
  // Given
  const fullChain = 'FULL CHAIN PLATINUM'

  // When
  const result = formatFullChainLampLabel(fullChain)

  // Then
  assert.equal(result, 'FULL CHAIN (PLATINUM)')
})

test('FULL CHAINランプなしはなしに変換されること', () => {
  // Given
  const fullChain = null

  // When
  const result = formatFullChainLampLabel(fullChain)

  // Then
  assert.equal(result, 'なし')
})
