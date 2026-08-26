import assert from 'node:assert/strict'
import test from 'node:test'
import { PLAYER_STATS_ACHIEVEMENTS } from './constants'

test('RANK達成状況はプレイ済みを除外しS+とSS+を含む', () => {
  // Given & When
  const achievements = PLAYER_STATS_ACHIEVEMENTS.rank

  // Then
  assert.deepEqual(achievements, ['s', 'sPlus', 'ss', 'ssPlus', 'sss', 'sssPlus', 'max'])
})
