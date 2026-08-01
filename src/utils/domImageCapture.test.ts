import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateImageCaptureScale } from './domImageCapture.ts'

test('画像化対象が上限内の場合は原寸の縮小率を返すこと', () => {
  // Given: 幅と高さが最大CSSピクセル数を下回る画像化対象。
  const width = 1_024
  const height = 2_400

  // When: 画像化用の縮小率を計算する。
  const scale = calculateImageCaptureScale(width, height, 8_000)

  // Then: 原寸を維持する。
  assert.equal(scale, 1)
})

test('画像化対象の長辺が上限を超える場合は長辺を基準に縮小すること', () => {
  // Given: 高さが最大CSSピクセル数を超える画像化対象。
  const width = 1_024
  const height = 10_000

  // When: 画像化用の縮小率を計算する。
  const scale = calculateImageCaptureScale(width, height, 8_000)

  // Then: 高さが上限へ収まる縮小率になる。
  assert.equal(scale, 0.8)
})
