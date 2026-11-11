import { type Component, onCleanup, onMount } from 'solid-js'

import {
  X_TIMELINE_ACCOUNT_URL,
  X_TIMELINE_EAGER_VISIBLE_RATIO,
  X_TIMELINE_HEIGHT_PX,
  X_TIMELINE_IDLE_TIMEOUT_MS,
  X_TIMELINE_LINK_TEXT,
  X_TIMELINE_LOAD_ROOT_MARGIN,
} from './constants'
import { loadXTimelineScriptInBrowser } from './loadXTimelineScript'
import { measureXTimelineViewport, shouldRequestXTimeline } from './xTimelineViewport'

/**
 * アイドル時、または未対応環境では次のタスクで読み込みを始める。
 *
 * @param load - widgets.js を読み込んで埋め込む処理。
 * @returns 解除用のコールバック。
 */
const scheduleXTimelineLoad = (load: () => void): (() => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    const idleCallbackId = window.requestIdleCallback(load, {
      timeout: X_TIMELINE_IDLE_TIMEOUT_MS,
    })
    return () => window.cancelIdleCallback(idleCallbackId)
  }

  const timeoutId = window.setTimeout(load, 0)
  return () => window.clearTimeout(timeoutId)
}

/**
 * ChuniSupport公式Xアカウントのタイムラインを表示する。
 * 予約領域がビューポートへ十分入っているとき、またはスクロールで近づいたときにだけ widgets.js を読む。
 * 読み込み前と失敗時は公式アカウントへのリンクを残す。
 *
 * @returns 高さを確保したXタイムライン。
 */
export const XTimeline: Component = () => {
  let frameRef: HTMLDivElement | undefined
  let containerRef: HTMLDivElement | undefined

  onMount(() => {
    const frame = frameRef
    if (!frame) return

    let hasUserScrolled = false
    let loadRequested = false
    let disposed = false
    let cancelScheduledLoad: (() => void) | undefined
    const initialScrollY = window.scrollY

    const startLoad = (): void => {
      cancelScheduledLoad = scheduleXTimelineLoad(() => {
        if (disposed) return
        loadXTimelineScriptInBrowser()
          .then((twitter) => {
            if (!disposed && containerRef) twitter.widgets.load(containerRef)
          })
          .catch(() => {
            // 埋め込みに失敗した場合は、アカウントへのリンクをフォールバックとして残す。
          })
      })
    }

    const tryLoad = (): void => {
      if (loadRequested || disposed || !frameRef) return
      const measurement = measureXTimelineViewport(
        frameRef.getBoundingClientRect(),
        window.innerHeight
      )
      if (!shouldRequestXTimeline(measurement, hasUserScrolled)) return
      loadRequested = true
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      startLoad()
    }

    const onScroll = (): void => {
      if (window.scrollY !== initialScrollY) hasUserScrolled = true
      tryLoad()
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    let observer: IntersectionObserver | undefined
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(tryLoad, {
        rootMargin: X_TIMELINE_LOAD_ROOT_MARGIN,
        threshold: [0, X_TIMELINE_EAGER_VISIBLE_RATIO],
      })
      observer.observe(frame)
    }

    tryLoad()

    onCleanup(() => {
      disposed = true
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelScheduledLoad?.()
    })
  })

  return (
    <div
      ref={frameRef}
      class="overflow-hidden"
      style={{
        height: `${X_TIMELINE_HEIGHT_PX}px`,
        'min-height': `${X_TIMELINE_HEIGHT_PX}px`,
        'max-height': `${X_TIMELINE_HEIGHT_PX}px`,
      }}
    >
      {/* widgets.js は class="twitter-timeline" の a 要素を探すため、コンポーネントには置き換えない。 */}
      <div ref={containerRef}>
        <a
          class="twitter-timeline text-sm font-medium text-action-primary underline"
          href={X_TIMELINE_ACCOUNT_URL}
          data-height={X_TIMELINE_HEIGHT_PX}
        >
          {X_TIMELINE_LINK_TEXT}
        </a>
      </div>
    </div>
  )
}
