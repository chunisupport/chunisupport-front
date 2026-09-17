import type { TooltipModel } from 'chart.js'
import type { PlayerRecordDTO } from '../types/api'
import { formatChartConst } from './chartConstFormat'
import { resolveViewportTooltipPosition } from './chartTooltipPosition'
import { buildChunithmJacketUrl } from './jacket'
import { formatInteger } from './numberFormat'

const TOOLTIP_VIEWPORT_PADDING = 8
const TOOLTIP_POINT_GAP = 8
const TOOLTIP_JACKET_OPACITY = 0.2

/** 散布図で共用する外部ツールチップの外観 */
export const CHART_SCATTER_TOOLTIP_CLASS =
  'pointer-events-none fixed z-50 max-w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-sm opacity-0 shadow-lg transition-opacity'

/** 散布図の点から表示する譜面情報と表示行 */
export type ChartScatterTooltipContent = {
  record: PlayerRecordDTO
  detail?: string
}

/**
 * 譜面ジャケットを背景にした散布図ツールチップを更新する。
 *
 * @param tooltipElement - fixed配置で表示するツールチップ要素。
 * @param canvas - 点の位置を取得するCanvas要素。
 * @param tooltip - Chart.jsのツールチップ状態。
 * @param resolveContent - 点から譜面情報と追加行を取得する処理。
 * @returns なし。
 */
export const updateChartScatterTooltip = (
  tooltipElement: HTMLDivElement,
  canvas: HTMLCanvasElement,
  tooltip: TooltipModel<'scatter'>,
  resolveContent: (raw: unknown) => ChartScatterTooltipContent
): void => {
  if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
    tooltipElement.style.opacity = '0'
    return
  }

  const { record, detail } = resolveContent(tooltip.dataPoints[0].raw)
  tooltipElement.replaceChildren()

  const jacketUrl = buildChunithmJacketUrl(record.img)
  if (jacketUrl) {
    const backgroundElement = document.createElement('div')
    backgroundElement.className = 'pointer-events-none absolute inset-0 overflow-hidden'
    backgroundElement.setAttribute('aria-hidden', 'true')

    const imageElement = document.createElement('img')
    imageElement.src = jacketUrl
    imageElement.alt = ''
    imageElement.setAttribute('aria-hidden', 'true')
    imageElement.draggable = false
    imageElement.style.width = '100%'
    imageElement.style.height = '100%'
    imageElement.style.objectFit = 'cover'
    imageElement.style.objectPosition = 'center'
    imageElement.style.opacity = String(TOOLTIP_JACKET_OPACITY)
    imageElement.onerror = (): void => imageElement.remove()
    backgroundElement.append(imageElement)
    tooltipElement.append(backgroundElement)
  }

  const titleElement = document.createElement('div')
  titleElement.className = 'font-sans font-semibold text-text'
  titleElement.textContent = record.title

  const detailElement = document.createElement('div')
  detailElement.className = 'mt-1 text-text-muted'
  detailElement.textContent =
    detail ??
    `${record.difficulty} / 定数 ${formatChartConst(record.const)} / ${formatInteger(record.score)}`

  const contentElement = document.createElement('div')
  contentElement.className = 'relative'
  contentElement.append(titleElement, detailElement)
  tooltipElement.append(contentElement)

  const canvasRect = canvas.getBoundingClientRect()
  const tooltipRect = tooltipElement.getBoundingClientRect()
  const position = resolveViewportTooltipPosition(
    { left: tooltip.caretX, top: tooltip.caretY },
    { left: canvasRect.left, top: canvasRect.top },
    { width: tooltipRect.width, height: tooltipRect.height },
    { width: window.innerWidth, height: window.innerHeight },
    TOOLTIP_VIEWPORT_PADDING,
    TOOLTIP_POINT_GAP
  )

  tooltipElement.style.opacity = '1'
  tooltipElement.style.left = `${position.left}px`
  tooltipElement.style.top = `${position.top}px`
}
