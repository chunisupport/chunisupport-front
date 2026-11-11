import { X_TIMELINE_SCRIPT_SRC } from './constants'

/** widgets.js が `twttr.widgets` に置く埋め込みAPI。 */
export type XTimelineWidgetApi = {
  /** 要素内のタイムライン用アンカーを埋め込みへ置き換える。 */
  load: (element?: HTMLElement) => void
}

/** widgets.js が `window.twttr` に置くグローバル。 */
export type XTimelineWidgets = {
  widgets: XTimelineWidgetApi
}

declare global {
  interface Window {
    /** widgets.js が読み込まれたあとだけ存在する。 */
    twttr?: XTimelineWidgets
  }
}

/** テストとブラウザの両方から渡す、スクリプト挿入先。 */
export type XTimelineScriptElement = {
  src: string
  async: boolean
  addEventListener: (type: string, listener: () => void, options?: { once?: boolean }) => void
}

/** widgets.js の読み込みに使う文書と、読み込み済みAPIの参照。 */
export type XTimelineScriptHost = {
  document: {
    querySelector: (selector: string) => XTimelineScriptElement | null
    createElement: (tagName: 'script') => XTimelineScriptElement
    head: { append: (node: XTimelineScriptElement) => void }
  }
  readWidgets: () => XTimelineWidgets | undefined
}

/**
 * widgets.js を一度だけ読み込む関数を作る。
 * 失敗したPromiseは再利用し、同じページでスクリプトタグを増やさない。
 *
 * @returns ホストを受け取り、埋め込みAPIを返す関数。
 */
export const createXTimelineScriptLoader = (): ((
  host: XTimelineScriptHost
) => Promise<XTimelineWidgets>) => {
  let inFlight: Promise<XTimelineWidgets> | undefined

  return (host) => {
    const ready = host.readWidgets()
    if (ready) return Promise.resolve(ready)
    if (inFlight) return inFlight

    inFlight = new Promise((resolve, reject) => {
      const existingScript = host.document.querySelector(`script[src="${X_TIMELINE_SCRIPT_SRC}"]`)
      const script = existingScript ?? host.document.createElement('script')
      const handleLoad = () => {
        const widgets = host.readWidgets()
        if (widgets) {
          resolve(widgets)
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
        host.document.head.append(script)
      }
    })

    return inFlight
  }
}

const loadBrowserXTimelineScript = createXTimelineScriptLoader()

/**
 * ブラウザの文書へ widgets.js を読み込む。
 *
 * @returns 読み込み済みのXウィジェットAPI。
 */
export const loadXTimelineScriptInBrowser = (): Promise<XTimelineWidgets> =>
  loadBrowserXTimelineScript({
    document: {
      querySelector: (selector) =>
        document.querySelector<HTMLScriptElement>(selector) as XTimelineScriptElement | null,
      createElement: (tagName) =>
        document.createElement(tagName) as unknown as XTimelineScriptElement,
      head: {
        append: (node) => {
          document.head.append(node as unknown as Node)
        },
      },
    },
    readWidgets: () => window.twttr,
  })
