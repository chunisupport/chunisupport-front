import assert from 'node:assert/strict'
import test from 'node:test'
import { X_TIMELINE_APPROACH_MARGIN_PX, X_TIMELINE_EAGER_VISIBLE_RATIO } from './constants'
import { measureXTimelineViewport, shouldRequestXTimeline } from './xTimelineViewport'

const TIMELINE_HEIGHT = 600

test('予約領域が十分見えているときはスクロール前でも読み込む', () => {
  // Given: デスクトップの2カラムのように、予約領域の大半がビューポート内にある。
  const measurement = measureXTimelineViewport(
    { top: 280, bottom: 880, height: TIMELINE_HEIGHT },
    940
  )

  // When: まだスクロールしていない。
  const shouldLoad = shouldRequestXTimeline(measurement, false)

  // Then: 画面内なので読み込む。
  assert.equal(measurement.viewportVisibleRatio, 1)
  assert.equal(shouldLoad, true)
})

test('下端にわずかに見えるだけではスクロールまで読み込まない', () => {
  // Given: モバイルの初回表示で、予約領域の上端だけがビューポートに入っている。
  const measurement = measureXTimelineViewport(
    { top: 760, bottom: 1360, height: TIMELINE_HEIGHT },
    823
  )

  // When: スクロールの有無で判定する。
  const beforeScroll = shouldRequestXTimeline(measurement, false)
  const afterScroll = shouldRequestXTimeline(measurement, true)

  // Then: 表示割合がしきい値未満の間は、スクロール後にだけ読み込む。
  assert.ok(measurement.viewportVisibleRatio < X_TIMELINE_EAGER_VISIBLE_RATIO)
  assert.equal(beforeScroll, false)
  assert.equal(afterScroll, true)
})

test('ビューポートの240pxより下にあるときはスクロールしても読み込まない', () => {
  // Given: 予約領域が接近距離より下にある。
  const measurement = measureXTimelineViewport(
    { top: 1200, bottom: 1800, height: TIMELINE_HEIGHT },
    800
  )

  // When: スクロール済みでも距離が遠い。
  const shouldLoad = shouldRequestXTimeline(measurement, true)

  // Then: まだ近づいていないので読み込まない。
  assert.ok(measurement.distanceFromViewportBottomPx > X_TIMELINE_APPROACH_MARGIN_PX)
  assert.equal(shouldLoad, false)
})

test('ビューポート下端から240px以内ならスクロール後に読み込む', () => {
  // Given: 予約領域はまだ見えていないが、下端から240px以内にある。
  const measurement = measureXTimelineViewport(
    { top: 1000, bottom: 1600, height: TIMELINE_HEIGHT },
    800
  )

  // When: 利用者がスクロールした。
  const beforeScroll = shouldRequestXTimeline(measurement, false)
  const afterScroll = shouldRequestXTimeline(measurement, true)

  // Then: 近づいたあとだけ読み込む。
  assert.equal(measurement.distanceFromViewportBottomPx, 200)
  assert.equal(measurement.viewportVisibleRatio, 0)
  assert.equal(beforeScroll, false)
  assert.equal(afterScroll, true)
})

test('表示割合がしきい値ちょうどならスクロール前に読み込む', () => {
  // Given: 見えている高さがしきい値と一致する。
  const viewportHeight = 800
  const visiblePx = TIMELINE_HEIGHT * X_TIMELINE_EAGER_VISIBLE_RATIO
  const top = viewportHeight - visiblePx
  const measurement = measureXTimelineViewport(
    { top, bottom: top + TIMELINE_HEIGHT, height: TIMELINE_HEIGHT },
    viewportHeight
  )

  // When: まだスクロールしていない。
  const shouldLoad = shouldRequestXTimeline(measurement, false)

  // Then: しきい値以上なので読み込む。
  assert.equal(measurement.viewportVisibleRatio, X_TIMELINE_EAGER_VISIBLE_RATIO)
  assert.equal(shouldLoad, true)
})

test('ビューポートより上へ出た領域は読み込まない', () => {
  // Given: 予約領域全体がビューポートの上にある。
  const measurement = measureXTimelineViewport(
    { top: -700, bottom: -100, height: TIMELINE_HEIGHT },
    800
  )

  // When: スクロール済みでも上に抜けている。
  const shouldLoad = shouldRequestXTimeline(measurement, true)

  // Then: 読み込まない。
  assert.equal(measurement.isAboveViewport, true)
  assert.equal(measurement.viewportVisibleRatio, 0)
  assert.equal(shouldLoad, false)
})

test('高さが0の領域は見えていないものとして扱う', () => {
  // Given: 高さを持たない境界。
  const measurement = measureXTimelineViewport({ top: 100, bottom: 100, height: 0 }, 800)

  // Then: 表示割合は0で、スクロール前は読み込まない。
  assert.equal(measurement.viewportVisibleRatio, 0)
  assert.equal(shouldRequestXTimeline(measurement, false), false)
})
