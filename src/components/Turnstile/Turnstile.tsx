import { type Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js'

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileWidgetId = string

type TurnstileRenderOptions = {
  sitekey: string
  theme: 'auto'
  callback: (token: string) => void
  'expired-callback': () => void
  'timeout-callback': () => void
  'error-callback': (errorCode: string) => void
  'unsupported-callback': () => void
}

type TurnstileGlobal = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId
  reset: (widgetId: TurnstileWidgetId) => void
  remove: (widgetId: TurnstileWidgetId) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

type TurnstileProps = {
  siteKey: string
  resetKey: number
  class?: string
  onVerify: (token: string) => void
  onExpire: () => void
  onError: () => void
}

let turnstileScriptPromise: Promise<TurnstileGlobal> | undefined

/**
 * Cloudflare Turnstile のクライアントスクリプトをexplicit rendering用に読み込む。
 *
 * @returns 読み込み済みのTurnstileグローバルAPI。
 */
const loadTurnstileScript = (): Promise<TurnstileGlobal> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Turnstile can only be loaded in the browser.'))
  }
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }
  if (turnstileScriptPromise) {
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`
    )
    const script = existingScript ?? document.createElement('script')

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile)
        return
      }
      reject(new Error('Turnstile API is not available.'))
    }
    const handleError = () => reject(new Error('Failed to load Turnstile script.'))

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.setAttribute('fetchpriority', 'low')
      document.head.append(script)
    }
  })

  return turnstileScriptPromise
}

/**
 * Cloudflare Turnstile ウィジェットをSolidコンポーネント内で描画する。
 *
 * @param props Site Key、リセットキー、検証結果コールバックを含むプロパティ。
 * @returns Turnstileの描画先となるコンテナ要素。
 */
export const Turnstile: Component<TurnstileProps> = (props) => {
  let containerRef: HTMLDivElement | undefined
  const [widgetId, setWidgetId] = createSignal<TurnstileWidgetId | null>(null)
  let initialResetKey = props.resetKey

  onMount(() => {
    let disposed = false

    loadTurnstileScript()
      .then((turnstile) => {
        if (disposed || !containerRef) return

        const renderedWidgetId = turnstile.render(containerRef, {
          sitekey: props.siteKey,
          theme: 'auto',
          callback: props.onVerify,
          'expired-callback': props.onExpire,
          'timeout-callback': props.onExpire,
          'error-callback': props.onError,
          'unsupported-callback': props.onError,
        })
        setWidgetId(renderedWidgetId)
      })
      .catch(() => props.onError())

    onCleanup(() => {
      disposed = true
      const currentWidgetId = widgetId()
      if (currentWidgetId && window.turnstile) {
        window.turnstile.remove(currentWidgetId)
      }
    })
  })

  createEffect(() => {
    const resetKey = props.resetKey
    const currentWidgetId = widgetId()
    if (resetKey === initialResetKey || !currentWidgetId || !window.turnstile) return

    initialResetKey = resetKey
    window.turnstile.reset(currentWidgetId)
  })

  return <div ref={containerRef} class={props.class} />
}
