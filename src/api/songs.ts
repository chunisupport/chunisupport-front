import { API_BASE_URL } from '../config'
import type {
  AchievementTypeDTO,
  CourseDTO,
  CreateSongRequestDTO,
  CreateWorldsendSongRequestDTO,
  FriendRankingResponseDTO,
  ManagedSongDTO,
  ManagedWorldsendSongDTO,
  MasterDataDTO,
  MasterItemDTO,
  ScoreHistoryResponseDTO,
  SongDTO,
  SongStatsResponseDTO,
  SongsUpdatedAtResponseDTO,
  UpdatedAtResponseDTO,
  UpdateSongRequestDTO,
  UpdateWorldsendSongRequestDTO,
  VersionDTO,
  WorldsendFriendRankingResponseDTO,
  WorldsendSongDTO,
} from '../types/api'
import { sortMasterItemsBySortOrder } from '../utils/masterData'
import { fetchWithAuth } from './fetchWithAuth'

type VersionsResponse = { versions: VersionDTO[] }
export type ScoreHistoryDifficulty = 'EXPERT' | 'MASTER' | 'ULTIMA'

/** 内部向け WORLD'S END 楽曲APIのベースパス */
const INTERNAL_WORLDSEND_SONGS_PATH = `${API_BASE_URL}/internal/worldsend-songs`
/** 編集者向け WORLD'S END 楽曲APIのベースパス */
const INTERNAL_EDITOR_WORLDSEND_SONGS_PATH = `${API_BASE_URL}/internal/editor/worldsend-songs`
/** 内部向けユーザーAPIのベースパス */
const INTERNAL_USERS_PATH = `${API_BASE_URL}/internal/users`
/** 内部向けフレンドランキングAPIのベースパス */
const INTERNAL_FRIEND_RANKINGS_PATH = `${API_BASE_URL}/internal/friend-rankings`

/**
 * APIから有効な通常楽曲をすべて取得する。
 *
 * @param options - ブラウザのHTTPキャッシュ利用方法。
 * @returns 有効な通常楽曲一覧レスポンス。
 */
export const fetchAllSongs = async (
  options: Pick<RequestInit, 'cache'> = {}
): Promise<{ songs: SongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/songs`, options)

  return response.json()
}

/**
 * APIから有効なコースマスタ一覧を取得する。
 *
 * @returns コース一覧レスポンス。
 */
export const fetchCourses = async (): Promise<{ courses: CourseDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/courses`)

  return response.json()
}

/**
 * APIからコースマスタ更新日時を取得する。
 *
 * @returns コースマスタ更新日時レスポンス。
 */
export const requestCoursesUpdatedAt = async (): Promise<UpdatedAtResponseDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/courses/updated-at`)

  return response.json()
}

/**
 * API から楽曲更新日時と楽曲データの変更世代を取得する。
 *
 * @returns 通常楽曲と WORLD'S END 楽曲の共通の更新日時・変更世代レスポンス。
 */
export const requestSongsUpdatedAt = async (): Promise<SongsUpdatedAtResponseDTO> => {
  // TTL 経過後の再検証がブラウザの HTTP キャッシュで古い値にならないよう、毎回サーバーへ確認する。
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/songs/updated-at`, {
    cache: 'no-cache',
  })

  const data: unknown = await response.json()
  if (
    typeof data !== 'object' ||
    data === null ||
    !('updated_at' in data) ||
    (data.updated_at !== null && typeof data.updated_at !== 'string')
  ) {
    throw new TypeError('楽曲更新日時レスポンスの updated_at が不正です')
  }
  if (
    !('revision' in data) ||
    typeof data.revision !== 'number' ||
    !Number.isSafeInteger(data.revision) ||
    data.revision < 0
  ) {
    throw new TypeError('楽曲更新日時レスポンスの revision が不正です')
  }

  return { updated_at: data.updated_at, revision: data.revision }
}

