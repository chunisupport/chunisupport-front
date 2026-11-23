import { useQuery } from '@tanstack/solid-query'
import { createMemo } from 'solid-js'
import { standardSongsQueryOptions, worldsendSongsQueryOptions } from '../queries/songs'
import type { SongDTO, WorldsendSongDTO } from '../types/api'

/**
 * コース構成の譜面表示に使う通常楽曲・WORLD'S END楽曲を、楽曲画面と共有するqueryから取得し、公開IDで引ける形にする。
 *
 * @param standardEnabled - 通常楽曲一覧を取得するか。
 * @param worldsendEnabled - WORLD'S END楽曲一覧を取得するか。
 * @returns 各一覧のquery、公開IDから楽曲を引くマップ、取得中かどうか。
 */
export const createCourseTrackSongs = (
  standardEnabled: () => boolean,
  worldsendEnabled: () => boolean
) => {
  const songsQuery = useQuery(() => ({
    ...standardSongsQueryOptions(),
    enabled: standardEnabled(),
  }))
  const worldsendSongsQuery = useQuery(() => ({
    ...worldsendSongsQueryOptions(),
    enabled: worldsendEnabled(),
  }))
  const songsById = createMemo(
    () =>
      new Map<string, SongDTO | WorldsendSongDTO>(
        [...(songsQuery.data?.songs ?? []), ...(worldsendSongsQuery.data?.songs ?? [])].map(
          (song) => [song.id, song]
        )
      )
  )
  const loading = (): boolean => songsQuery.isLoading || worldsendSongsQuery.isLoading

  return { songsQuery, worldsendSongsQuery, songsById, loading }
}
