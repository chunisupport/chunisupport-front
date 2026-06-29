import { saveStandardRecordFilterSetting } from '../../../repositories/viewSettingsRepository'
import type { GoalDTO } from '../../../types/api'
import { buildUserProfilePagePath } from '../../users/UserPage/profilePageQuery'
import { buildGoalRecordFilter } from '../utils/goalRecordFilter'
import type { GoalsListData } from './goalsListResource'

/**
 * 目標の未達成条件を通常レコード画面用フィルターとして保存し、遷移先パスを返す。
 *
 * @param data - 目標一覧画面で取得済みのデータ。
 * @param goal - フィルターへ変換する目標。
 * @returns 通常レコード画面の遷移先パス。
 */
export const saveGoalRecordFilterAndBuildPath = async (
  data: GoalsListData,
  goal: GoalDTO
): Promise<string> => {
  const filter = buildGoalRecordFilter(goal, data.masterData, data.versions)
  await saveStandardRecordFilterSetting(filter)
  return buildUserProfilePagePath(data.username, 'record_normal')
}
