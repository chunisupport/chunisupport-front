/** DOM画像化時にCanvasの一辺へ許容する最大CSSピクセル数。 */
const DEFAULT_IMAGE_CAPTURE_MAX_CSS_SIDE = 8_000
/** ダウンロード開始後にObject URLを解放するまでの待機時間。 */
const IMAGE_OBJECT_URL_REVOKE_DELAY_MS = 1_000

type ImageCaptureOptions = {
  /** PNGへ出力するときのデバイスピクセル比。 */
  pixelRatio: number
  /** 画像化用DOMの一辺へ許容する最大CSSピクセル数。 */
  maxCssSide?: number
}

type ImageCaptureTarget = {
  /** SnapDOMへ渡す、画面表示用transformを持たない要素。 */
  element: HTMLDivElement
  /** 画像化用に追加した一時DOMを破棄する処理。 */
  dispose: () => void
}

/**
 * 元要素をCanvas上限内へ収めるための縮小率を計算する。
 *
 * @param width - 元要素の論理幅。
 * @param height - 元要素の論理高さ。
 * @param maxCssSide - 許容する最大CSSピクセル数。
 * @returns 1以下の画像化用縮小率。
 */
export const calculateImageCaptureScale = (
  width: number,
  height: number,
  maxCssSide: number = DEFAULT_IMAGE_CAPTURE_MAX_CSS_SIDE
): number => Math.min(1, maxCssSide / width, maxCssSide / height)

/**
 * 画像化対象を祖先の表示用transformから切り離し、固定寸法で複製する。
 *
 * @param sourceElement - 画面に表示中の画像化対象。
 * @param maxCssSide - 画像化用DOMの一辺へ許容する最大CSSピクセル数。
 * @returns 画像化対象の複製と破棄処理。
 */
const createImageCaptureTarget = (
  sourceElement: HTMLElement,
  maxCssSide: number
): ImageCaptureTarget => {
  const sourceWidth = sourceElement.offsetWidth
  const sourceHeight = sourceElement.offsetHeight
  const captureScale = calculateImageCaptureScale(sourceWidth, sourceHeight, maxCssSide)
  const captureHost = document.createElement('div')
  const captureElement = document.createElement('div')
  const sourceClone = sourceElement.cloneNode(true) as HTMLElement

  Object.assign(captureHost.style, {
    left: '-100000px',
    pointerEvents: 'none',
    position: 'fixed',
    top: '0',
  })
  Object.assign(captureElement.style, {
    height: `${Math.ceil(sourceHeight * captureScale)}px`,
    overflow: 'hidden',
    width: `${Math.ceil(sourceWidth * captureScale)}px`,
  })
  Object.assign(sourceClone.style, {
    maxWidth: 'none',
    transform: `scale(${captureScale})`,
    transformOrigin: 'top left',
    width: `${sourceWidth}px`,
  })
  captureHost.setAttribute('aria-hidden', 'true')
  captureElement.appendChild(sourceClone)
  captureHost.appendChild(captureElement)
  document.body.appendChild(captureHost)

  return {
    element: captureElement,
    dispose: () => captureHost.remove(),
  }
}

/**
 * 要素内の読み込み済み画像がデコード可能になるまで待つ。
 *
 * @param element - 画像を含む画像化対象。
 * @returns すべての画像のデコード試行が完了したときに解決されるPromise。
 */
const waitForElementImages = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'))
  await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
}

/**
 * 表示中のDOM要素をテーマと埋め込みフォントを維持したPNGへ変換する。
 *
 * @param sourceElement - PNGへ変換する表示中のDOM要素。
 * @param options - 出力ピクセル比とCanvas上限。
 * @returns 生成したPNG Blob。
 */
export const captureElementAsPng = async (
  sourceElement: HTMLElement,
  options: ImageCaptureOptions
): Promise<Blob> => {
  await Promise.all([document.fonts.ready, waitForElementImages(sourceElement)])
  const capture = createImageCaptureTarget(
    sourceElement,
    options.maxCssSide ?? DEFAULT_IMAGE_CAPTURE_MAX_CSS_SIDE
  )

  try {
    const { snapdom } = await import('@zumer/snapdom')
    const captureResult = await snapdom(capture.element, {
      backgroundColor: getComputedStyle(sourceElement).backgroundColor,
      dpr: options.pixelRatio,
      embedFonts: true,
      format: 'png',
      reconcile: true,
    })
    const rasterizeOptions = {
      dpr: options.pixelRatio,
      type: 'png' as const,
    }

    // ChromeがSVG内の埋め込みフォントを初回描画で準備するため、1回目は破棄する。
    await captureResult.toBlob(rasterizeOptions)
    return captureResult.toBlob(rasterizeOptions)
  } finally {
    capture.dispose()
  }
}

/**
 * Blobを指定ファイル名でダウンロードする。
 *
 * @param blob - ダウンロードするファイル内容。
 * @param filename - ダウンロード時に使用する拡張子付きファイル名。
 * @returns なし。
 */
export const downloadBlobFile = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = objectUrl
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), IMAGE_OBJECT_URL_REVOKE_DELAY_MS)
}
