import { API_BASE_URL } from '../config'
import type {
  CreateCourseRequestDTO,
  ManagedCourseDTO,
  ManagedCoursesResponse,
  UpdateCourseRequestDTO,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/** 内部向けコースAPIのベースパス */
const INTERNAL_COURSES_PATH = `${API_BASE_URL}/internal/courses`
/** 編集者向けコースAPIのベースパス */
const INTERNAL_EDITOR_COURSES_PATH = `${API_BASE_URL}/internal/editor/courses`

/**
 * 削除済みを含む編集者向けコース一覧を取得する。
 *
 * @returns コース一覧レスポンス。
 */
export const fetchManagedCourses = async (): Promise<ManagedCoursesResponse> => {
  const response = await fetchWithAuth(INTERNAL_EDITOR_COURSES_PATH)

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
