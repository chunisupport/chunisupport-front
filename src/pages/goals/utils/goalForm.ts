import type { GoalAchievementType } from '../../../types/api'

/** 目標達成種別のコードに対応する日本語表示名。 */
export const GOAL_ACHIEVEMENT_TYPE_LABELS = {
  ja: {
    rank_count: 'ランク達成数',
    score_count: 'スコア達成数',
    rating_count: '単曲レート達成数',
    avg_score: '平均スコア',
    hardlamp_count: 'ハードランプ達成数',
    combolamp_count: 'FC/AJ達成数',
    fullchain_count: 'FULL CHAIN達成数',
    rainbow_count: '虹枠 (曲毎AJ) 達成楽曲数',
    total_score: 'トータルハイスコア',
    overpower_value: 'OVER POWER',
    overpower_percent: 'OVER POWER達成率',
  } satisfies Record<GoalAchievementType, string>,
}

export const resolveGoalAchievementTypeLabel = (
  code: string,
  options?: {
    locale?: keyof typeof GOAL_ACHIEVEMENT_TYPE_LABELS
    fallbackLabel?: string
  }
): string => {
  const locale = options?.locale ?? 'ja'
  const localized = GOAL_ACHIEVEMENT_TYPE_LABELS[locale] as Record<string, string>
  return localized[code] ?? options?.fallbackLabel ?? code
}
