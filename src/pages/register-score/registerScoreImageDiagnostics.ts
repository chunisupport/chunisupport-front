/** SnapDOM診断で要素の種類を識別する属性名。 */
export const REGISTER_SCORE_DEBUG_TARGET_ATTRIBUTE = 'data-snapdom-debug-target'

type RegisterScoreDiagnosticRect = {
  width: number
  height: number
  x: number
  y: number
}

export type RegisterScoreElementDiagnostic = {
  source: string
  target: string
  index: number
  tagName: string
  text: string
  className: string
  offsetWidth: number
  offsetHeight: number
  clientWidth: number
  clientHeight: number
  scrollWidth: number
  scrollHeight: number
  rect: RegisterScoreDiagnosticRect
  textRects: RegisterScoreDiagnosticRect[]
  style: Record<string, string>
}

export type RegisterScoreSvgElementDiagnostic = {
  target: string
  index: number
  tagName: string
  text: string
  className: string
  inlineStyle: string
  pinnedStyle: Record<string, string>
}

const DIAGNOSTIC_STYLE_PROPERTIES = [
  'display',
  'box-sizing',
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'flex-basis',
  'flex-grow',
  'flex-shrink',
  'grid-template-columns',
  'overflow',
  'overflow-x',
  'overflow-y',
  'text-overflow',
  'white-space',
  'word-break',
  'overflow-wrap',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-size-adjust',
  '-webkit-text-size-adjust',
  'transform',
] as const

const SVG_PINNED_STYLE_PROPERTIES = [
  'box-sizing',
  'width',
  'height',
  'min-width',
  'max-width',
  'white-space',
  'font-family',
  'font-size',
  'line-height',
] as const

/**
 * DOMRectをJSONへ保存できる単純なオブジェクトへ変換する。
 *
 * @param rect - ブラウザが返した要素または文字列の矩形。
 * @returns 小数第3位までに丸めた矩形。
 */
const serializeRect = (rect: DOMRect | DOMRectReadOnly): RegisterScoreDiagnosticRect => ({
  width: Number(rect.width.toFixed(3)),
  height: Number(rect.height.toFixed(3)),
  x: Number(rect.x.toFixed(3)),
  y: Number(rect.y.toFixed(3)),
})

/**
 * 要素内テキストが実際に占有する行ごとの矩形を取得する。
 *
 * @param element - 測定対象の要素。
 * @returns Range APIが返した文字領域の矩形一覧。
 */
const collectTextRects = (element: Element): RegisterScoreDiagnosticRect[] => {
  if (!element.textContent) {
    return []
  }

  const range = document.createRange()
  range.selectNodeContents(element)
  const rects = Array.from(range.getClientRects(), serializeRect)
  range.detach()
  return rects
}

/**
 * 指定したCSSプロパティの算出値を診断用オブジェクトへまとめる。
 *
 * @param style - 対象要素の算出済みスタイル。
 * @returns レイアウトと文字描画に関係するCSS値。
 */
const collectComputedStyle = (style: CSSStyleDeclaration): Record<string, string> =>
  Object.fromEntries(
    DIAGNOSTIC_STYLE_PROPERTIES.map((property) => [property, style.getPropertyValue(property)])
  )

/**
 * 診断属性を持つ要素の寸法、文字領域、算出済みCSSを収集する。
 *
 * @param root - 診断対象を含むDOMルート。
 * @param source - JSON上で測定時点を識別する名前。
 * @returns 診断属性を持つ全要素の測定結果。
 */
export const collectRegisterScoreElementDiagnostics = (
  root: Element,
  source: string
): RegisterScoreElementDiagnostic[] => {
  const selector = `[${REGISTER_SCORE_DEBUG_TARGET_ATTRIBUTE}]`
  const elements = [
    ...(root.matches(selector) ? [root] : []),
    ...Array.from(root.querySelectorAll(selector)),
  ]

  return elements.map((element, index) => {
    const htmlElement = element as HTMLElement

    return {
      source,
      target: element.getAttribute(REGISTER_SCORE_DEBUG_TARGET_ATTRIBUTE) ?? 'unknown',
      index,
      tagName: element.tagName.toLowerCase(),
      text: element.textContent?.trim() ?? '',
      className: element.getAttribute('class') ?? '',
      offsetWidth: htmlElement.offsetWidth,
      offsetHeight: htmlElement.offsetHeight,
      clientWidth: htmlElement.clientWidth,
      clientHeight: htmlElement.clientHeight,
      scrollWidth: htmlElement.scrollWidth,
      scrollHeight: htmlElement.scrollHeight,
      rect: serializeRect(element.getBoundingClientRect()),
      textRects: collectTextRects(element),
      style: collectComputedStyle(getComputedStyle(element)),
    }
  })
}

