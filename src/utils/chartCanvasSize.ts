/**
 * 物理ピクセル数を整数とみなす許容誤差。
 * ブラウザのズーム時はデバイスピクセル比がfloat32由来の値（例: 1.100000023841858）になるため、
 * Chart.jsの0.1px丸めで吸収される範囲より十分小さい値で判定する。
 */
const DEVICE_PIXEL_TOLERANCE = 0.01

/** 条件を満たす長さを探すときに切り詰める物理ピクセル数の上限。 */
const MAX_DEVICE_PIXEL_TRIM = 100

/**
 * Chart.jsと同じく長さを0.1px単位へ丸める。
 * @param value 丸める長さ。
 * @returns 0.1px単位へ丸めた長さ。
 */
const roundToTenth = (value: number): number => Math.round(value * 10) / 10

/**
 * Chart.jsのcanvasを引き伸ばしなしで表示できるCSS上の長さを求める。
 *
 * Chart.jsは表示サイズを0.1px単位へ丸め、canvasの内部解像度は整数へ切り捨てられる。
 * 両者の物理ピクセル数がずれるとブラウザがcanvas全体を拡大縮小してぼやけるため、
 * 0.1px単位で表せて、かつ物理ピクセル数が整数になる長さを利用可能な長さ以下から探す。
 *
 * @param cssLength 利用可能なCSS上の長さ。
 * @param devicePixelRatio 表示中の画面のデバイスピクセル比。
 * @returns 物理ピクセルへ揃えたCSS上の長さ。条件を満たす長さがなければ0.1px単位で切り捨てた長さ。
 */
export const snapChartCanvasLength = (cssLength: number, devicePixelRatio: number): number => {
  const maxDevicePixels = Math.floor(cssLength * devicePixelRatio + DEVICE_PIXEL_TOLERANCE)

  for (let trim = 0; trim <= MAX_DEVICE_PIXEL_TRIM && maxDevicePixels - trim > 0; trim++) {
    const devicePixels = maxDevicePixels - trim
    const snappedLength = roundToTenth(devicePixels / devicePixelRatio)
    if (Math.abs(snappedLength * devicePixelRatio - devicePixels) < DEVICE_PIXEL_TOLERANCE) {
      return snappedLength
    }
  }

  return Math.max(0, Math.floor(cssLength * 10) / 10)
}
