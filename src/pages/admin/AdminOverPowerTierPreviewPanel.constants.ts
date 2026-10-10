import type { OverPowerColorTier } from '../../utils/overPowerColorTier'

/** OVER POWER数値色の確認画面で並べる段階ごとのサンプル */
export const OVER_POWER_TIER_PREVIEW_SAMPLES: readonly {
  tier: OverPowerColorTier
  percent: number
  value: number
}[] = [
  { tier: 'white', percent: 65, value: 12_345.678 },
  { tier: 'silver', percent: 75, value: 14_243.475 },
  { tier: 'gold', percent: 85, value: 16_142.605 },
  { tier: 'platinum', percent: 92, value: 17_471.966 },
  { tier: 'rainbow', percent: 97, value: 18_421.534 },
]

/** OVER POWER数値色の確認画面の文言 */
export const ADMIN_OVER_POWER_TIER_PREVIEW_COPY = {
  surfaceHeading: 'テーマ背景',
  possessionHeading: 'ポゼッション背景',
} as const