export const fetchManagedSongs = async (): Promise<{ songs: ManagedSongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/editor/songs`)

  return response.json()
}

/**
 * WORLD'S END 楽曲一覧を取得する。
 *
 * @param options - ブラウザのHTTPキャッシュ利用方法。
 * @returns WORLD'S END 楽曲一覧レスポンス。
 */
export const fetchWorldsendSongs = async (
  options: Pick<RequestInit, 'cache'> = {}
): Promise<{ songs: WorldsendSongDTO[] }> => {
  const response = await fetchWithAuth(INTERNAL_WORLDSEND_SONGS_PATH, options)

  return response.json()
}

/**
 * 編集者向けの WORLD'S END 楽曲一覧を取得する。
 *
 * @returns 削除状態を含む WORLD'S END 楽曲一覧レスポンス。
 */
export const fetchManagedWorldsendSongs = async (): Promise<{
  songs: ManagedWorldsendSongDTO[]
}> => {
  const response = await fetchWithAuth(INTERNAL_EDITOR_WORLDSEND_SONGS_PATH)

  return response.json()
}

export const fetchSongByDisplayId = async (displayId: string): Promise<SongDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}`
  )

  return response.json()
}

/**
 * Display ID を指定して WORLD'S END 楽曲詳細を取得する。
 *
 * @param displayId - 取得対象の楽曲表示ID。
 * @returns WORLD'S END 楽曲詳細。
 */
export const fetchWorldsendSongByDisplayId = async (
  displayId: string
): Promise<WorldsendSongDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_WORLDSEND_SONGS_PATH}/${encodeURIComponent(displayId)}`
  )

  return response.json()
}

export const fetchSongStats = async (
  displayId: string,
  difficulty: string
): Promise<SongStatsResponseDTO> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}/stats/${encodeURIComponent(difficulty)}`
  )

  return response.json()
}

/**
 * ログインユーザーの通常譜面スコア履歴を取得する。
 *
 * @param displayId - 楽曲表示ID。
 * @param difficulty - 大文字の難易度ドメイン値。
 * @param username - 対象ユーザー名。
 * @returns 現行ベストを先頭に含むスコア履歴。
 */
export const fetchOwnSongScoreHistory = async (
  displayId: string,
  difficulty: ScoreHistoryDifficulty,
  username: string
): Promise<ScoreHistoryResponseDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_USERS_PATH}/${encodeURIComponent(username)}/record/songs/${encodeURIComponent(displayId)}/${difficulty.toLowerCase()}/history`
  )

  return response.json()
}

/**
 * ログインユーザーの WORLD'S END スコア履歴を取得する。
 *
 * @param displayId - 楽曲表示ID。
 * @param username - 対象ユーザー名。
 * @returns 現行ベストを先頭に含むスコア履歴。
 */
export const fetchOwnWorldsendScoreHistory = async (
  displayId: string,
  username: string
): Promise<ScoreHistoryResponseDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_USERS_PATH}/${encodeURIComponent(username)}/record/worldsend-songs/${encodeURIComponent(displayId)}/history`
  )

  return response.json()
}

/**
 * 通常譜面のフレンドランキングを取得する。
 *
 * @param displayId - 楽曲表示ID。
 * @param difficulty - 大文字の難易度ドメイン値。
 * @param signal - リクエストを中断するためのシグナル。
 * @returns 自分と承認済みフレンドの現在スコアランキング。
 */
export const fetchSongFriendRanking = async (
  displayId: string,
  difficulty: ScoreHistoryDifficulty,
  signal?: AbortSignal
): Promise<FriendRankingResponseDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_FRIEND_RANKINGS_PATH}/songs/${encodeURIComponent(displayId)}/charts/${encodeURIComponent(difficulty)}`,
    { signal }
  )

  return response.json()
}

/**
 * WORLD'S END譜面のフレンドランキングを取得する。
 *
 * @param displayId - 楽曲表示ID。
 * @param signal - リクエストを中断するためのシグナル。
 * @returns 自分と承認済みフレンドの現在スコアランキング。
 */
export const fetchWorldsendFriendRanking = async (
  displayId: string,
  signal?: AbortSignal
): Promise<WorldsendFriendRankingResponseDTO> => {
  const response = await fetchWithAuth(
    `${INTERNAL_FRIEND_RANKINGS_PATH}/worldsend-songs/${encodeURIComponent(displayId)}`,
    { signal }
  )

  return response.json()
}

/**
 * API からバージョン一覧を取得する。
 *
 * @returns バージョン一覧レスポンス。
 */
export const requestVersions = async (): Promise<VersionsResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master/versions`)

  return response.json()
}