/**
 * data URLからUTF-8のSVG文字列を復元する。
 *
 * @param dataUrl - SnapDOMのtoRaw()が返したSVG data URL。
 * @returns 復元したSVG文字列。
 */
const decodeSvgDataUrl = (dataUrl: string): string => {
  const separatorIndex = dataUrl.indexOf(',')
  const metadata = dataUrl.slice(0, separatorIndex)
  const payload = dataUrl.slice(separatorIndex + 1)

  if (metadata.endsWith(';base64')) {
    const binary = atob(payload)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }

  return decodeURIComponent(payload)
}

/**
 * SnapDOMが生成したSVG内の診断要素から、reconcileが固定したスタイルを抽出する。
 *
 * @param dataUrl - SnapDOMのtoRaw()が返したSVG data URL。
 * @returns SVGの概要と診断要素へ設定されたインラインスタイル。
 */
export const inspectRegisterScoreSnapdomSvg = (
  dataUrl: string
): {
  rawDataUrlLength: number
  decodedSvgLength: number
  parserError: string | null
  fontFaceCount: number
  embeddedFontDataUrlCount: number
  elements: RegisterScoreSvgElementDiagnostic[]
} => {
  const svg = decodeSvgDataUrl(dataUrl)
  const documentNode = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const parserError = documentNode.querySelector('parsererror')?.textContent?.trim() ?? null
  const elements = Array.from(
    documentNode.querySelectorAll(`[${REGISTER_SCORE_DEBUG_TARGET_ATTRIBUTE}]`)
  )

  return {
    rawDataUrlLength: dataUrl.length,
    decodedSvgLength: svg.length,
    parserError,
    fontFaceCount: (svg.match(/@font-face/gu) ?? []).length,
    embeddedFontDataUrlCount: (svg.match(/data:font\//gu) ?? []).length,
    elements: elements.map((element, index) => {
      const inlineStyle = element.getAttribute('style') ?? ''
      const style = (element as HTMLElement).style

      return {
        target: element.getAttribute(REGISTER_SCORE_DEBUG_TARGET_ATTRIBUTE) ?? 'unknown',
        index,
        tagName: element.tagName.toLowerCase(),
        text: element.textContent?.trim() ?? '',
        className: element.getAttribute('class') ?? '',
        inlineStyle,
        pinnedStyle: Object.fromEntries(
          SVG_PINNED_STYLE_PROPERTIES.map((property) => [
            property,
            style.getPropertyValue(property),
          ])
        ),
      }
    }),
  }
}

/**
 * スマートフォン固有の表示条件と読み込み済みフォントを収集する。
 *
 * @returns ビューポート、端末倍率、文字サイズ調整、FontFaceSetの状態。
 */
export const collectRegisterScoreEnvironmentDiagnostics = (): {
  pageUrl: string
  userAgent: string
  viewport: Record<string, number | null>
  rootStyle: Record<string, string>
  bodyStyle: Record<string, string>
  fonts: Array<Record<string, string>>
} => {
  const rootStyle = getComputedStyle(document.documentElement)
  const bodyStyle = getComputedStyle(document.body)

  return {
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualViewportWidth: window.visualViewport?.width ?? null,
      visualViewportHeight: window.visualViewport?.height ?? null,
      visualViewportScale: window.visualViewport?.scale ?? null,
    },
    rootStyle: {
      fontFamily: rootStyle.fontFamily,
      fontSize: rootStyle.fontSize,
      textSizeAdjust: rootStyle.getPropertyValue('text-size-adjust'),
      webkitTextSizeAdjust: rootStyle.getPropertyValue('-webkit-text-size-adjust'),
    },
    bodyStyle: {
      fontFamily: bodyStyle.fontFamily,
      fontSize: bodyStyle.fontSize,
      textSizeAdjust: bodyStyle.getPropertyValue('text-size-adjust'),
      webkitTextSizeAdjust: bodyStyle.getPropertyValue('-webkit-text-size-adjust'),
    },
    fonts: Array.from(document.fonts).map((font) => ({
      family: font.family,
      status: font.status,
      style: font.style,
      weight: font.weight,
    })),
  }
}
