import type {
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
} from '../../../types/api'

export const GOAL_TYPE_LABELS: Record<GoalAchievementType, string> = {
  rank_count: 'ランク達成数',
  score_count: 'スコア達成数',
  avg_score: '平均スコア',
  hardlamp_count: 'ハードランプ達成数',
  combolamp_count: 'コンボランプ達成数',
  total_score: '総スコア',
  overpower_value: '総OVER POWER',
  overpower_percent: 'OVER POWER達成率',
}

export const HARD_LAMP_OPTIONS = [
  { value: 'HRD', label: 'HARD以上' },
  { value: 'BRV', label: 'BRAVE以上' },
  { value: 'ABS', label: 'ABSOLUTE以上' },
  { value: 'CTS', label: 'CATASTROPHY以上' },
] as const

export const COMBO_LAMP_OPTIONS = [
  { value: 'FC', label: 'FULL COMBO以上' },
  { value: 'AJ', label: 'ALL JUSTICE' },
] as const

type GoalRequest = GoalCreateRequest | GoalUpdateRequest

export const buildGoalPayload = (goal: GoalDTO): GoalRequest => ({
  title: goal.title,
  achievement_type: goal.achievement_type,
  achievement_params: goal.achievement_params,
  attributes: goal.attributes,
  invert: goal.invert,
})

export const formatGoalTypeLabel = (type: GoalAchievementType): string => GOAL_TYPE_LABELS[type] ?? type

export const formatGoalAttributesLabel = (
  attributes: GoalAttributes,
  masterData: MasterDataDTO
): string => {
  const parts: string[] = []

  if (typeof attributes.diff === 'number') {
    const diff = masterData.difficulties.find((item) => item.id === attributes.diff)
    parts.push(`難易度: ${diff?.name ?? attributes.diff}`)
  }

  if (typeof attributes.const?.min === 'number' || typeof attributes.const?.max === 'number') {
    parts.push(`定数: ${attributes.const?.min ?? '-'} ～ ${attributes.const?.max ?? '-'}`)
  }

  if (typeof attributes.genre === 'number') {
    const genre = masterData.genres.find((item) => item.id === attributes.genre)
    parts.push(`ジャンル: ${genre?.name ?? attributes.genre}`)
  }

  if (typeof attributes.ver === 'number') {
    const version = masterData.versions.find((item) => item.id === attributes.ver)
    parts.push(`バージョン: ${version?.name ?? attributes.ver}`)
  }

  return parts.length > 0 ? parts.join(' / ') : '条件なし（全譜面）'
}
