import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateImageCaptureScale,
  canCopyImageToClipboard,
  copyImageToClipboard,
} from './domImageCapture.ts'

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

test('Node環境では画像クリップボードコピー非対応と判定すること', () => {
  // Given: Clipboard APIを持たないテスト実行環境。

  // When: 画像クリップボードの対応可否を確認する。
  const canCopy = canCopyImageToClipboard()

  // Then: 非対応と判定する。
  assert.equal(canCopy, false)
})

test('画像クリップボードが使えない環境でコピーするとエラーになること', async () => {
  // Given: Clipboard APIを持たないテスト実行環境とPNG画像。
  const image = new Blob(['png'], { type: 'image/png' })

  // When & Then: コピーは失敗する。
  await assert.rejects(
    () => copyImageToClipboard(image),
    new Error('Image clipboard is unavailable')
  )
})
