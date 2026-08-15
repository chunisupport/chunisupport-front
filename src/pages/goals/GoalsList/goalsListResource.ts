import {
  createGoalGroup,
  deleteGoalGroup,
  fetchGoalGroups,
  reorderGoalGroups,
  updateGoalGroup,
} from '../../../api/goalGroups'
import { createGoal, deleteGoal, fetchGoals, reorderGoals, updateGoal } from '../../../api/goals'
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import { fetchMe, fetchUserProfileSummary } from '../../../api/users'
import type {
  GoalCreateRequest,
  GoalDTO,
  GoalGroupDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../types/api'
import { fetchAllSongsWithCache } from '../../../usecases/cache/fetchAllSongsWithCache'
import { fetchUserRecordWithCache } from '../../../usecases/cache/fetchUserRecordWithCache'
import { buildGoalCopyRequest } from './goalCopy'

export interface GoalsListData {
  username: string
  noPlayerData: boolean
  goals: GoalDTO[]
  groups: GoalGroupDTO[]
  songs: SongDTO[]
  masterData: MasterDataDTO
  versions: VersionDTO[]
  records: PlayerRecordDTO[]
}

/**
 * 目標一覧画面で必要なログインユーザー・目標・マスタ・レコードをまとめて取得する。
 *
 * @param onUnauthorized - 認証切れを検出したときの遷移処理。
 * @returns 目標一覧画面で参照するデータ一式。
 */
export const fetchGoalsListData = async (onUnauthorized: () => void): Promise<GoalsListData> => {
  const me = await fetchMe().catch((error: Error & { status?: number }) => {
    if (error?.status === 401) {
      onUnauthorized()
    }
    throw error
  })

  const [goalsResponse, groupsResponse, songsResponse, masterData, versionData, profile, record] =
    await Promise.all([
      fetchGoals(),
      fetchGoalGroups(),
      fetchAllSongsWithCache(),
      fetchMasterData(),
      fetchVersions(),
      fetchUserProfileSummary(me.username),
      fetchUserRecordWithCache(me.username),
    ])

  return {
    username: me.username,
    noPlayerData: !profile.player,
    goals: goalsResponse.goals,
    groups: groupsResponse.groups,
    songs: songsResponse.songs,
    masterData,
    versions: versionData.versions ?? [],
    records: profile.player ? record.standard : [],
  }
}

/**
 * 目標の作成または更新を実行する。
 *
 * @param editingGoal - 編集中の目標。未指定なら新規作成する。
 * @param payload - APIへ送信する目標内容。
 * @returns 保存APIの完了後に解決される Promise。
 */
export const saveGoalRequest = async (
  editingGoal: GoalDTO | undefined,
  payload: GoalCreateRequest | GoalUpdateRequest
): Promise<void> => {
  if (editingGoal) {
    await updateGoal(editingGoal.id, payload)
    return
  }
  await createGoal(payload)
}

/**
 * 指定した目標を同じグループへ複製する。
 *
 * @param goal - 複製元の目標。
 * @returns 作成された目標。
 */
export const copyGoalRequest = async (goal: GoalDTO): Promise<GoalDTO> =>
  createGoal(buildGoalCopyRequest(goal))

/**
 * 指定した目標を削除する。
 *
 * @param goal - 削除対象の目標。
 * @returns 削除APIの完了後に解決される Promise。
 */
export const deleteGoalRequest = async (goal: GoalDTO): Promise<void> => {
  await deleteGoal(goal.id)
}

/**
 * 指定したグループに属する全目標の表示順を保存する。
 *
 * @param groupId - 保存対象のグループID。未分類の場合はnull。
 * @param goals - 保存する表示順で並んだ目標。
 * @returns 並び順の保存完了後に解決される Promise。
 */
export const reorderGoalsRequest = async (
  groupId: number | null,
  goals: readonly GoalDTO[]
): Promise<void> => {
  await reorderGoals(
    groupId,
    goals.map(({ id }) => id)
  )
}

/**
 * 目標グループを作成する。
 *
 * @param name - 作成するグループ名。
 * @returns 作成されたグループ。
 */
export const createGoalGroupRequest = async (name: string): Promise<GoalGroupDTO> =>
  createGoalGroup({ name })

/**
 * 目標グループ名を更新する。
 *
 * @param group - 更新対象のグループ。
 * @param name - 更新後の名前。
 * @returns 更新されたグループ。
 */
export const updateGoalGroupRequest = async (
  group: GoalGroupDTO,
  name: string
): Promise<GoalGroupDTO> => updateGoalGroup(group.id, { name })

/**
 * 目標グループを削除する。
 *
 * @param group - 削除するグループ。
 * @returns 削除完了後に解決されるPromise。
 */
export const deleteGoalGroupRequest = async (group: GoalGroupDTO): Promise<void> =>
  deleteGoalGroup(group.id)

/**
 * 目標グループの表示順を保存する。
 *
 * @param groups - 保存する表示順の全グループ。
 * @returns 並び替え完了後に解決されるPromise。
 */
export const reorderGoalGroupsRequest = async (groups: readonly GoalGroupDTO[]): Promise<void> =>
  reorderGoalGroups(groups.map(({ id }) => id))
