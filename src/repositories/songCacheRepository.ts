import {
  type CachedSong,
  type CachedWorldsendSong,
  CLIENT_CACHE_SCHEMA_VERSION,
} from '../lib/db/cacheSchema'
import { getCacheDB } from '../lib/db/getCacheDB'
import type { SongDTO, WorldsendSongDTO } from '../types/api'

type SongCacheKind = 'songs' | 'worldsendSongs'

type SongDataByKind = {
  songs: SongDTO
  worldsendSongs: WorldsendSongDTO
}

/** 楽曲キャッシュを最後に一括無効化した世代 */
let songCacheGeneration = 0

/**
 * 非同期取得開始時点の楽曲キャッシュ世代を返す。
 *
 * @returns 現在の楽曲キャッシュ世代。
 */
export const getSongCacheGeneration = (): number => songCacheGeneration

/**
 * 保存済み楽曲キャッシュが配列順復元に必要な順序情報を持つか判定する。
 *
 * @param cachedSongs - IndexedDB から読み込んだ楽曲キャッシュ。
 * @returns すべての楽曲キャッシュに順序情報がある場合は true。
 */
const hasSongSortOrder = (cachedSongs: (CachedSong | CachedWorldsendSong)[]): boolean =>
  cachedSongs.every((song) => Number.isInteger(song.sortOrder))

/**
 * 保存済み楽曲キャッシュが現行の楽曲DTOで必須のフラグを持つか判定する。
 *
 * @param cachedSongs - IndexedDB から読み込んだ楽曲キャッシュ。
 * @param flags - 真偽値として保存されている必要があるフラグ名。
 * @returns すべての楽曲キャッシュが指定フラグを真偽値で持つ場合は true。
 */
const hasSongFlags = <TSong extends CachedSong | CachedWorldsendSong>(
  cachedSongs: TSong[],
  flags: readonly (keyof TSong['data'])[]
): boolean =>
  cachedSongs.every((song) =>
    flags.every((flag) => typeof (song.data as TSong['data'])[flag] === 'boolean')
  )

/**
 * 楽曲キャッシュのメタデータが現行スキーマと楽曲データの変更世代に一致するか判定する。
 *
 * @param kind - 判定対象のキャッシュ種別。
 * @param songsRevision - API の楽曲データの変更世代。
 * @returns キャッシュが利用可能な場合は true。
 */
const hasValidSongMetadata = async (
  kind: SongCacheKind,
  songsRevision: number
): Promise<boolean> => {
  const db = await getCacheDB()
  const metadata = await db.cacheMetadata.get(kind)
  return (
    metadata?.schemaVersion === CLIENT_CACHE_SCHEMA_VERSION &&
    metadata.songsRevision === songsRevision
  )
}

/**
 * 通常楽曲キャッシュが指定した変更世代でまだ保存されているか、メタデータだけで確認する。
 *
 * @param songsRevision - 先に読み込んだ一覧の変更世代。
 * @returns 削除や異なる世代への入れ替えがない場合は true。
 */
export const hasCachedSongsRevision = (songsRevision: number): Promise<boolean> =>
  hasValidSongMetadata('songs', songsRevision)

/**
 * 先行表示と鮮度判定のため、通常楽曲一覧とその変更世代を同じ時点のデータとして読み込む。
 *
 * @returns スキーマが有効な通常楽曲一覧と変更世代。利用できない場合は null。
 */
export const readCachedSongsSnapshot = async (): Promise<{
  songs: SongDTO[]
  revision: number | undefined
} | null> => {
  const db = await getCacheDB()
  return db.transaction('r', db.cacheMetadata, db.songs, async () => {
    const metadata = await db.cacheMetadata.get('songs')
    if (metadata?.schemaVersion !== CLIENT_CACHE_SCHEMA_VERSION) return null

    const cachedSongs = await db.songs.toArray()
    if (
      cachedSongs.length === 0 ||
      !hasSongSortOrder(cachedSongs) ||
      !hasSongFlags(cachedSongs, ['unlock_required']) ||
      !cachedSongs.every((song) => typeof song.data.name_folder_code === 'string')
    ) {
      return null
    }

    return {
      songs: cachedSongs
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((song) => song.data),
      revision: metadata.songsRevision,
    }
  })
}

/**
 * API の楽曲データの変更世代と一致する通常楽曲一覧キャッシュを読み込む。
 *
 * @param songsRevision - API で確認した楽曲データの変更世代。
 * @returns 変更世代が一致する通常楽曲キャッシュ。利用できない場合は null。
 */
export const readCachedSongs = async (songsRevision: number): Promise<SongDTO[] | null> => {
  const cached = await readCachedSongsSnapshot()
  return cached?.revision === songsRevision ? cached.songs : null
}

