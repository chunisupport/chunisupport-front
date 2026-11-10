import type { JSX } from 'solid-js'
import { onCleanup, onMount } from 'solid-js'
import { snapChartCanvasLength } from '../../utils/chartCanvasSize'

type ChartCanvasFrameProps = {
  /** 枠の大きさを決めるクラス。canvasはこの枠の内側に収まる。 */
  class: string
  /** Chart.jsを描画するcanvas。 */
  children: JSX.Element
}

/**
 * Chart.jsのcanvasを物理ピクセルへ揃えた大きさで表示する枠。
 *
 * 枠の大きさに端数があるとcanvasが引き伸ばされてぼやけるため、
 * 内側の描画領域を物理ピクセルへ揃えた大きさに固定する。
 *
 * @param props 枠の大きさを決めるクラスと、描画するcanvas。
 * @returns canvasを包む枠要素。
 */
export const ChartCanvasFrame = (props: ChartCanvasFrameProps) => {
  let frameRef!: HTMLDivElement
  let canvasAreaRef!: HTMLDivElement

  onMount(() => {
    let resolutionQuery: MediaQueryList | undefined

    // できるだけ早く最終的な大きさへ揃えるため、signalを介さずDOMへ直接反映する。
    // Chart.jsは描画領域の大きさの変化を自身のResizeObserverで検知して追従する。
    const updateSize = () => {
      const rect = frameRef.getBoundingClientRect()
      const ratio = window.devicePixelRatio
      canvasAreaRef.style.width = `${snapChartCanvasLength(rect.width, ratio)}px`
      canvasAreaRef.style.height = `${snapChartCanvasLength(rect.height, ratio)}px`
    }

    // 別の画面へウィンドウを移動したときなど、CSS上の大きさが変わらずにデバイスピクセル比だけ変わる場合に追従する。
    const watchDevicePixelRatio = () => {
      resolutionQuery?.removeEventListener('change', handleDevicePixelRatioChange)
      resolutionQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      resolutionQuery.addEventListener('change', handleDevicePixelRatioChange)
    }

    const handleDevicePixelRatioChange = () => {
      updateSize()
      watchDevicePixelRatio()
    }

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(frameRef)
    watchDevicePixelRatio()
    updateSize()

    onCleanup(() => {
      resizeObserver.disconnect()
      resolutionQuery?.removeEventListener('change', handleDevicePixelRatioChange)
    })
  })

  return (
    <div ref={frameRef} class={`relative ${props.class}`}>
      <div ref={canvasAreaRef} class="absolute top-0 left-0 h-full w-full">
        {props.children}
      </div>
    </div>
  )
}
