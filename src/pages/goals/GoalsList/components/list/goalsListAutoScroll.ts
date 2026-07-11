import { onCleanup } from 'solid-js'

/** メインコンテンツのスクロールコンテナ ID。 */
const APP_MAIN_ID = 'app-main'

/** 画面端からこの距離（px）以内で自動スクロールを開始する。 */
const SCROLL_THRESHOLD_PX = 100

/** 自動スクロールの最大速度（px/秒）。約 60fps 時に 15px/frame 相当。 */
const MAX_SCROLL_SPEED_PX_PER_SEC = 900

/**
 * ポインタ Y 座標から縦方向の自動スクロール速度（px/秒）を計算する。
 *
 * 画面上端・下端のしきい値内では、端に近いほど速くなる。
 *
 * @param clientY - ポインタのビューポート Y 座標。
 * @param viewportHeight - ビューポート高さ。
 * @param thresholdPx - 端からの開始距離。
 * @param maxSpeedPxPerSec - 最大速度。
 * @returns 上方向は負、下方向は正の速度。しきい値外は 0。
 */
export function computeAutoScrollSpeedPxPerSec(
  clientY: number,
  viewportHeight: number,
  thresholdPx: number = SCROLL_THRESHOLD_PX,
  maxSpeedPxPerSec: number = MAX_SCROLL_SPEED_PX_PER_SEC
): number {
  if (clientY < thresholdPx) {
    return -maxSpeedPxPerSec * (1 - clientY / thresholdPx)
  }
  if (clientY > viewportHeight - thresholdPx) {
    return maxSpeedPxPerSec * (1 - (viewportHeight - clientY) / thresholdPx)
  }
  return 0
}

/**
 * スクロールコンテナの最大 `scrollTop` を返す。
 *
 * @param scrollHeight - コンテンツの総高さ。
 * @param clientHeight - 可視領域の高さ。
 * @returns 0 以上の最大スクロール位置。
 */
export function getMaxScrollTop(scrollHeight: number, clientHeight: number): number {
  return Math.max(0, scrollHeight - clientHeight)
}

/**
 * 次の `scrollTop` を自然なスクロール範囲内に収める。
 *
 * ドラッグ中の CSS transform が `scrollHeight` を押し広げても、
 * ドラッグ開始時に記録した上限を超えて無限スクロールしないようにする。
 *
 * @param nextScrollTop - 適用しようとしている scrollTop。
 * @param naturalMaxScrollTop - ドラッグ開始時の最大 scrollTop（transform 膨張前）。
 * @param currentMaxScrollTop - 現在の DOM 上の最大 scrollTop。
 * @returns クランプ後の scrollTop。
 */
export function clampAutoScrollTop(
  nextScrollTop: number,
  naturalMaxScrollTop: number,
  currentMaxScrollTop: number
): number {
  const maxScrollTop = Math.min(naturalMaxScrollTop, currentMaxScrollTop)
  return Math.min(Math.max(0, nextScrollTop), maxScrollTop)
}

/**
 * スクロール差分が変化したときに呼ばれるハンドラ。
 *
 * @param scrollDeltaY - ドラッグ開始時からの `scrollTop` 差分（下方向が正）。
 */
export type AutoScrollDeltaHandler = (scrollDeltaY: number) => void

/**
 * ドラッグ中にカーソルが画面端に近づいたときに `#app-main` を自動スクロールする。
 *
 * スクロール量は solid-dnd の transform 補正用に `setOnScrollDeltaChange` へ通知する。
 * レイアウト再計算・衝突判定・transformer 更新は呼び出し側で行う。
 *
 * @returns スクロール開始・停止の制御関数とコールバック設定関数。
 */
export function createAutoScroll() {
  let clientY: number | null = null
  let animationId: number | null = null
  let isActive = false
  let container: HTMLElement | null = null
  let baseScrollTop = 0
  /** transform 膨張前の最大 scrollTop。無限スクロール防止に使う。 */
  let naturalMaxScrollTop = 0
  let lastTimestampMs: number | null = null
  let onScrollDeltaChange: AutoScrollDeltaHandler | null = null

  /**
   * ポインタ移動を追跡し、自動スクロール判定用の Y 座標を更新する。
   *
   * @param event - ポインターイベント。
   * @returns なし。
   */
  const handlePointerMove = (event: PointerEvent): void => {
    if (!isActive) return
    clientY = event.clientY
  }

  /**
   * 1 フレーム分の自動スクロールを適用する。
   *
   * @param timestampMs - `requestAnimationFrame` のタイムスタンプ。
   * @returns なし。
   */
  const tick = (timestampMs: number): void => {
    if (!isActive) {
      animationId = null
      return
    }

    const previousTimestampMs = lastTimestampMs
    lastTimestampMs = timestampMs
    const deltaMs =
      previousTimestampMs === null ? 0 : Math.min(timestampMs - previousTimestampMs, 64)

    if (clientY !== null && container && deltaMs > 0) {
      const speedPxPerSec = computeAutoScrollSpeedPxPerSec(clientY, window.innerHeight)
      if (speedPxPerSec !== 0) {
        const previousScrollTop = container.scrollTop
        const currentMaxScrollTop = getMaxScrollTop(container.scrollHeight, container.clientHeight)
        const nextScrollTop = clampAutoScrollTop(
          previousScrollTop + (speedPxPerSec * deltaMs) / 1000,
          naturalMaxScrollTop,
          currentMaxScrollTop
        )
        if (nextScrollTop !== previousScrollTop) {
          container.scrollTop = nextScrollTop
          const scrollDeltaY = container.scrollTop - baseScrollTop
          onScrollDeltaChange?.(scrollDeltaY)
        }
      }
    }

    animationId = requestAnimationFrame(tick)
  }

  /**
   * 自動スクロールを開始する。
   *
   * @param options - 初期ポインタ位置など。
   * @param options.clientY - ドラッグ開始時点のポインタ Y。省略時は最初の pointermove まで待機。
   * @returns なし。
   */
  const start = (options?: { clientY?: number }): void => {
    if (isActive) return
    isActive = true
    container = document.getElementById(APP_MAIN_ID)
    baseScrollTop = container?.scrollTop ?? 0
    // ドラッグ transform が scrollHeight を押し広げる前の上限を記録する。
    naturalMaxScrollTop = container
      ? getMaxScrollTop(container.scrollHeight, container.clientHeight)
      : 0
    clientY = options?.clientY ?? null
    lastTimestampMs = null
    document.addEventListener('pointermove', handlePointerMove)
    animationId = requestAnimationFrame(tick)
  }

  /**
   * 自動スクロールを停止し、リスナーと rAF を解除する。
   *
   * @returns なし。
   */
  const stop = (): void => {
    isActive = false
    clientY = null
    container = null
    baseScrollTop = 0
    naturalMaxScrollTop = 0
    lastTimestampMs = null
    document.removeEventListener('pointermove', handlePointerMove)
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  /**
   * スクロール差分変化時のコールバックを設定する。
   *
   * @param handler - 差分通知ハンドラ。`null` で解除。
   * @returns なし。
   */
  const setOnScrollDeltaChange = (handler: AutoScrollDeltaHandler | null): void => {
    onScrollDeltaChange = handler
  }

  onCleanup(stop)

  return { start, stop, setOnScrollDeltaChange }
}
