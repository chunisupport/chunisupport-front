import { queryOptions } from '@tanstack/solid-query'
import {
  fetchAdminAppAnnouncements,
  fetchAppAnnouncements,
  requestCreateAppAnnouncement,
  requestDeleteAppAnnouncement,
  requestUpdateAppAnnouncement,
} from '../api/appAnnouncements'
import { appQueryClient } from '../lib/queryClient'
import type { AppAnnouncementRequestDTO, UpdateAppAnnouncementRequestDTO } from '../types/api'

/** お知らせのqueryキー。 */
export const appAnnouncementsQueryKeys = {
  all: ['app-announcements'] as const,
  /** @param username - ログイン中のユーザー名。 */
  byUser: (username: string | null) =>
    [...appAnnouncementsQueryKeys.all, 'user', username] as const,
  admin: () => [...appAnnouncementsQueryKeys.all, 'admin'] as const,
}

/**
 * 配信中のお知らせを取得するquery optionsを生成する。
 *
 * @param username - ログイン中のユーザー名。未ログインの場合はnullで、取得しない。
 * @returns ユーザーごとに分離したお知らせのquery options。
 */
export const appAnnouncementsQueryOptions = (username: string | null) =>
  queryOptions({
    queryKey: appAnnouncementsQueryKeys.byUser(username),
    queryFn: ({ signal }) => fetchAppAnnouncements(signal),
    enabled: username !== null,
  })

/**
 * 管理画面向けに全件のお知らせを取得するquery optionsを生成する。
 *
 * @returns 終了済み・開始前を含むお知らせのquery options。
 */
export const adminAppAnnouncementsQueryOptions = () =>
  queryOptions({
    queryKey: appAnnouncementsQueryKeys.admin(),
    queryFn: ({ signal }) => fetchAdminAppAnnouncements(signal),
  })

/**
 * お知らせのqueryをすべて破棄し、管理画面とプロフィールの表示を最新にする。
 *
 * @returns 無効化の完了を表すPromise。
 */
const invalidateAppAnnouncements = () =>
  appQueryClient.invalidateQueries({ queryKey: appAnnouncementsQueryKeys.all })

/**
 * お知らせを追加し、お知らせのqueryを破棄する。
 *
 * @param request - 追加するお知らせの内容。
 * @returns 追加したお知らせ。
 */
export const createAppAnnouncement = async (request: AppAnnouncementRequestDTO) => {
  const announcement = await requestCreateAppAnnouncement(request)
  await invalidateAppAnnouncements()
  return announcement
}

/**
 * お知らせを上書きし、お知らせのqueryを破棄する。
 *
 * @param id - 対象のお知らせID。
 * @param request - 上書きする内容と、revision を増やすかどうか。
 * @returns 更新後のお知らせ。
 */
export const updateAppAnnouncement = async (
  id: string,
  request: UpdateAppAnnouncementRequestDTO
) => {
  const announcement = await requestUpdateAppAnnouncement(id, request)
  await invalidateAppAnnouncements()
  return announcement
}

/**
 * お知らせを削除し、お知らせのqueryを破棄する。
 *
 * @param id - 対象のお知らせID。
 * @returns 削除と無効化の完了を表すPromise。
 */
export const deleteAppAnnouncement = async (id: string): Promise<void> => {
  await requestDeleteAppAnnouncement(id)
  await invalidateAppAnnouncements()
}
