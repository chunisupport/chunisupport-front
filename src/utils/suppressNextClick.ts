/** 合成 click を待つ最大時間(ミリ秒)。タップ直後の click は通常この時間内に発火する。 */
export const SUPPRESS_NEXT_CLICK_TIMEOUT_MS = 500

/** 他のリスナーより先に click を受け取るためのキャプチャ指定。 */
const CAPTURE_OPTIONS: EventListenerOptions = { capture: true }

/**
 * 直後に発火する click イベントを1回だけ捨てる。
 *
 * タッチ操作では pointerup の後にブラウザが合成 click を発火するため、pointerup 時点で
 * 画面遷移やメニューのクローズを行うと、その click が遷移先の要素に当たってしまう。
 * それを防ぐため、キャプチャフェーズで次の click を打ち消す。
 *
 * @param target - click を監視する対象。既定は `window`。
 * @param timeoutMs - click が来なかった場合に監視を解除するまでの時間(ミリ秒)。
 * @returns 監視を即時解除する関数。
 */
export const suppressNextClick = (
  target: EventTarget = window,
  timeoutMs: number = SUPPRESS_NEXT_CLICK_TIMEOUT_MS
): (() => void) => {
  const handleClick = (event: Event): void => {
    event.preventDefault()
    event.stopImmediatePropagation()
    dispose()
  }

  const timeoutId = setTimeout(() => dispose(), timeoutMs)

  /**
   * click の監視とタイマーを解除する。
   *
   * @returns なし。
   */
  function dispose(): void {
    clearTimeout(timeoutId)
    target.removeEventListener('click', handleClick, CAPTURE_OPTIONS)
  }

  target.addEventListener('click', handleClick, CAPTURE_OPTIONS)
  return dispose
}
