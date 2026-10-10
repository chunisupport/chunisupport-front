/** OVER POWER達成率に応じた数値の色段階。 */
export type OverPowerColorTier = 'white' | 'silver' | 'gold' | 'platinum' | 'rainbow'

/** 色段階ごとの下限達成率（%）。上位の段階から順に判定する。 */
const OVER_POWER_COLOR_TIER_THRESHOLDS: readonly {
  tier: Exclude<OverPowerColorTier, 'white'>
  minPercent: number
}[] = [
  { tier: 'rainbow', minPercent: 95 },
  { tier: 'platinum', minPercent: 90 },
  { tier: 'gold', minPercent: 80 },
  { tier: 'silver', minPercent: 70 },
]

/**
 * 色付けする段階ごとに数値の文字色として付与するCSSクラス。
 * 白段階は通常の文字色のまま表示するため含めない。影は `over-power-tier` で別要素に付与する。
 */
const OVER_POWER_COLOR_TIER_CLASSES: Record<Exclude<OverPowerColorTier, 'white'>, string> = {
  silver: 'over-power-tier--silver',
  gold: 'over-power-tier--gold',
  platinum: 'over-power-tier--platinum',
  rainbow: 'over-power-tier--rainbow',
}

/**
 * OVER POWER達成率から数値の色段階を判定する。
 *
 * @param percent 理論値に対するOVER POWERの達成率（0〜100）。
 * @returns 達成率に対応する色段階。
 */
export const getOverPowerColorTier = (percent: number): OverPowerColorTier =>
  OVER_POWER_COLOR_TIER_THRESHOLDS.find((threshold) => percent >= threshold.minPercent)?.tier ??
  'white'

/**
 * OVER POWER達成率に対応する数値の色付けクラスを返す。
 *
 * @param percent 理論値に対するOVER POWERの達成率（0〜100）。
 * @returns 色段階に対応するCSSクラス文字列。白段階は色付けしないため undefined。
 */
export const getOverPowerColorTierClass = (percent: number): string | undefined => {
  const tier = getOverPowerColorTier(percent)
  return tier === 'white' ? undefined : OVER_POWER_COLOR_TIER_CLASSES[tier]
}
