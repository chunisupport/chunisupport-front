import { localizedCopy, t } from '../../../i18n'
import type {
  GoalAchievementType,
  GoalAttributes,
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  VersionDTO,
} from '../../../types/api'
import { normalizeGoalAttributeIds } from '../../../utils/goalAttributes'
import { buildGoalVersionNameMap } from '../../../utils/goalVersion'

/** 目標種別 (code) ごとの表示名 */
export const GOAL_ACHIEVEMENT_TYPE_LABELS: Readonly<Record<GoalAchievementType, string>> =
  localizedCopy('goals.achievementTypes')

type GoalRequest = GoalCreateRequest | GoalUpdateRequest
const NO_TARGET_CHARTS_LABEL = t('goals.summary.noTargetCharts')

/**
 * 保存済み目標から作成・更新APIへ送信できるペイロードを作る。
 *
 * @param goal - APIから取得した保存済み目標。
 * @returns レスポンス専用項目を除いた目標ペイロード。
 */
export const buildGoalPayload = (goal: GoalDTO): GoalRequest => ({
  group_id: goal.group_id,
  title: goal.title,
  achievement_type: goal.achievement_type,
  achievement_params: goal.achievement_params,
  attributes: goal.attributes,
  invert_value: goal.invert_value,
  invert_percentage: goal.invert_percentage,
})

/**
 * 目標種別の表示名を現在の表示言語で取得する。
 *
 * @param code - 目標種別のコード。
 * @param options - 未知のコードに使う代替表示名。
 * @returns 目標種別の表示名。
 */
export const resolveGoalAchievementTypeLabel = (
  code: string,
  options?: {
    fallbackLabel?: string
  }
): string =>
  (GOAL_ACHIEVEMENT_TYPE_LABELS as Readonly<Record<string, string>>)[code] ??
  options?.fallbackLabel ??
  code

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

  const formatNames = (ids: number[] | undefined, namesById: Map<number, string>): string =>
    ids?.map((id) => namesById.get(id) ?? String(id)).join(', ') ?? ''

  const diffIds = normalizeGoalAttributeIds(attributes.diff)
  const genreIds = normalizeGoalAttributeIds(attributes.genre)
  const versionIds = normalizeGoalAttributeIds(attributes.ver)
  const hasNoSelectedCharts =
    diffIds?.length === 0 || genreIds?.length === 0 || versionIds?.length === 0

  const difficultyNameMap = new Map(masterData.difficulties.map((item) => [item.id, item.name]))
  const genreNameMap = new Map(masterData.genres.map((item) => [item.id, item.name]))
  const versionNameMap = buildGoalVersionNameMap(versions)

  if (hasNoSelectedCharts) return NO_TARGET_CHARTS_LABEL

  if (attributes.chart_target === 'OP_TARGET') {
    parts.push(t('goals.summary.opTarget'))
  }

  if (attributes.chart_target !== 'OP_TARGET' && diffIds && diffIds.length > 0) {
    parts.push(t('goals.summary.difficulty', { names: formatNames(diffIds, difficultyNameMap) }))
  }

  if (typeof attributes.const?.min === 'number' || typeof attributes.const?.max === 'number') {
    parts.push(t('goals.summary.const', { min: attributes.const?.min ?? '-', max: attributes.const?.max ?? '-' }))
  }

  if (genreIds && genreIds.length > 0) {
    parts.push(t('goals.summary.genre', { names: formatNames(genreIds, genreNameMap) }))
  }

  if (versionIds && versionIds.length > 0) {
    parts.push(t('goals.summary.version', { names: formatNames(versionIds, versionNameMap) }))
  }

  return parts.length > 0 ? parts.join(' / ') : t('goals.summary.noConditions')
}
