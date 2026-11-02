import type { JSX } from 'solid-js'
import { render } from 'solid-js/web'
import { captureElementAsImage } from './domImageCapture'

/**
 * 画像化専用のDOMを画面外へ一時的に描画し、ラスター画像へ変換する。
 *
 * 描画内容のルート要素を画像化し、完了・失敗にかかわらずSolidの描画ルートと一時DOMを破棄する。
 *
 * @param width - 画面外へ逃がすための描画内容の論理幅。
 * @param renderContent - 画像化するルート要素を1つ返す描画処理。
 * @param options - `captureElementAsImage` へ渡す出力形式とピクセル比など。
 * @returns 生成した画像Blob。
 */
export const captureOffscreenRenderedImage = async (
  width: number,
  renderContent: () => JSX.Element,
  options: Parameters<typeof captureElementAsImage>[1]
): Promise<Blob> => {
  const host = document.createElement('div')
  host.className = 'pointer-events-none fixed top-0'
  host.style.left = `${-width}px`
  host.setAttribute('aria-hidden', 'true')
  host.inert = true
  document.body.appendChild(host)
  let dispose: (() => void) | undefined

  try {
    dispose = render(renderContent, host)
    const content = host.firstElementChild
    if (!(content instanceof HTMLElement)) throw new Error('Offscreen capture content is missing')
    return await captureElementAsImage(content, options)
  } finally {
    dispose?.()
    host.remove()
  }
}
