import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveViewportTooltipPosition } from './chartTooltipPosition'

test('左端で開いたChart.jsツールチップが画面外にはみ出さないこと', () => {
  // Given: 横スクロールされたCanvasの左端付近に点がある
  const caret = { left: 8, top: 180 }
  const canvasRect = { left: 0, top: 100 }
  const tooltipSize = { width: 220, height: 72 }
  const viewport = { width: 390, height: 800 }

  // When: viewport内に収めるツールチップ座標を計算する
  const result = resolveViewportTooltipPosition(caret, canvasRect, tooltipSize, viewport, 8, 8)

  // Then: 左端の余白位置まで補正される
  assert.equal(result.left, 8)
})

test('右端で開いたChart.jsツールチップが画面外にはみ出さないこと', () => {
  // Given: 横スクロールされたCanvasの右端付近に点がある
  const caret = { left: 382, top: 180 }
  const canvasRect = { left: 0, top: 100 }
  const tooltipSize = { width: 220, height: 72 }
  const viewport = { width: 390, height: 800 }

  // When: viewport内に収めるツールチップ座標を計算する
  const result = resolveViewportTooltipPosition(caret, canvasRect, tooltipSize, viewport, 8, 8)

  // Then: 右端の余白位置まで補正される
  assert.equal(result.left, 162)
})

test('上端に十分な余白がない場合は点の下側に表示すること', () => {
  // Given: 点の上側にツールチップを表示する余白がない
  const caret = { left: 180, top: 16 }
  const canvasRect = { left: 0, top: 0 }
  const tooltipSize = { width: 180, height: 72 }
  const viewport = { width: 390, height: 800 }

  // When: viewport内に収めるツールチップ座標を計算する
  const result = resolveViewportTooltipPosition(caret, canvasRect, tooltipSize, viewport, 8, 8)

  // Then: 点の下側に配置される
  assert.equal(result.top, 24)
})
