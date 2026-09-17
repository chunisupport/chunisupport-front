import type { GoalAchievementType, GoalCreateRequest, GoalDTO } from '../../../types/api'
import { filterRatingReachableRecords } from '../../../utils/goalRatingCount'
import { calculateGoalOverPowerChartMax } from '../utils/goalOverPower'
import {
  calculateGoalProgress,
  filterRecordsByAttributes,
  type GoalOverPowerProgressContext,
  type GoalProgressResult,
} from '../utils/goalProgress'
import { calculateRainbowGoalProgress, filterRainbowTargetSongs } from '../utils/goalRainbow'
import type { GoalsListData } from './goalsListResource'

export interface GoalWithProgress {
  goal: GoalDTO
  progress: GoalProgressResult
}

const EMPTY_DRAFT_GOAL_PROGRESS: GoalProgressResult = {
  current: 0,
  target: 1,
  percent: 0,
  achieved: false,
  hasUnknownMaxOp: false,
}

/**
 * OVER POWER系の目標種別か判定する。
 *
 * @param achievementType - 判定対象の目標種別。
 * @returns OVER POWER合計または達成率の目標ならtrue。
 */
export const isOverPowerAchievementType = (
  achievementType: GoalAchievementType
): achievementType is 'overpower_value' | 'overpower_percent' =>
  achievementType === 'overpower_value' || achievementType === 'overpower_percent'

/**
 * 目標一覧データからOVER POWER進捗計算用の入力を作る。
 *
 * @param data - 目標一覧画面で取得済みのデータ。
 * @returns 未解禁曲設定を含むOVER POWER進捗計算用入力。
 */
const toOverPowerProgressContext = (data: GoalsListData): GoalOverPowerProgressContext => ({
  records: data.records,
  versions: data.versions,
  masterData: data.masterData,
  lockedSongs: data.lockedSongs,
})

/**
 * 保存済み目標一覧へ現在のプレイヤーレコードに基づく進捗を付与する。
 *
 * @param data - 目標一覧画面で取得済みのデータ。
 * @returns 目標と進捗を組にした一覧。
 */
export const buildGoalsWithProgress = (data: GoalsListData | undefined): GoalWithProgress[] => {
  if (!data) return []

  return data.goals.map((goal) => {
    if (goal.achievement_type === 'rainbow_count') {
      const targetSongs = filterRainbowTargetSongs(
        data.songs,
        goal.attributes,
        data.masterData,
        data.versions
      )
      return {
        goal,
        progress: calculateRainbowGoalProgress(goal, targetSongs, data.records),
      }
    }
    if (isOverPowerAchievementType(goal.achievement_type)) {
      return {
        goal,
        progress: calculateGoalProgress(
          goal,
          data.records,
          data.songs,
          toOverPowerProgressContext(data)
        ),
      }
    }
    const filtered = filterRecordsByAttributes(
      data.records,
      goal.attributes,
      data.masterData,
      data.songs,
      data.versions
    )
    const progress = calculateGoalProgress(goal, filtered, data.songs)
    return { goal, progress }
  })
}

/**
 * 指定した対象条件に一致する譜面数を取得する。
 *
 * @param data - 目標一覧画面で取得済みのデータ。
 * @param attributes - 件数を確認する対象条件。
 * @param achievementType - 集約単位を決める目標種別。虹枠では楽曲単位にする。
 * @param achievementParams - 到達可能譜面数の解決に使う成果パラメータ。
 * @returns 条件に一致する譜面数または楽曲数。
 */
export const resolveGoalAllCount = (
  data: GoalsListData | undefined,
  attributes: GoalCreateRequest['attributes'],
  achievementType?: GoalCreateRequest['achievement_type'],
  achievementParams?: GoalCreateRequest['achievement_params']
): number => {
  if (!data) return 0
  if (achievementType === 'rainbow_count') {
    return filterRainbowTargetSongs(data.songs, attributes, data.masterData, data.versions).length
  }
  const filteredRecords = filterRecordsByAttributes(
    data.records,
    attributes,
    data.masterData,
    data.songs,
    data.versions
  )
  if (achievementType === 'rating_count') {
    const rating = achievementParams && 'rating' in achievementParams ? achievementParams.rating : 0
    return filterRatingReachableRecords(filteredRecords, rating).length
  }
  return filteredRecords.length
}

/**
 * 指定した対象条件で到達可能なOVER POWER合計最大値を取得する。
 *
 * @param data - 目標一覧画面で取得済みのデータ。
 * @param attributes - 最大値を確認する対象条件。
 * @returns 譜面ごとの最大OVER POWER合計値。
 */
export const resolveGoalOverPowerChartMax = (
  data: GoalsListData | undefined,
  attributes: GoalCreateRequest['attributes']
): number => {
  if (!data) return 0

  return calculateGoalOverPowerChartMax(
    data.records,
    data.songs,
    attributes,
    data.versions,
    data.masterData,
    data.lockedSongs
  )
}

/**
 * 目標フォームの下書き内容から現在のプレイヤーレコードに基づく進捗を算出する。
 *
 * @param data - 目標一覧画面で取得済みのデータ。
 * @param draftGoal - フォーム入力中の目標内容。
 * @returns 実際の目標カードと同じ計算で作った進捗情報。
 */
export const resolveDraftGoalProgress = (
  data: GoalsListData | undefined,
  draftGoal: GoalCreateRequest
): GoalProgressResult => {
  if (!data) return EMPTY_DRAFT_GOAL_PROGRESS
  if (draftGoal.achievement_type === 'rainbow_count') {
    const targetSongs = filterRainbowTargetSongs(
      data.songs,
      draftGoal.attributes,
      data.masterData,
      data.versions
    )
    return calculateRainbowGoalProgress(
      { ...draftGoal, id: 0, sort_order: 0, created_at: '' },
      targetSongs,
      data.records
    )
  }

  const draftGoalDto = {
    ...draftGoal,
    id: 0,
    sort_order: 0,
    created_at: '',
  }

  if (isOverPowerAchievementType(draftGoal.achievement_type)) {
    return calculateGoalProgress(
      draftGoalDto,
      data.records,
      data.songs,
      toOverPowerProgressContext(data)
    )
  }

  const filtered = filterRecordsByAttributes(
    data.records,
    draftGoal.attributes,
    data.masterData,
    data.songs,
    data.versions
  )

  return calculateGoalProgress(draftGoalDto, filtered, data.songs)
}
