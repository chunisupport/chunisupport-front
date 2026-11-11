import { X_TIMELINE_APPROACH_MARGIN_PX, X_TIMELINE_EAGER_VISIBLE_RATIO } from './constants'

/** 予約領域の境界。 */
export type XTimelineViewportRect = {
  top: number
  bottom: number
  height: number
}

/** 読み込み判定に使う、予約領域とビューポートの位置関係。 */
export type XTimelineViewportMeasurement = {
  /** 予約領域の上端がビューポート下端よりどれだけ下にあるか。負値は上端が下端より上。 */
  distanceFromViewportBottomPx: number
  /** ビューポート内に見えている高さの割合。0以上1以下。 */
  viewportVisibleRatio: number
  /** 予約領域全体がビューポートより上にある。 */
  isAboveViewport: boolean
}

/**
 * 予約領域とビューポートの位置関係を測る。
 * rootMargin で広がった交差ではなく、実際の表示領域だけを使う。
 *
 * @param rect - 予約領域の境界。
 * @param viewportHeight - ビューポートの高さ（px）。
 * @returns 読み込み判定に使う位置関係。
 */
export const measureXTimelineViewport = (
  rect: XTimelineViewportRect,
  viewportHeight: number
): XTimelineViewportMeasurement => {
  const visiblePx =
    rect.height > 0 && viewportHeight > 0
      ? Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
      : 0

  return {
    distanceFromViewportBottomPx: rect.top - viewportHeight,
    viewportVisibleRatio: rect.height > 0 && visiblePx > 0 ? visiblePx / rect.height : 0,
    isAboveViewport: rect.bottom <= 0,
  }
}

/**
 * X埋め込みの読み込みを開始するか判定する。
 *
 * 予約領域の15%以上が見えているときは、初回表示でも読み込む。
 * それ未満でビューポート下端から240px以内のときは、スクロール後に読み込む。
 * モバイルの初回表示では予約領域がほぼ画面外なので、widgets.js を取得しない。
 *
 * @param measurement - 予約領域とビューポートの位置関係。
 * @param hasUserScrolled - 初期位置からスクロールしたか。
 * @returns 読み込みを開始する場合は true。
 */
export const shouldRequestXTimeline = (
  measurement: XTimelineViewportMeasurement,
  hasUserScrolled: boolean
): boolean => {
  if (measurement.isAboveViewport) return false
  if (measurement.distanceFromViewportBottomPx > X_TIMELINE_APPROACH_MARGIN_PX) return false
  if (measurement.viewportVisibleRatio >= X_TIMELINE_EAGER_VISIBLE_RATIO) return true
  return hasUserScrolled
}
