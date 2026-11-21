import { API_BASE_URL } from '../config'
import type {
  CourseDetailDTO,
  CourseScoreHistoryResponseDTO,
  CourseStatsResponseDTO,
  CourseTrackDTO,
  CreateCourseRequestDTO,
  ManagedCourseDTO,
  ManagedCoursesResponse,
  UpdateCourseRequestDTO,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/** 内部向けコースAPIのベースパス */
const INTERNAL_COURSES_PATH = `${API_BASE_URL}/internal/courses`
/** 内部向けユーザーAPIのベースパス */
const INTERNAL_USERS_PATH = `${API_BASE_URL}/internal/users`
/** 編集者向けコースAPIのベースパス */
const INTERNAL_EDITOR_COURSES_PATH = `${API_BASE_URL}/internal/editor/courses`

/**
 * 削除済みを含む編集者向けコース一覧を取得する。
 *
 * @param signal - 中断シグナル。
 * @returns コース一覧レスポンス。
 */
export const fetchManagedCourses = async (
  signal?: AbortSignal
): Promise<ManagedCoursesResponse> => {
  const response = await fetchWithAuth(INTERNAL_EDITOR_COURSES_PATH, { signal })

  return response.json()
}

/**
 * コースを新規追加する。
 *
 * @param request - 追加するコースの内容。
 * @returns 作成された編集者向けコース。
 */
export const createCourse = async (request: CreateCourseRequestDTO): Promise<ManagedCourseDTO> => {
  const response = await fetchWithAuth(INTERNAL_COURSES_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return response.json()
}

/**
 * 指定したコースの名称とクラスを更新する。
 *
 * @param displayId - 更新対象のコース表示ID。
 * @param request - 更新内容。
 * @returns 更新後の編集者向けコース。
 */
export const updateCourse = async (
  displayId: string,
  request: UpdateCourseRequestDTO
): Promise<ManagedCourseDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_COURSES_PATH}/${encodeURIComponent(displayId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  )

  return response.json()
}

/**
 * 指定したコースを論理削除する。
 *
 * @param displayId - 削除対象のコース表示ID。
 * @returns なし。
 */
export const deleteCourseByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${INTERNAL_COURSES_PATH}/${encodeURIComponent(displayId)}`, {
    method: 'DELETE',
  })
}

/**
 * 指定したコースを復元する。
 *
 * @param displayId - 復元対象のコース表示ID。
 * @returns なし。
 */
export const restoreCourseByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${INTERNAL_COURSES_PATH}/${encodeURIComponent(displayId)}/restore`, {
    method: 'POST',
  })
}

/**
 * ログインユーザーのコースベスト履歴を取得する。
 *
 * @param username - ログイン中のユーザー名。
 * @param displayId - コース表示ID。
 * @param signal - リクエストの中断シグナル。
 * @returns 現行ベストを先頭とする履歴。履歴が未登録の場合は空配列を含む。
 */
export const fetchOwnCourseScoreHistory = async (
  username: string,
  displayId: string,
  signal?: AbortSignal
): Promise<CourseScoreHistoryResponseDTO> => {
  try {
    const response = await fetchWithAuth(
      `${INTERNAL_USERS_PATH}/${encodeURIComponent(username)}/record/courses/${encodeURIComponent(displayId)}/history`,
      { requireAuthentication: true, signal }
    )
    return response.json()
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'score_history_not_found') {
      return { entries: [] }
    }
    throw error
  }
}

/**
 * 指定したコースのレーティング帯別プレイヤー統計を取得する。
 *
 * @param displayId - 対象コースの表示ID。
 * @returns コース統計レスポンス。
 */
export const fetchCourseStats = async (displayId: string): Promise<CourseStatsResponseDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_COURSES_PATH}/${encodeURIComponent(displayId)}/stats`
  )

  return response.json()
}

/**
 * コースの詳細と現在の候補譜面を取得する。
 *
 * @param displayId - コースの公開ID。
 * @param signal - 中断シグナル。
 * @returns コース詳細。
 */
export const fetchCourseDetail = async (
  displayId: string,
  signal?: AbortSignal
): Promise<CourseDetailDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_COURSES_PATH}/${encodeURIComponent(displayId)}`,
    { signal }
  )
  return response.json()
}

/**
 * コースの全トラックを一括更新する。
 *
 * @param displayId - 更新対象のコースの公開ID。
 * @param tracks - 登録する3枠。空配列で構成をクリアする。
 * @returns 更新完了時に解決するPromise。
 */
export const replaceCourseTracks = async (
  displayId: string,
  tracks: readonly CourseTrackDTO[]
): Promise<void> => {
  await fetchWithAuth(`${INTERNAL_COURSES_PATH}/${encodeURIComponent(displayId)}/tracks`, {
    method: 'PUT',
    requireAuthentication: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tracks }),
  })
}
