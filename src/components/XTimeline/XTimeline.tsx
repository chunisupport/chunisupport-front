import { type Component, onMount } from 'solid-js'

import { X_TIMELINE_ACCOUNT_URL, X_TIMELINE_LINK_TEXT, X_TIMELINE_SCRIPT_SRC } from './constants'

type XWidgets = {
  load: (element?: HTMLElement) => void
}

type XGlobal = {
  widgets: XWidgets
}

declare global {
  interface Window {
    twttr?: XGlobal
  }
}

let xTimelineScriptPromise: Promise<XGlobal> | undefined

/**
 * Xの埋め込みウィジェット用スクリプトを読み込む。
 *
 * @returns 読み込み済みのXウィジェットAPI。
 */
const loadXTimelineScript = (): Promise<XGlobal> => {
  if (window.twttr) {
    return Promise.resolve(window.twttr)
  }
  if (xTimelineScriptPromise) {
    return xTimelineScriptPromise
  }

  xTimelineScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${X_TIMELINE_SCRIPT_SRC}"]`
    )
    const script = existingScript ?? document.createElement('script')

    const handleLoad = () => {
      if (window.twttr) {
        resolve(window.twttr)
        return
      }
      reject(new Error('X widget API is not available.'))
    }
    const handleError = () => reject(new Error('Failed to load X widget script.'))

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      script.src = X_TIMELINE_SCRIPT_SRC
      script.async = true
      script.charset = 'utf-8'
      document.head.append(script)
    }
  })

  return xTimelineScriptPromise
}

/**
 * ChuniSupport公式Xアカウントのタイムラインを表示する。
 *
 * @returns Xタイムラインの埋め込み要素。
 */
export const XTimeline: Component = () => {
  let containerRef: HTMLDivElement | undefined

  onMount(() => {
    loadXTimelineScript()
      .then((x) => {
        if (containerRef) {
          x.widgets.load(containerRef)
        }
      })
      .catch(() => {
        // 埋め込みに失敗した場合は、アカウントへのリンクをフォールバックとして残す。
      })
  })

  return (
    <div ref={containerRef}>
      <a class="twitter-timeline" href={X_TIMELINE_ACCOUNT_URL}>
        {X_TIMELINE_LINK_TEXT}
      </a>
    </div>
  )
}
