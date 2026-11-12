import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateImageCaptureScale,
  canCopyImageToClipboard,
  canShareFiles,
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

test('クリップボードPNG書き込みに対応している場合はコピー可能と判定すること', () => {
  // Given: PNG書き込みに対応したClipboard API。
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const previousClipboardItem = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem')
  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          write: () => Promise.resolve(),
        },
      },
    })
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: {
        supports: () => true,
      },
    })

    // When: 画像クリップボードの対応可否を確認する。
    const result = canCopyImageToClipboard()

    // Then: 対応と判定する。
    assert.equal(result, true)
  } finally {
    if (previousNavigator) {
      Object.defineProperty(globalThis, 'navigator', previousNavigator)
    } else {
      Reflect.deleteProperty(globalThis, 'navigator')
    }
    if (previousClipboardItem) {
      Object.defineProperty(globalThis, 'ClipboardItem', previousClipboardItem)
    } else {
      Reflect.deleteProperty(globalThis, 'ClipboardItem')
    }
  }
})

test('ClipboardItemのPNG対応確認が未対応を返す場合はコピー不可と判定すること', () => {
  // Given: PNG未対応を返すClipboardItem。
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const previousClipboardItem = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem')
  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          write: () => Promise.resolve(),
        },
      },
    })
    Object.defineProperty(globalThis, 'ClipboardItem', {
      configurable: true,
      value: {
        supports: () => false,
      },
    })

    // When: 画像クリップボードの対応可否を確認する。
    const result = canCopyImageToClipboard()

    // Then: 非対応と判定する。
    assert.equal(result, false)
  } finally {
    if (previousNavigator) {
      Object.defineProperty(globalThis, 'navigator', previousNavigator)
    } else {
      Reflect.deleteProperty(globalThis, 'navigator')
    }
    if (previousClipboardItem) {
      Object.defineProperty(globalThis, 'ClipboardItem', previousClipboardItem)
    } else {
      Reflect.deleteProperty(globalThis, 'ClipboardItem')
    }
  }
})

test('ClipboardItemがない環境では書き込み手段があってもコピー不可と判定すること', () => {
  // Given: clipboard.writeはあるがClipboardItemがない環境。
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const previousClipboardItem = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem')
  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          write: () => Promise.resolve(),
        },
      },
    })
    Reflect.deleteProperty(globalThis, 'ClipboardItem')

    // When: 画像クリップボードの対応可否を確認する。
    const result = canCopyImageToClipboard()

    // Then: 非対応と判定する。
    assert.equal(result, false)
  } finally {
    if (previousNavigator) {
      Object.defineProperty(globalThis, 'navigator', previousNavigator)
    } else {
      Reflect.deleteProperty(globalThis, 'navigator')
    }
    if (previousClipboardItem) {
      Object.defineProperty(globalThis, 'ClipboardItem', previousClipboardItem)
    } else {
      Reflect.deleteProperty(globalThis, 'ClipboardItem')
    }
  }
})
