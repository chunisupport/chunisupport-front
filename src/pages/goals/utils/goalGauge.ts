/**
 * スタート位置からの達成率を丸める桁数。
 * 99.7 − 99.6 のような近い値どうしの差は浮動小数点誤差が目立ち、50% が 49.999…% になって
 * 小数第2位の切り捨て表示がずれるため、表示桁より十分細かい桁で丸める。
 */
const GAUGE_PERCENT_ROUNDING_DECIMAL_PLACES = 9
/** 達成率を {@link GAUGE_PERCENT_ROUNDING_DECIMAL_PLACES} 桁で丸めるための倍率。 */
const GAUGE_PERCENT_ROUNDING_FACTOR = 10 ** GAUGE_PERCENT_ROUNDING_DECIMAL_PLACES

/**
 * ゲージのスタート位置として実際に使う値を解決する。
 * 0以下、または目標値以上のスタート位置はゲージの幅を作れないため、従来どおり0から描く。
 * 楽曲の追加・削除で動的な目標値が下がった場合も、この扱いで表示を崩さない。
 *
 * @param gaugeStart - 目標に保存されたゲージのスタート位置。
 * @param target - 現在の目標値。
 * @returns ゲージ計算に使うスタート位置。
 */
export const resolveGoalGaugeStart = (gaugeStart: number, target: number): number =>
  gaugeStart > 0 && gaugeStart < target ? gaugeStart : 0

/**
 * スタート位置から目標値までを100%とした達成率を計算する。
 *
 * @param current - 現在値。
 * @param target - 目標値。
 * @param gaugeStart - 目標に保存されたゲージのスタート位置。0なら従来の達成率と同じ。
 * @returns 0以上の達成率。現在値がスタート位置を下回る場合は0、超過達成は100を超えたまま返す。
 */
export const calculateGoalGaugePercent = (
  current: number,
  target: number,
  gaugeStart: number
): number => {
  const start = resolveGoalGaugeStart(gaugeStart, target)
  if (start === 0) {
    const safeTarget = target <= 0 ? 1 : target
    const raw = (current / safeTarget) * 100
    return Number.isFinite(raw) ? Math.max(0, raw) : 0
  }

  const raw = ((current - start) / (target - start)) * 100
  const rounded = Math.round(raw * GAUGE_PERCENT_ROUNDING_FACTOR) / GAUGE_PERCENT_ROUNDING_FACTOR
  return Number.isFinite(rounded) ? Math.max(0, rounded) : 0
}
