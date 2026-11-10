import assert from 'node:assert/strict'
import test from 'node:test'
import { createChartStripePattern } from './chartPattern'

test('Chart.js用の斜線パターンを指定色・幅・周期で生成する', () => {
  // Given
  const previousDocument = globalThis.document
  const strokes: number[] = []
  const lineStarts: [number, number][] = []
  const lineEnds: [number, number][] = []
  const patternContext = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    fillRect: () => undefined,
    beginPath: () => undefined,
    moveTo: (x: number, y: number) => lineStarts.push([x, y]),
    lineTo: (x: number, y: number) => lineEnds.push([x, y]),
    stroke: () => strokes.push(1),
  }
  const patternCanvas = {
    width: 0,
    height: 0,
    getContext: () => patternContext,
  }
  const expectedPattern = { kind: 'pattern' }
  const repetitions: string[] = []
  const targetContext = {
    createPattern: (_canvas: unknown, repetition: string) => {
      repetitions.push(repetition)
      return expectedPattern
    },
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => patternCanvas },
  })

  try {
    // When
    const result = createChartStripePattern(
      targetContext as unknown as CanvasRenderingContext2D,
      120,
      80,
      {
        baseColor: 'rgb(251, 44, 54)',
        stripeColor: 'rgba(255, 255, 255, 0.25)',
        stripeWidth: 3,
        period: 6,
      }
    )

    // Then
    assert.equal(result, expectedPattern)
    assert.equal(patternCanvas.width, 120)
    assert.equal(patternCanvas.height, 80)
    assert.equal(patternContext.fillStyle, 'rgb(251, 44, 54)')
    assert.equal(patternContext.strokeStyle, 'rgba(255, 255, 255, 0.25)')
    assert.equal(patternContext.lineWidth, 3)
    assert.ok(strokes.length > 0)
    assert.deepEqual(lineStarts[0], [-80, 0])
    assert.deepEqual(lineEnds[0], [0, 80])
    assert.deepEqual(repetitions, ['no-repeat'])
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: previousDocument,
    })
  }
})

test('CanvasPatternを生成できない場合は下地色を返す', () => {
  // Given
  const previousDocument = globalThis.document
  const patternCanvas = { width: 0, height: 0, getContext: () => null }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => patternCanvas },
  })

  try {
    // When
    const result = createChartStripePattern({} as CanvasRenderingContext2D, 120, 80, {
      baseColor: 'rgb(251, 44, 54)',
      stripeColor: 'rgba(255, 255, 255, 0.25)',
      stripeWidth: 3,
      period: 6,
    })

    // Then
    assert.equal(result, 'rgb(251, 44, 54)')
  } finally {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: previousDocument,
    })
  }
})
