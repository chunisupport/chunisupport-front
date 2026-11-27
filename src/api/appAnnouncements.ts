import { API_BASE_URL } from '../config'
import type {
  AppAnnouncementDTO,
  AppAnnouncementRequestDTO,
  AppAnnouncementsResponseDTO,
  UpdateAppAnnouncementRequestDTO,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

const ADMIN_APP_ANNOUNCEMENTS_API_PATH = `${API_BASE_URL}/internal/admin/app-announcements`

/**
 * 配信中の期間限定のお知らせを取得する。
 *
 * @param signal - リクエストの中断シグナル。
 * @returns APIの返す順序のお知らせ一覧。
 */
export const fetchAppAnnouncements = async (
  signal?: AbortSignal
): Promise<AppAnnouncementDTO[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/app-announcements`, {
    requireAuthentication: true,
    signal,
  })
  const data: AppAnnouncementsResponseDTO = await response.json()
  return data.announcements
}

/**
 * 終了済み・開始前を含むすべてのお知らせを取得する。ADMIN専用。
 *
 * @param signal - リクエストの中断シグナル。
 * @returns 開始日時の新しい順のお知らせ一覧。
 */
export const fetchAdminAppAnnouncements = async (
  signal?: AbortSignal
): Promise<AppAnnouncementDTO[]> => {
  const response = await fetchWithAuth(ADMIN_APP_ANNOUNCEMENTS_API_PATH, {
    requireAuthentication: true,
    signal,
  })
  const data: AppAnnouncementsResponseDTO = await response.json()
  return data.announcements
}

/**
 * お知らせを追加する。ADMIN専用。
 *
 * @param request - 追加するお知らせの内容。
 * @returns 追加したお知らせ。
 */
export const requestCreateAppAnnouncement = async (
  request: AppAnnouncementRequestDTO
): Promise<AppAnnouncementDTO> => {
  const response = await fetchWithAuth(ADMIN_APP_ANNOUNCEMENTS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    requireAuthentication: true,
  })
  return response.json()
}

/**
 * お知らせを上書きする。ADMIN専用。
 *
 * @param id - 対象のお知らせID。
 * @param request - 上書きする内容と、revision を増やすかどうか。
 * @returns 更新後のお知らせ。
 */
export const requestUpdateAppAnnouncement = async (
  id: string,
  request: UpdateAppAnnouncementRequestDTO
): Promise<AppAnnouncementDTO> => {
  const response = await fetchWithAuth(
    `${ADMIN_APP_ANNOUNCEMENTS_API_PATH}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      requireAuthentication: true,
    }
  )
  return response.json()
}

/**
 * お知らせを削除する。配信中のものは即時に停止する。ADMIN専用。
 *
 * @param id - 対象のお知らせID。
 * @returns 削除の完了を表すPromise。
 */
export const requestDeleteAppAnnouncement = async (id: string): Promise<void> => {
  await fetchWithAuth(`${ADMIN_APP_ANNOUNCEMENTS_API_PATH}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    requireAuthentication: true,
  })
}
