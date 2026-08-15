/** 画面内に収める対象の矩形サイズ。 */
export type TooltipSize = {
  width: number
  height: number
}

/** ツールチップの基準になるCanvas矩形。 */
export type TooltipCanvasRect = {
  left: number
  top: number
}

/** ツールチップを収める表示領域サイズ。 */
export type TooltipViewport = {
  width: number
  height: number
}

/** 画面内に補正したツールチップ座標。 */
export type TooltipPosition = {
  left: number
  top: number
}

/**
 * Chart.jsのcaret座標から、画面内に収まるfixed配置のツールチップ座標を計算する。
 *
 * @param caret - Canvas内におけるツールチップの基準座標。
 * @param canvasRect - viewport基準のCanvas矩形。
 * @param tooltipSize - 表示するツールチップのサイズ。
 * @param viewport - ツールチップを収める表示領域サイズ。
 * @param padding - 画面端から確保する余白。
 * @param gap - 点とツールチップの間隔。
 * @returns 画面内に補正したfixed配置座標。
 */
export const resolveViewportTooltipPosition = (
  caret: TooltipPosition,
  canvasRect: TooltipCanvasRect,
  tooltipSize: TooltipSize,
  viewport: TooltipViewport,
  padding: number,
  gap: number
): TooltipPosition => {
  const anchorLeft = canvasRect.left + caret.left
  const anchorTop = canvasRect.top + caret.top
  const maxLeft = Math.max(padding, viewport.width - tooltipSize.width - padding)
  const maxTop = Math.max(padding, viewport.height - tooltipSize.height - padding)
  const preferredTop = anchorTop - tooltipSize.height - gap
  const visibleTop = preferredTop < padding ? anchorTop + gap : preferredTop

  return {
    left: Math.min(Math.max(anchorLeft - tooltipSize.width / 2, padding), maxLeft),
    top: Math.min(Math.max(visibleTop, padding), maxTop),
  }
}
