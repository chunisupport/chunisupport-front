import {
  type CachedSong,
  type CachedWorldsendSong,
  CLIENT_CACHE_SCHEMA_VERSION,
  db,
} from '../lib/db/cacheDB'
import type { SongDTO, WorldsendSongDTO } from '../types/api'

type SongCacheKind = 'songs' | 'worldsendSongs'

type SongDataByKind = {
  songs: SongDTO
  worldsendSongs: WorldsendSongDTO
}

/**
 * 保存済み楽曲キャッシュが配列順復元に必要な順序情報を持つか判定する。
 *
 * @param cachedSongs - IndexedDB から読み込んだ楽曲キャッシュ。
 * @returns すべての楽曲キャッシュに順序情報がある場合は true。
 */
const hasSongSortOrder = (cachedSongs: (CachedSong | CachedWorldsendSong)[]): boolean =>
  cachedSongs.every((song) => Number.isInteger(song.sortOrder))

/**
 * 楽曲キャッシュのメタデータが現行スキーマと更新日時に一致するか判定する。
 *
 * @param kind - 判定対象のキャッシュ種別。
 * @param songsUpdatedAt - API の更新日時。
 * @returns キャッシュが利用可能な場合は true。
 */
const hasValidSongMetadata = async (
  kind: SongCacheKind,
  songsUpdatedAt: string | null
): Promise<boolean> => {
  const metadata = await db.cacheMetadata.get(kind)
  return (
    metadata?.schemaVersion === CLIENT_CACHE_SCHEMA_VERSION &&
    metadata.songsUpdatedAt === songsUpdatedAt
  )
}

/**
 * 通常楽曲一覧キャッシュを読み込む。
 *
 * @param songsUpdatedAt - API から取得した楽曲更新日時。
 * @returns 利用可能な通常楽曲キャッシュ。存在しない場合は null。
 */
export const readCachedSongs = async (songsUpdatedAt: string | null): Promise<SongDTO[] | null> => {
  if (!(await hasValidSongMetadata('songs', songsUpdatedAt))) {
    return null
  }

  const cachedSongs = await db.songs.toArray()
  if (cachedSongs.length === 0 || !hasSongSortOrder(cachedSongs)) {
    return null
  }

  return cachedSongs
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((song) => song.data)
}

/**
 * WORLD'S END 楽曲一覧キャッシュを読み込む。
 *
 * @param songsUpdatedAt - API から取得した楽曲更新日時。
 * @returns 利用可能な WORLD'S END 楽曲キャッシュ。存在しない場合は null。
 */
export const readCachedWorldsendSongs = async (
  songsUpdatedAt: string | null
): Promise<WorldsendSongDTO[] | null> => {
  if (!(await hasValidSongMetadata('worldsendSongs', songsUpdatedAt))) {
    return null
  }

  const cachedSongs = await db.worldsendSongs.toArray()
  if (cachedSongs.length === 0 || !hasSongSortOrder(cachedSongs)) {
    return null
  }

  return cachedSongs
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((song) => song.data)
}

/**
 * 楽曲一覧キャッシュを store 単位で入れ替える。
 *
 * @param kind - 保存対象の楽曲キャッシュ種別。
 * @param songs - 保存する楽曲一覧。
 * @param songsUpdatedAt - API から取得した楽曲更新日時。
 * @returns 保存完了後に解決される Promise。
 */
const replaceSongCache = async <TKind extends SongCacheKind>(
  kind: TKind,
  songs: SongDataByKind[TKind][],
  songsUpdatedAt: string | null
): Promise<void> => {
  const now = new Date().toISOString()

  if (kind === 'songs') {
    await db.transaction('rw', db.songs, db.cacheMetadata, async () => {
      await db.songs.clear()
      await db.songs.bulkPut(
        (songs as SongDTO[]).map(
          (song, index): CachedSong => ({
            id: song.id,
            sortOrder: index,
            data: song,
          })
        )
      )
      await db.cacheMetadata.put({
        key: kind,
        schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
        songsUpdatedAt,
        fetchedAt: now,
      })
    })
    return
  }

  await db.transaction('rw', db.worldsendSongs, db.cacheMetadata, async () => {
    await db.worldsendSongs.clear()
    await db.worldsendSongs.bulkPut(
      (songs as WorldsendSongDTO[]).map(
        (song, index): CachedWorldsendSong => ({
          id: song.id,
          sortOrder: index,
          data: song,
        })
      )
    )
    await db.cacheMetadata.put({
      key: kind,
      schemaVersion: CLIENT_CACHE_SCHEMA_VERSION,
      songsUpdatedAt,
      fetchedAt: now,
    })
  })
}

/**
 * 通常楽曲一覧キャッシュを保存する。
 *
 * @param songs - 保存する通常楽曲一覧。
 * @param songsUpdatedAt - API から取得した楽曲更新日時。
 * @returns 保存完了後に解決される Promise。
 */
export const replaceCachedSongs = (
  songs: SongDTO[],
  songsUpdatedAt: string | null
): Promise<void> => replaceSongCache('songs', songs, songsUpdatedAt)

/**
 * WORLD'S END 楽曲一覧キャッシュを保存する。
 *
 * @param songs - 保存する WORLD'S END 楽曲一覧。
 * @param songsUpdatedAt - API から取得した楽曲更新日時。
 * @returns 保存完了後に解決される Promise。
 */
export const replaceCachedWorldsendSongs = (
  songs: WorldsendSongDTO[],
  songsUpdatedAt: string | null
): Promise<void> => replaceSongCache('worldsendSongs', songs, songsUpdatedAt)
