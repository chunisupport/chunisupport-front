import { API_BASE_URL } from '../config'
import type {
  AchievementTypeDTO,
  CreateSongRequestDTO,
  CreateWorldsendSongRequestDTO,
  ManagedSongDTO,
  ManagedWorldsendSongDTO,
  MasterDataDTO,
  SongDTO,
  SongStatsResponseDTO,
  UpdateSongRequestDTO,
  UpdateWorldsendSongRequestDTO,
  VersionDTO,
  WorldsendSongDTO,
} from '../types/api'
import { sortMasterItemsBySortOrder } from '../utils/masterData'
import { fetchWithAuth } from './fetchWithAuth'

type VersionsResponse = { versions: VersionDTO[] }

/** 内部向け WORLD'S END 楽曲APIのベースパス。 */
const INTERNAL_WORLDSEND_SONGS_PATH = `${API_BASE_URL}/internal/worldsend-songs`
/** 編集者向け WORLD'S END 楽曲APIのベースパス。 */
const INTERNAL_EDITOR_WORLDSEND_SONGS_PATH = `${API_BASE_URL}/internal/editor/worldsend-songs`

let cachedVersionsResponse: VersionsResponse | undefined
let versionsResponsePromise: Promise<VersionsResponse> | undefined

export const fetchAllSongs = async (): Promise<{ songs: SongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/songs`)

  return response.json()
}

export const fetchManagedSongs = async (): Promise<{ songs: ManagedSongDTO[] }> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/editor/songs`)

  return response.json()
}

/**
 * WORLD'S END 楽曲一覧を取得する。
 *
 * @returns WORLD'S END 楽曲一覧レスポンス。
 */
export const fetchWorldsendSongs = async (): Promise<{ songs: WorldsendSongDTO[] }> => {
  const response = await fetchWithAuth(INTERNAL_WORLDSEND_SONGS_PATH)

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
 * API からバージョン一覧を取得する。
 *
 * @returns バージョン一覧レスポンス。
 */
const fetchVersionsFromApi = async (): Promise<VersionsResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master/versions`)

  return response.json()
}

/**
 * セッション中にバージョン一覧を一度だけ取得し、メモリ上に保持する。
 *
 * @returns キャッシュ済み、または API から取得したバージョン一覧レスポンス。
 */
export const fetchVersions = async (): Promise<VersionsResponse> => {
  if (cachedVersionsResponse) {
    return cachedVersionsResponse
  }

  versionsResponsePromise ??= fetchVersionsFromApi()

  try {
    cachedVersionsResponse = await versionsResponsePromise
    return cachedVersionsResponse
  } catch (error) {
    versionsResponsePromise = undefined
    throw error
  }
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

// --- マスターデータ取得API ---
export const fetchMasterData = async (): Promise<MasterDataDTO> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master`)
  const raw = (await response.json()) as Omit<MasterDataDTO, 'achievement_types'> & {
    achievement_types?: unknown[]
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
    achievement_types: achievementTypes,
  }
}
