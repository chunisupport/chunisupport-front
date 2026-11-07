import { createSignal, type JSX, onCleanup, onMount } from 'solid-js'
import {
  REGISTER_SCORE_REPORT_WIDTH_CLASS,
  REGISTER_SCORE_STACK_MAX_WIDTH_CLASS,
} from './constants'

/**
 * 論理幅に固定した更新差分レポートを、表示領域が狭い場合だけ縮小して表示する。
 *
 * 外枠は表示幅と縮小後の高さだけを受け持ち、内側は論理幅を保ったまま `transform` で縮小する。
 * 画像化処理は子要素を `transform` のない複製から生成するため、縮小率は画像へ影響しない。
 * 論理サイズは `transform` の影響を受けない `offsetWidth` / `offsetHeight` で計測する。
 * 内側の要素は余白を持たないため、子要素にはmarginを持たない1つのブロック要素を渡すこと。
 *
 * @param props - 論理幅で表示する更新差分レポート。
 * @returns 表示幅に合わせて縮小したレポートの表示枠。
 */
export const RegisterScoreReportScaleFrame = (props: { children: JSX.Element }) => {
  const [scale, setScale] = createSignal(1)
  const [scaledHeight, setScaledHeight] = createSignal<number>()
  let frameRef!: HTMLDivElement
  let logicalSizeRef!: HTMLDivElement

  onMount(() => {
    /**
     * 論理幅のレポートを外枠の表示幅へ収める縮小率と占有高さを更新する。
     *
     * @returns なし。
     */
    const updateScale = () => {
      const nextScale = Math.min(1, frameRef.clientWidth / logicalSizeRef.offsetWidth)

      setScale(nextScale)
      setScaledHeight(logicalSizeRef.offsetHeight * nextScale)
    }

    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(frameRef)
    resizeObserver.observe(logicalSizeRef)
    updateScale()

    onCleanup(() => {
      resizeObserver.disconnect()
    })
  })

  return (
    <div
      ref={frameRef}
      class={`w-full ${REGISTER_SCORE_STACK_MAX_WIDTH_CLASS} overflow-hidden`}
      style={{ height: scaledHeight() ? `${scaledHeight()}px` : undefined }}
    >
      <div
        ref={logicalSizeRef}
        class={`${REGISTER_SCORE_REPORT_WIDTH_CLASS} origin-top-left`}
        style={{ transform: `scale(${scale()})` }}
      >
        {props.children}
      </div>
    </div>
  )
}
