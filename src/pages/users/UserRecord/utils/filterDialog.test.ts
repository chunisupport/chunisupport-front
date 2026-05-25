import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_FILTER } from '../types/filterDefaults'
import { formatFilterSummary } from './filterDialog'

test('FULL CHAINランプのフィルター要約は表示用ラベルで出力されること', () => {
  // Given
  const filter = {
    ...DEFAULT_FILTER,
    chain_lamp: ['FULL CHAIN PLATINUM', 'FULL CHAIN GOLD', null],
  }

  // When
  const result = formatFilterSummary(filter)

  // Then
  assert.match(result, /FULL CHAIN: FULL CHAIN \(PLATINUM\),FULL CHAIN \(GOLD\),なし/)
})
