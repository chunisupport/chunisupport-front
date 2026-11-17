import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateImageCaptureScale, canShareFiles } from './domImageCapture.ts'

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

test('Web Share APIに対応している場合は共有可能と判定すること', () => {
  // Given: ファイル共有に対応したnavigator。
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        canShare: () => true,
        share: () => Promise.resolve(),
      },
    })

    // When: 空のファイル一覧の共有可否を確認する。
    const result = canShareFiles([])

    // Then: 共有可能と判定する。
    assert.equal(result, true)
  } finally {
    if (previousNavigator) {
      Object.defineProperty(globalThis, 'navigator', previousNavigator)
    } else {
      Reflect.deleteProperty(globalThis, 'navigator')
    }
  }
})
