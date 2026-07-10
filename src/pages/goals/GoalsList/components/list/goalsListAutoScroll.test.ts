import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clampAutoScrollTop,
  computeAutoScrollSpeedPxPerSec,
  getMaxScrollTop,
} from './goalsListAutoScroll'

const VIEWPORT_HEIGHT = 800
const THRESHOLD = 100
const MAX_SPEED = 900

test('画面中央では自動スクロール速度が 0 であること', () => {
  // Given
  const clientY = VIEWPORT_HEIGHT / 2

  // When
  const speed = computeAutoScrollSpeedPxPerSec(clientY, VIEWPORT_HEIGHT, THRESHOLD, MAX_SPEED)

  // Then
  assert.equal(speed, 0)
})

test('上端付近では上方向（負）の速度になること', () => {
  // Given: しきい値のちょうど中間
  const clientY = THRESHOLD / 2

  // When
  const speed = computeAutoScrollSpeedPxPerSec(clientY, VIEWPORT_HEIGHT, THRESHOLD, MAX_SPEED)

  // Then
  assert.equal(speed, -MAX_SPEED * 0.5)
})

test('下端付近では下方向（正）の速度になること', () => {
  // Given: 下端しきい値の中間
  const clientY = VIEWPORT_HEIGHT - THRESHOLD / 2

  // When
  const speed = computeAutoScrollSpeedPxPerSec(clientY, VIEWPORT_HEIGHT, THRESHOLD, MAX_SPEED)

  // Then
  assert.equal(speed, MAX_SPEED * 0.5)
})

test('上端（clientY=0）では最大上方向速度になること', () => {
  // Given
  const clientY = 0

  // When
  const speed = computeAutoScrollSpeedPxPerSec(clientY, VIEWPORT_HEIGHT, THRESHOLD, MAX_SPEED)

  // Then
  assert.equal(speed, -MAX_SPEED)
})

test('下端では最大下方向速度になること', () => {
  // Given
  const clientY = VIEWPORT_HEIGHT

  // When
  const speed = computeAutoScrollSpeedPxPerSec(clientY, VIEWPORT_HEIGHT, THRESHOLD, MAX_SPEED)

  // Then
  assert.equal(speed, MAX_SPEED)
})

test('しきい値境界では速度が 0 であること', () => {
  // Given / When / Then
  assert.equal(computeAutoScrollSpeedPxPerSec(THRESHOLD, VIEWPORT_HEIGHT, THRESHOLD, MAX_SPEED), 0)
  assert.equal(
    computeAutoScrollSpeedPxPerSec(
      VIEWPORT_HEIGHT - THRESHOLD,
      VIEWPORT_HEIGHT,
      THRESHOLD,
      MAX_SPEED
    ),
    0
  )
})

test('コンテンツが高さに収まる場合の最大 scrollTop は 0 であること', () => {
  // Given / When / Then
  assert.equal(getMaxScrollTop(500, 800), 0)
})

test('コンテンツが溢れる場合の最大 scrollTop は差分であること', () => {
  // Given / When / Then
  assert.equal(getMaxScrollTop(2000, 800), 1200)
})

test('自動スクロールは自然な上限を超えないこと', () => {
  // Given: transform 膨張で currentMax が自然上限より大きい
  const naturalMaxScrollTop = 1000
  const inflatedCurrentMaxScrollTop = 5000

  // When
  const clamped = clampAutoScrollTop(3000, naturalMaxScrollTop, inflatedCurrentMaxScrollTop)

  // Then: 膨張した currentMax ではなく自然上限で止まる
  assert.equal(clamped, 1000)
})

test('自動スクロールは 0 未満にならないこと', () => {
  // Given / When / Then
  assert.equal(clampAutoScrollTop(-50, 1000, 1000), 0)
})

test('現在の DOM 上限が自然上限より小さい場合は DOM 上限を優先すること', () => {
  // Given / When / Then
  assert.equal(clampAutoScrollTop(900, 1000, 700), 700)
})
