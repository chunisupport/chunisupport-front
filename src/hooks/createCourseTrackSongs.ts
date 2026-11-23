import { createEffect, createMemo } from 'solid-js'
import { useSongsData } from '../stores/songsData'
import type { SongDTO, WorldsendSongDTO } from '../types/api'

/** コース構成で使う楽曲一覧の取得状態。 */
export type CourseTrackSongCatalog<T> = {
  /** @returns 取得済みの楽曲一覧。未取得・取得失敗時は空配列。 */
  songs: () => T[]
  /** @returns 表示可能なデータがまだない場合はtrue。 */
  loading: () => boolean
  /** @returns 取得に失敗した場合のエラー。 */
  error: () => unknown
}

/**
 * コース構成の譜面表示に使う通常楽曲・WORLD'S END楽曲を共有楽曲ストアから取得し、公開IDで引ける形にする。
 *
 * @param standardEnabled - 通常楽曲一覧を取得するか。
 * @param worldsendEnabled - WORLD'S END楽曲一覧を取得するか。
 * @returns 各一覧の取得状態、公開IDから楽曲を引くマップ、取得中かどうか。
 */
export const createCourseTrackSongs = (
  standardEnabled: () => boolean,
  worldsendEnabled: () => boolean
) => {
  const songsData = useSongsData()

  createEffect(() => {
    if (standardEnabled()) songsData.ensureSongsLoaded()
  })
  createEffect(() => {
    if (worldsendEnabled()) songsData.ensureWorldsendSongsLoaded()
  })

  const standard: CourseTrackSongCatalog<SongDTO> = {
    songs: () => (songsData.songsResponse.error ? [] : (songsData.songsResponse()?.songs ?? [])),
    loading: () => !songsData.songsResponse.error && songsData.isSongsLoading(),
    error: () => songsData.songsResponse.error,
  }
  const worldsend: CourseTrackSongCatalog<WorldsendSongDTO> = {
    songs: () =>
      songsData.worldsendSongsResponse.error
        ? []
        : (songsData.worldsendSongsResponse()?.songs ?? []),
    loading: () => !songsData.worldsendSongsResponse.error && songsData.isWorldsendSongsLoading(),
    error: () => songsData.worldsendSongsResponse.error,
  }

  const songsById = createMemo(
    () =>
      new Map<string, SongDTO | WorldsendSongDTO>(
        [
          ...(standardEnabled() ? standard.songs() : []),
          ...(worldsendEnabled() ? worldsend.songs() : []),
        ].map((song) => [song.id, song])
      )
  )
  const loading = (): boolean =>
    (standardEnabled() && standard.loading()) || (worldsendEnabled() && worldsend.loading())

  return { standard, worldsend, songsById, loading }
}
