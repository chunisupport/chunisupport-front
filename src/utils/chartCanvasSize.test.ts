import assert from 'node:assert/strict'
import test from 'node:test'
import { snapChartCanvasLength } from './chartCanvasSize'

test('等倍表示で端数のある長さは整数ピクセルへ切り捨てられること', () => {
  // Given
  const cssLength = 389.5

  // When
  const result = snapChartCanvasLength(cssLength, 1)

  // Then
  assert.equal(result, 389)
})

test('150%表示では0.1px単位かつ物理ピクセルが整数になる長さを返すこと', () => {
  // Given
  const cssLength = 389.5

  // When
  const result = snapChartCanvasLength(cssLength, 1.5)

  // Then
  assert.equal(result, 388)
  assert.equal(result * 1.5, 582)
})

test('125%表示では0.8px単位の長さを返すこと', () => {
  // Given
  const cssLength = 389.5

  // When
  const result = snapChartCanvasLength(cssLength, 1.25)

  // Then
  assert.equal(result, 388.8)
  assert.equal(Math.round(result * 1.25 * 1e6) / 1e6, 486)
})

test('ブラウザのズームでデバイスピクセル比に誤差がある場合も物理ピクセルへ揃うこと', () => {
  // Given: Chromeの110%ズーム時に返るデバイスピクセル比
  const devicePixelRatio = 1.100000023841858

  // When
  const result = snapChartCanvasLength(440.5, devicePixelRatio)

  // Then
  assert.equal(result, 440)
  assert.equal(Math.round(result * devicePixelRatio * 10) / 10, 484)
})

test('デバイスピクセル比が2.625の場合も物理ピクセルへ揃うこと', () => {
  // Given: 21の倍数まで20物理ピクセル切り詰める必要がある長さ
  const devicePixelRatio = 2.625
  const cssLength = 440 / devicePixelRatio

  // When
  const result = snapChartCanvasLength(cssLength, devicePixelRatio)

  // Then
  assert.equal(result, 160)
  assert.equal(result * devicePixelRatio, 420)
})

test('すでに物理ピクセルへ揃っている長さはそのまま返すこと', () => {
  // Given
  const cssLength = 400

  // When
  const result = snapChartCanvasLength(cssLength, 2)

  // Then
  assert.equal(result, 400)
})

test('長さが0の場合は0を返すこと', () => {
  // Given
  const cssLength = 0

  // When
  const result = snapChartCanvasLength(cssLength, 1.5)

  // Then
  assert.equal(result, 0)
})
