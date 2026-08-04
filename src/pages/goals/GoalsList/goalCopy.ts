import type { GoalCreateRequest, GoalDTO } from '../../../types/api'
import { GOAL_COPY_TITLE_SUFFIX, GOAL_TITLE_MAX_LENGTH } from './constants'

/**
 * Unicodeコードポイント単位の上限に収まる先頭部分を取得する。
 *
 * @param value - 切り詰める文字列。
 * @param maxLength - 許容するUnicodeコードポイント数。
 * @returns 上限に収まる文字列の先頭部分。
 */
const truncateByCodePoints = (value: string, maxLength: number): string =>
  Array.from(value).slice(0, maxLength).join('')

/**
 * 複製後の目標タイトルを文字数上限内で作る。
 *
 * @param title - 複製元の目標タイトル。
 * @returns 必要に応じて末尾を切り詰め、コピー表記を付けたタイトル。
 */
export const buildCopiedGoalTitle = (title: string): string => {
  const baseMaxLength = GOAL_TITLE_MAX_LENGTH - Array.from(GOAL_COPY_TITLE_SUFFIX).length
  return `${truncateByCodePoints(title, baseMaxLength)}${GOAL_COPY_TITLE_SUFFIX}`
}

/**
 * 保存済み目標から、同じグループへ追加する複製リクエストを作る。
 *
 * @param goal - 複製元の目標。
 * @returns IDや表示順を除き、タイトルへコピー表記を付けた作成リクエスト。
 */
export const buildGoalCopyRequest = (goal: GoalDTO): GoalCreateRequest => ({
  group_id: goal.group_id,
  title: buildCopiedGoalTitle(goal.title),
  achievement_type: goal.achievement_type,
  achievement_params: goal.achievement_params,
  attributes: goal.attributes,
  invert: goal.invert,
})
