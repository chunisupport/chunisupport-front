import type {
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../types/api'
import { isExplicitEmptyGoalAttribute, normalizeGoalAttributeIds } from './goalAttributes'
import { buildGoalVersionNameMap } from './goalVersion'

// ID(code) -> 表示名の辞書。将来は言語キーを増やすだけでi18n対応できる
export const GOAL_ACHIEVEMENT_TYPE_LABELS = {
  ja: {
    rank_count: 'ランク達成数',
    score_count: 'スコア達成数',
    avg_score: '平均スコア',
    hardlamp_count: 'ハードランプ達成数',
    combolamp_count: 'FC/AJ達成数',
    total_score: 'トータルハイスコア',
    overpower_value: 'OVER POWER',
    overpower_percent: 'OVER POWER達成率',
  } satisfies Record<GoalAchievementType, string>,
}

type GoalRequest = GoalCreateRequest | GoalUpdateRequest

export const buildGoalPayload = (goal: GoalDTO): GoalRequest => ({
  title: goal.title,
  achievement_type: goal.achievement_type,
  achievement_params: goal.achievement_params,
  attributes: goal.attributes,
  invert: goal.invert,
})

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

export const formatGoalTypeLabel = (type: GoalAchievementType): string =>
  resolveGoalAchievementTypeLabel(type)

/**
 * 目標条件をユーザー向けの要約テキストへ変換する。
 *
 * @param attributes - 目標に設定された対象条件。
 * @param masterData - 難易度・ジャンルなどのマスタデータ。
 * @param versions - version API から返されたバージョン一覧。
 * @returns 条件の要約テキスト。
 */
export const formatGoalAttributesLabel = (
  attributes: GoalAttributes,
  masterData: MasterDataDTO,
  versions: VersionDTO[]
): string => {
  const parts: string[] = []

  const formatNames = (ids: number[], namesById: Map<number, string>): string =>
    ids.map((id) => namesById.get(id) ?? String(id)).join(', ')

  const diffIds = normalizeGoalAttributeIds(attributes.diff)
  const genreIds = normalizeGoalAttributeIds(attributes.genre)
  const versionIds = normalizeGoalAttributeIds(attributes.ver)

  const difficultyNameMap = new Map(masterData.difficulties.map((item) => [item.id, item.name]))
  const genreNameMap = new Map(masterData.genres.map((item) => [item.id, item.name]))
  const versionNameMap = buildGoalVersionNameMap(versions)

  if (attributes.chart_target === 'OP_TARGET') {
    parts.push('対象: OP対象')
  }

  if (isExplicitEmptyGoalAttribute(attributes.diff)) {
    parts.push('難易度: 選択なし')
  } else if (diffIds.length > 0) {
    parts.push(`難易度: ${formatNames(diffIds, difficultyNameMap)}`)
  }

  if (typeof attributes.const?.min === 'number' || typeof attributes.const?.max === 'number') {
    parts.push(`定数: ${attributes.const?.min ?? '-'} ～ ${attributes.const?.max ?? '-'}`)
  }

  if (isExplicitEmptyGoalAttribute(attributes.genre)) {
    parts.push('ジャンル: 選択なし')
  } else if (genreIds.length > 0) {
    parts.push(`ジャンル: ${formatNames(genreIds, genreNameMap)}`)
  }

  if (isExplicitEmptyGoalAttribute(attributes.ver)) {
    parts.push('バージョン: 選択なし')
  } else if (versionIds.length > 0) {
    parts.push(`バージョン: ${formatNames(versionIds, versionNameMap)}`)
  }

  return parts.length > 0 ? parts.join(' / ') : '条件なし（全譜面）'
}
