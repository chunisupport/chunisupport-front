import assert from 'node:assert/strict'
import test from 'node:test'

import { formatFullChainLampLabel } from './fullChainDisplay'

test('FULL CHAINの状態を表示用ラベルに変換すること', () => {
  // Given
  const cases = [
    { fullChain: 'FULL CHAIN GOLD', expected: 'FULL CHAIN (GOLD)' },
    { fullChain: 'FULL CHAIN PLATINUM', expected: 'FULL CHAIN (PLATINUM)' },
    { fullChain: null, expected: 'なし' },
  ] as const

  // When
  const results = cases.map(({ fullChain }) => formatFullChainLampLabel(fullChain))

  // Then
  assert.deepEqual(
    results,
    cases.map(({ expected }) => expected)
  )
})
