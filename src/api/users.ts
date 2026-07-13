import { API_BASE_URL } from '../config'
import type {
  AdminUserListResponse,
  PlayerFavoriteSongRequest,
  PlayerFavoriteSongsResponse,
  PlayerLockedSongRequest,
  PlayerLockedSongsBatchRequest,
  PlayerLockedSongsResponse,
  UpdatedAtResponseDTO,
  UserCourseRecordsDTO,
  UserDTO,
  UserProfileDTO,
  UserRatingDTO,
  UserRecordDTO,
  UserStandardSongRecordDTO,
  UserWorldsendSongRecordDTO,
} from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

type FetchUserRecordOptions = {
  includeNoPlay?: boolean
}

type FetchMeOptions = {
  redirectOnUnauthorized?: boolean
}

/** ユーザー更新日時の進行中リクエスト。ユーザー名ごとに同時呼び出しを共有する。 */
const userUpdatedAtResponsePromises = new Map<string, Promise<UpdatedAtResponseDTO>>()

export const fetchUserProfileSummary = async (username: string): Promise<UserProfileDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/profile`
  )

  return response.json()
}

export const fetchUserRating = async (username: string): Promise<UserRatingDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/rating`
  )

  return response.json()
}

/**
 * ユーザー系キャッシュの更新判定に使う最新更新日時を取得する。
 * 同じユーザーへの同時呼び出しは同一リクエストにまとめる。
 *
 * @param username - 更新日時を取得するユーザー名。
 * @returns ユーザー更新日時レスポンス。
 */
export const fetchUserUpdatedAt = async (username: string): Promise<UpdatedAtResponseDTO> => {
  const existingPromise = userUpdatedAtResponsePromises.get(username)
  if (existingPromise) {
    return existingPromise
  }

  const responsePromise = fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/updated-at`
  ).then((response) => response.json() as Promise<UpdatedAtResponseDTO>)
  userUpdatedAtResponsePromises.set(username, responsePromise)

  try {
    return await responsePromise
  } finally {
    if (userUpdatedAtResponsePromises.get(username) === responsePromise) {
      userUpdatedAtResponsePromises.delete(username)
    }
  }
}

export const fetchUserRecord = async (
  username: string,
  options: FetchUserRecordOptions = {}
): Promise<UserRecordDTO> => {
  const url = new URL(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/record`)
  if (options.includeNoPlay) {
    url.searchParams.set('include_noplay', 'true')
  }
  const response = await fetchWithAuth(url)

  return response.json()
}

/**
 * 指定したユーザーのコースレコード一覧を取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @param options - 未プレイコースの補完設定。
 * @returns コースレコード一覧レスポンス。
 */
export const fetchUserCourseRecords = async (
  username: string,
  options: FetchUserRecordOptions = {}
): Promise<UserCourseRecordsDTO> => {
  const url = new URL(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/record/courses`
  )
  if (options.includeNoPlay) {
    url.searchParams.set('include_noplay', 'true')
  }

  const response = await fetchWithAuth(url)
  return response.json()
}

/**
 * 指定した通常楽曲1曲分のユーザーレコードを取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @param displayId - 取得対象の楽曲表示ID。
 * @param options - 未プレイ譜面の補完設定。
 * @returns 通常楽曲1曲分のレコードレスポンス。
 */
export const fetchUserStandardSongRecord = async (
  username: string,
  displayId: string,
  options: FetchUserRecordOptions = {}
): Promise<UserStandardSongRecordDTO> => {
  const url = new URL(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/record/songs/${encodeURIComponent(displayId)}`
  )
  if (options.includeNoPlay) {
    url.searchParams.set('include_noplay', 'true')
  }

  const response = await fetchWithAuth(url)
  return response.json()
}

/**
 * 指定したWORLD'S END楽曲1曲分のユーザーレコードを取得する。
 *
 * @param username - レコード取得対象のユーザー名。
 * @param displayId - 取得対象の楽曲表示ID。
 * @param options - 未プレイレコードの補完設定。
 * @returns WORLD'S END楽曲1曲分のレコードレスポンス。
 */
export const fetchUserWorldsendSongRecord = async (
  username: string,
  displayId: string,
  options: FetchUserRecordOptions = {}
): Promise<UserWorldsendSongRecordDTO> => {
  const url = new URL(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/record/worldsend-songs/${encodeURIComponent(displayId)}`
  )
  if (options.includeNoPlay) {
    url.searchParams.set('include_noplay', 'true')
  }

  const response = await fetchWithAuth(url)
  return response.json()
}

/**
 * Firebase にログインしている現在のユーザー情報を取得する。
 *
 * @param options - 未認証時のリダイレクト設定。
 * @returns 現在のユーザー情報。
 */
export const fetchMe = async (options: FetchMeOptions = {}): Promise<UserDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me`, {
    requireAuthentication: true,
    redirectOnUnauthorized: options.redirectOnUnauthorized,
  })

  return response.json()
}

export const fetchUserLockedSongs = async (
  username: string
): Promise<PlayerLockedSongsResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/locked-songs`
  )

  return response.json()
}

export const addMyLockedSong = async (request: PlayerLockedSongRequest): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/locked-songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export const updateMyLockedSongsBatch = async (
  request: PlayerLockedSongsBatchRequest
): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/locked-songs/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export const deleteMyLockedSong = async (request: PlayerLockedSongRequest): Promise<void> => {
  const url = new URL(
    `${API_BASE_URL}/internal/me/locked-songs/${encodeURIComponent(request.display_id)}`
  )
  url.searchParams.set('is_ultima', String(request.is_ultima ?? false))

  await fetchWithAuth(url, {
    method: 'DELETE',
  })
}

/**
 * 対象ユーザーのお気に入り楽曲一覧を取得する。
 *
 * @param username - 取得対象のユーザー名。
 * @returns お気に入り楽曲一覧。
 */
export const fetchUserFavoriteSongs = async (
  username: string
): Promise<PlayerFavoriteSongsResponse> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/favorite-songs`
  )

  return response.json()
}

/**
 * 現在のユーザーのお気に入りへ楽曲を追加する。
 *
 * @param request - 追加する楽曲ID。
 * @returns 登録完了時に解決されるPromise。
 */
export const addMyFavoriteSong = async (request: PlayerFavoriteSongRequest): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/me/favorite-songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

/**
 * 現在のユーザーのお気に入りから楽曲を解除する。
 *
 * @param displayId - 解除する楽曲ID。
 * @returns 解除完了時に解決されるPromise。
 */
export const deleteMyFavoriteSong = async (displayId: string): Promise<void> => {
  await fetchWithAuth(
    `${API_BASE_URL}/internal/me/favorite-songs/${encodeURIComponent(displayId)}`,
    { method: 'DELETE' }
  )
}

type FetchAdminUsersOptions = {
  page?: number
  name?: string
}

export const fetchAdminUsers = async (
  options: FetchAdminUsersOptions = {}
): Promise<AdminUserListResponse[]> => {
  const url = new URL(`${API_BASE_URL}/internal/users/`)
  if (typeof options.page !== 'undefined') {
    url.searchParams.set('page', String(options.page))
  }
  if (options.name) {
    url.searchParams.set('name', options.name)
  }

  const response = await fetchWithAuth(url)

  return response.json()
}

export const deleteUserByUsername = async (username: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  })
}
