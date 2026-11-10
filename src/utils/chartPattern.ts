/** Chart.jsの斜線背景生成に必要な描画設定 */
export type ChartStripePatternOptions = {
  baseColor: string
  stripeColor: string
  stripeWidth: number
  period: number
}

/**
 * Chart.jsの描画領域全体を覆う45度の斜線パターンを生成する。
 *
 * @param context パターンを生成する描画先Canvasコンテキスト。
 * @param width パターンの描画幅。
 * @param height パターンの描画高さ。
 * @param options 下地色、縞色、縞幅、周期。
 * @returns Chart.jsの背景色として利用するCanvasPattern。生成できない場合は下地色。
 */
export const createChartStripePattern = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: ChartStripePatternOptions
): CanvasPattern | string => {
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = Math.ceil(width)
  patternCanvas.height = Math.ceil(height)
  const patternContext = patternCanvas.getContext('2d')
  if (!patternContext) return options.baseColor

  patternContext.fillStyle = options.baseColor
  patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height)
  patternContext.strokeStyle = options.stripeColor
  patternContext.lineWidth = options.stripeWidth

  const offsetStep = options.period * Math.SQRT2
  for (let offset = -patternCanvas.height; offset < patternCanvas.width; offset += offsetStep) {
    patternContext.beginPath()
    patternContext.moveTo(offset, 0)
    patternContext.lineTo(offset + patternCanvas.height, patternCanvas.height)
    patternContext.stroke()
  }

  return context.createPattern(patternCanvas, 'no-repeat') ?? options.baseColor
}
