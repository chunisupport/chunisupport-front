import assert from 'node:assert/strict'
import test from 'node:test'
import { getHeatmapBackground, HEATMAP_MAX_MIX_PERCENT } from './heatmapColor'

test('全件達成のヒートマップ背景はアクセント色を最大割合で混ぜる', () => {
  // Given
  const count = 4
  const total = 4

  // When
  const result = getHeatmapBackground(count, total)

  // Then
  assert.equal(
    result,
    `color-mix(in srgb, var(--cs-color-action-primary) ${HEATMAP_MAX_MIX_PERCENT}%, var(--cs-color-surface))`
  )
})

test('総数が0件のヒートマップ背景はアクセント色を混ぜない', () => {
  // Given
  const count = 0
  const total = 0

  // When
  const result = getHeatmapBackground(count, total)

  // Then
  assert.equal(
    result,
    'color-mix(in srgb, var(--cs-color-action-primary) 0%, var(--cs-color-surface))'
  )
})
