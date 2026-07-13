/** Chart.js の色解決に使う既定色。 */
export const CHART_COLOR_FALLBACK = '#6b7280'

/**
 * CSSカスタムプロパティをCanvasで利用できる解決済みの色値へ変換する。
 *
 * @param variableName 取得対象のCSSカスタムプロパティ名。
 * @param fallback CSS変数を解決できない場合に返す既定色。
 * @returns Chart.jsへ渡せる解決済みのCSS色値。
 */
export const resolveChartColor = (
  variableName: string,
  fallback: string = CHART_COLOR_FALLBACK
): string => {
  const colorProbe = document.createElement('span')
  colorProbe.style.color = `var(${variableName}, ${fallback})`
  document.documentElement.append(colorProbe)

  const color = getComputedStyle(colorProbe).color || fallback
  colorProbe.remove()

  return color
}
