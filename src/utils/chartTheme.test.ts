import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveChartColor } from './chartTheme'

test('CSSカスタムプロパティをChart.js用の解決済み色へ変換する', () => {
  // Given
  const previousDocument = globalThis.document
  const previousGetComputedStyle = globalThis.getComputedStyle
  const removed: boolean[] = []
  const colorProbe = {
    style: { color: '' },
    remove: () => removed.push(true),
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => colorProbe,
      documentElement: { append: () => undefined },
    },
  })
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ color: 'rgb(12, 34, 56)' }),
  })

  try {
    // When
    const color = resolveChartColor('--cs-color-text')

    // Then
    assert.equal(colorProbe.style.color, 'var(--cs-color-text, #6b7280)')
    assert.equal(color, 'rgb(12, 34, 56)')
    assert.deepEqual(removed, [true])
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: previousDocument,
    })
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: previousGetComputedStyle,
    })
  }
})

test('色を解決できない場合は既定色を返す', () => {
  // Given
  const previousDocument = globalThis.document
  const previousGetComputedStyle = globalThis.getComputedStyle
  const colorProbe = { style: { color: '' }, remove: () => undefined }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => colorProbe,
      documentElement: { append: () => undefined },
    },
  })
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ color: '' }),
  })

  try {
    // When & Then
    assert.equal(resolveChartColor('--missing-color', '#123456'), '#123456')
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: previousDocument,
    })
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      value: previousGetComputedStyle,
    })
  }
})
