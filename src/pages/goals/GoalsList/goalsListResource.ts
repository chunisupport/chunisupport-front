import { createGoal, deleteGoal, fetchGoals, updateGoal } from '../../../api/goals'
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import { fetchMe, fetchUserProfileSummary } from '../../../api/users'
import type {
  GoalCreateRequest,
  GoalDTO,
  GoalUpdateRequest,
  MasterDataDTO,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../types/api'
import { fetchAllSongsWithCache } from '../../../usecases/cache/fetchAllSongsWithCache'
import { fetchUserRecordWithCache } from '../../../usecases/cache/fetchUserRecordWithCache'

export interface GoalsListData {
  username: string
  noPlayerData: boolean
  goals: GoalDTO[]
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

  const [goalsResponse, songsResponse, masterData, versionData, profile, record] =
    await Promise.all([
      fetchGoals(),
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
 * 指定した目標を削除する。
 *
 * @param goal - 削除対象の目標。
 * @returns 削除APIの完了後に解決される Promise。
 */
export const deleteGoalRequest = async (goal: GoalDTO): Promise<void> => {
  await deleteGoal(goal.id)
}
