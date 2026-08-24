import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveChartColor, resolveChartPixelLength } from './chartTheme'

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

test('CSSカスタムプロパティのpx値をChart.js用の数値へ変換する', () => {
  // Given
  const previousDocument = globalThis.document
  const previousGetComputedStyle = globalThis.getComputedStyle
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement: {} },
  })
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ getPropertyValue: () => '6px' }),
  })

  try {
    // When & Then
    assert.equal(resolveChartPixelLength('--cs-size-score-rank-plus-stripe-period', 4), 6)
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

test('CSSカスタムプロパティの長さを解決できない場合は既定値を返す', () => {
  // Given
  const previousDocument = globalThis.document
  const previousGetComputedStyle = globalThis.getComputedStyle
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { documentElement: {} },
  })
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ getPropertyValue: () => '0px' }),
  })

  try {
    // When & Then
    assert.equal(resolveChartPixelLength('--missing-length', 3), 3)
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