export const updateSongs = async (requests: UpdateSongRequestDTO[]): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requests),
  })
}

export const createSong = async (request: CreateSongRequestDTO): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

/**
 * WORLD'S END 楽曲を一括更新する。
 *
 * @param requests - 更新対象の WORLD'S END 楽曲リクエスト配列。
 * @returns なし。
 */
export const updateWorldsendSongs = async (
  requests: UpdateWorldsendSongRequestDTO[]
): Promise<void> => {
  await fetchWithAuth(INTERNAL_WORLDSEND_SONGS_PATH, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requests),
  })
}

/**
 * WORLD'S END 楽曲を新規追加する。
 *
 * @param request - 追加する WORLD'S END 楽曲リクエスト。
 * @returns なし。
 */
export const createWorldsendSong = async (
  request: CreateWorldsendSongRequestDTO
): Promise<void> => {
  await fetchWithAuth(INTERNAL_WORLDSEND_SONGS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export const deleteSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}`, {
    method: 'DELETE',
  })
}

export const restoreSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/internal/songs/${encodeURIComponent(displayId)}/restore`, {
    method: 'POST',
  })
}

/**
 * Display ID を指定して WORLD'S END 楽曲を論理削除する。
 *
 * @param displayId - 削除対象の楽曲表示ID。
 * @returns なし。
 */
export const deleteWorldsendSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${INTERNAL_WORLDSEND_SONGS_PATH}/${encodeURIComponent(displayId)}`, {
    method: 'DELETE',
  })
}

/**
 * Display ID を指定して WORLD'S END 楽曲を復活させる。
 *
 * @param displayId - 復活対象の楽曲表示ID。
 * @returns なし。
 */
export const restoreWorldsendSongByDisplayId = async (displayId: string): Promise<void> => {
  await fetchWithAuth(`${INTERNAL_WORLDSEND_SONGS_PATH}/${encodeURIComponent(displayId)}/restore`, {
    method: 'POST',
  })
}

/**
 * API からマスターデータを取得する。
 *
 * @returns ソート・正規化済みのマスターデータ。
 */
export const requestMasterData = async (): Promise<MasterDataDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master`)
  const raw = (await response.json()) as Omit<
    MasterDataDTO,
    'achievement_types' | 'possessions'
  > & {
    achievement_types?: unknown[]
    possessions?: MasterItemDTO[]
  }

  const achievementTypes: AchievementTypeDTO[] = (raw.achievement_types ?? [])
    .map((item) => {
      if (typeof item === 'string') {
        const code = item.trim()
        return code ? { code } : null
      }

      if (!item || typeof item !== 'object') return null

      const obj = item as {
        code?: unknown
        name?: unknown
        label?: unknown
        value?: unknown
        id?: unknown
      }

      const codeCandidate =
        (typeof obj.code === 'string' ? obj.code : undefined) ??
        (typeof obj.value === 'string' ? obj.value : undefined) ??
        (typeof obj.id === 'string' ? obj.id : undefined) ??
        (typeof obj.name === 'string' ? obj.name : undefined)

      const code = codeCandidate?.trim()
      if (!code) return null

      const label = typeof obj.label === 'string' ? obj.label : undefined
      const name = typeof obj.name === 'string' ? obj.name : undefined

      return {
        code,
        label,
        name,
      }
    })
    .filter((item): item is AchievementTypeDTO => item !== null)

  return {
    ...raw,
    genres: sortMasterItemsBySortOrder(raw.genres ?? []),
    name_folders: [...(raw.name_folders ?? [])].sort(
      (left, right) => left.sort_order - right.sort_order
    ),
    possessions: sortMasterItemsBySortOrder(raw.possessions ?? []),
    achievement_types: achievementTypes,
  }
}
