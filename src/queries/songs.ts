import { queryOptions } from '@tanstack/solid-query'
import { appQueryClient } from '../lib/queryClient'
import type { SongDTO, WorldsendSongDTO } from '../types/api'
import { fetchAllSongsWithCache } from '../usecases/cache/fetchAllSongsWithCache'
import { fetchWorldsendSongsWithCache } from '../usecases/cache/fetchWorldsendSongsWithCache'

/** 通常楽曲一覧queryのデータ。 */
export type StandardSongsQueryData = {
  songs: SongDTO[]
  /** キャッシュを表示したまま、鮮度確認または本体取得に失敗した場合はtrue。 */
  revalidationFailed: boolean
}

/** WORLD'S END楽曲一覧queryのデータ。 */
export type WorldsendSongsQueryData = {
  songs: WorldsendSongDTO[]
}

/** 楽曲一覧queryのkey factory。 */
export const songListQueryKeys = {
  all: ['song-lists'] as const,
  /** @returns 通常楽曲一覧のqueryキー。 */
  standard: () => [...songListQueryKeys.all, 'standard'] as const,
  /** @returns WORLD'S END楽曲一覧のqueryキー。 */
  worldsend: () => [...songListQueryKeys.all, 'worldsend'] as const,
}

/**
 * 通常楽曲一覧を取得する。IndexedDBのキャッシュは鮮度確認より先にqueryへ反映する。
 * キャッシュを表示した後に取得が失敗した場合は、キャッシュを維持して失敗を記録する。
 *
 * @param signal - queryの中断シグナル。中断後はキャッシュを反映しない。
 * @returns 通常楽曲一覧と再検証の失敗有無。
 */
const fetchStandardSongs = async (signal: AbortSignal): Promise<StandardSongsQueryData> => {
  let cachedSongs: SongDTO[] | undefined
  try {
    const response = await fetchAllSongsWithCache({
      onCached: (cached) => {
        cachedSongs = cached.songs
        if (signal.aborted) return
        appQueryClient.setQueryData<StandardSongsQueryData>(songListQueryKeys.standard(), {
          songs: cached.songs,
          revalidationFailed: false,
        })
      },
    })
    return { songs: response.songs, revalidationFailed: false }
  } catch (error) {
    if (!cachedSongs) throw error
    return { songs: cachedSongs, revalidationFailed: true }
  }
}

/**
 * 通常楽曲一覧のquery optionsを生成する。
 * 楽曲の変更は楽曲更新日時と明示的な再取得で反映するため、セッション中は自動で再取得しない。
 *
 * @returns 楽曲画面・コース画面で共有する通常楽曲一覧のquery options。
 */
export const standardSongsQueryOptions = () =>
  queryOptions({
    queryKey: songListQueryKeys.standard(),
    queryFn: ({ signal }) => fetchStandardSongs(signal),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: 'always',
  })

/**
 * WORLD'S END楽曲一覧のquery optionsを生成する。
 * 楽曲の変更は楽曲更新日時と明示的な再取得で反映するため、セッション中は自動で再取得しない。
 *
 * @returns 楽曲画面・コース画面で共有するWORLD'S END楽曲一覧のquery options。
 */
export const worldsendSongsQueryOptions = () =>
  queryOptions({
    queryKey: songListQueryKeys.worldsend(),
    queryFn: async (): Promise<WorldsendSongsQueryData> => fetchWorldsendSongsWithCache(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: 'always',
  })
