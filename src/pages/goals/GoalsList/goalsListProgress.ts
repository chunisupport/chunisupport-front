import type { GoalCreateRequest, GoalDTO } from '../../../types/api'
import { calculateGoalOverPowerChartMax } from '../utils/goalOverPower'
import {
  calculateGoalProgress,
  filterRecordsByAttributes,
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
 * OP対象のOVER POWER目標で曲内最大値を使うべきか判定する。
 *
 * @param goal - 判定対象の目標。
 * @returns OP対象かつOVER POWER系の目標ならtrue。
 */
export const shouldUseOpTargetSongAggregation = (
  goal: Pick<GoalCreateRequest, 'achievement_type' | 'attributes'>
): boolean =>
  goal.attributes.chart_target === 'OP_TARGET' &&
  (goal.achievement_type === 'overpower_value' || goal.achievement_type === 'overpower_percent')

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
    const filtered = filterRecordsByAttributes(
      data.records,
      goal.attributes,
      data.masterData,
      data.songs,
      data.versions,
      { includeAllChartsForOpTarget: shouldUseOpTargetSongAggregation(goal) }
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
 * @returns 条件に一致する譜面数または楽曲数。
 */
export const resolveGoalAllCount = (
  data: GoalsListData | undefined,
  attributes: GoalCreateRequest['attributes'],
  achievementType?: GoalCreateRequest['achievement_type']
): number => {
  if (!data) return 0
  if (achievementType === 'rainbow_count') {
    return filterRainbowTargetSongs(data.songs, attributes, data.masterData, data.versions).length
  }
  return filterRecordsByAttributes(
    data.records,
    attributes,
    data.masterData,
    data.songs,
    data.versions
  ).length
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

  const filteredRecords = filterRecordsByAttributes(
    data.records,
    attributes,
    data.masterData,
    data.songs,
    data.versions,
    { includeAllChartsForOpTarget: attributes.chart_target === 'OP_TARGET' }
  )
  return calculateGoalOverPowerChartMax(filteredRecords, data.songs, attributes)
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
      { ...draftGoal, id: 0, created_at: '' },
      targetSongs,
      data.records
    )
  }

  const filtered = filterRecordsByAttributes(
    data.records,
    draftGoal.attributes,
    data.masterData,
    data.songs,
    data.versions,
    { includeAllChartsForOpTarget: shouldUseOpTargetSongAggregation(draftGoal) }
  )

  return calculateGoalProgress(
    {
      ...draftGoal,
      id: 0,
      created_at: '',
    },
    filtered,
    data.songs
  )
}