/**
 * 鮮度確認と並行して読めるよう、WORLD'S END 楽曲一覧とその変更世代を同じ時点のデータとして読み込む。
 *
 * @returns スキーマが有効な WORLD'S END 楽曲一覧と変更世代。利用できない場合は null。
 */
export const readCachedWorldsendSongsSnapshot = async (): Promise<{
  songs: WorldsendSongDTO[]
  revision: number | undefined
} | null> => {
  const db = await getCacheDB()
  return db.transaction('r', db.cacheMetadata, db.worldsendSongs, async () => {
    const metadata = await db.cacheMetadata.get('worldsendSongs')
    if (metadata?.schemaVersion !== CLIENT_CACHE_SCHEMA_VERSION) return null

    const cachedSongs = await db.worldsendSongs.toArray()
    if (
      cachedSongs.length === 0 ||
      !hasSongSortOrder(cachedSongs) ||
      !hasSongFlags(cachedSongs, ['is_new', 'unlock_required']) ||
      !cachedSongs.every((song) => typeof song.data.name_folder_code === 'string')
    ) {
      return null
    }

    return {
      songs: cachedSongs
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((song) => song.data),
      revision: metadata.songsRevision,
    }
  })
}

/**
 * WORLD'S END 楽曲一覧キャッシュを読み込む。
 *
 * @param songsRevision - API から取得した楽曲データの変更世代。
 * @returns 変更世代が一致する WORLD'S END 楽曲キャッシュ。利用できない場合は null。
 */
export const readCachedWorldsendSongs = async (
  songsRevision: number
): Promise<WorldsendSongDTO[] | null> => {
  const cached = await readCachedWorldsendSongsSnapshot()
  return cached?.revision === songsRevision ? cached.songs : null
}

/**
 * 楽曲一覧キャッシュを store 単位で入れ替える。
 *
 * @param kind - 保存対象の楽曲キャッシュ種別。
 * @param songs - 保存する楽曲一覧。
 * @param songsRevision - 一覧取得前の楽曲データの変更世代。未確認なら undefined。
 * @param expectedGeneration - 一覧取得開始時点の楽曲キャッシュ世代。
 * @returns 保存完了後に解決される Promise。
 */
const replaceSongCache = async <TKind extends SongCacheKind>(
  kind: TKind,
  songs: SongDataByKind[TKind][],
  songsRevision: number | undefined,
  expectedGeneration: number
): Promise<void> => {
  if (expectedGeneration !== songCacheGeneration) {
    return
  }

  const db = await getCacheDB()
  const now = new Date().toISOString()

  if (kind === 'songs') {
    await db.transaction('rw', db.songs, db.cacheMetadata, async () => {
      if (expectedGeneration !== songCacheGeneration) {
        return
      }

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
        songsRevision,
        fetchedAt: now,
      })
    })
    return
  }

  await db.transaction('rw', db.worldsendSongs, db.cacheMetadata, async () => {
    if (expectedGeneration !== songCacheGeneration) {
      return
    }

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
      songsRevision,
      fetchedAt: now,
    })
  })
}

/**
 * 通常楽曲一覧キャッシュを保存する。
 *
 * @param songs - 保存する通常楽曲一覧。
 * @param songsRevision - 一覧取得前の楽曲データの変更世代。未確認なら undefined。
 * @param expectedGeneration - 一覧取得開始時点の楽曲キャッシュ世代。
 * @returns 保存完了後に解決される Promise。
 */
export const replaceCachedSongs = (
  songs: SongDTO[],
  songsRevision: number | undefined,
  expectedGeneration: number = songCacheGeneration
): Promise<void> => replaceSongCache('songs', songs, songsRevision, expectedGeneration)

/**
 * WORLD'S END 楽曲一覧キャッシュを保存する。
 *
 * @param songs - 保存する WORLD'S END 楽曲一覧。
 * @param songsRevision - API から取得した楽曲データの変更世代。
 * @param expectedGeneration - 一覧取得開始時点の楽曲キャッシュ世代。
 * @returns 保存完了後に解決される Promise。
 */
export const replaceCachedWorldsendSongs = (
  songs: WorldsendSongDTO[],
  songsRevision: number,
  expectedGeneration: number = songCacheGeneration
): Promise<void> => replaceSongCache('worldsendSongs', songs, songsRevision, expectedGeneration)

/**
 * 共通の楽曲データの変更世代に紐づく通常楽曲・WORLD'S END楽曲キャッシュをすべて削除する。
 *
 * @returns キャッシュ削除完了後に解決される Promise。
 */
export const clearCachedSongData = async (): Promise<void> => {
  songCacheGeneration += 1

  const db = await getCacheDB()
  await db.transaction('rw', db.songs, db.worldsendSongs, db.cacheMetadata, async () => {
    await Promise.all([
      db.songs.clear(),
      db.worldsendSongs.clear(),
      db.cacheMetadata.delete('songs'),
      db.cacheMetadata.delete('worldsendSongs'),
    ])
  })
}
