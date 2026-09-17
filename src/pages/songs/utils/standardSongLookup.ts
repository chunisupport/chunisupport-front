/** STANDARD楽曲から項目を照合するときに使う最小項目 */
export type StandardSongLookupItem = {
  title: string
  artist: string
  bpm: number | null
  reading: string | null
  is_deleted?: boolean
}

/** STANDARD楽曲の項目照合結果 */
export type StandardSongLookupResult<T> =
  | { status: 'found'; value: T }
  | { status: 'notFound' }
  | { status: 'valueMissing' }

/**
 * 曲名・アーティスト名の照合キーを正規化する。
 *
 * @param value - 曲名またはアーティスト名。
 * @returns 前後空白を除いた照合キー。
 */
const normalizeSongKey = (value: string): string => value.trim()

/**
 * 同じ曲名・アーティスト名のSTANDARD楽曲から値を取得する。
 * 削除済み楽曲は除外し、複数件ある場合は値が設定されている最初の1件を使う。
 *
 * @param songs - 照合対象のSTANDARD楽曲一覧。
 * @param title - WORLD'S END側の曲名。
 * @param artist - WORLD'S END側のアーティスト名。
 * @param readValue - 一致した楽曲から取り出す値。未設定は null。
 * @returns 照合結果。一致なし、または一致しても値が未設定の場合はその状態。
 */
const findStandardSongValue = <T>(
  songs: readonly StandardSongLookupItem[],
  title: string,
  artist: string,
  readValue: (song: StandardSongLookupItem) => T | null
): StandardSongLookupResult<T> => {
  const normalizedTitle = normalizeSongKey(title)
  const normalizedArtist = normalizeSongKey(artist)
  if (!normalizedTitle || !normalizedArtist) {
    return { status: 'notFound' }
  }

  const matches = songs.filter(
    (song) =>
      song.is_deleted !== true &&
      normalizeSongKey(song.title) === normalizedTitle &&
      normalizeSongKey(song.artist) === normalizedArtist
  )
  if (matches.length === 0) {
    return { status: 'notFound' }
  }

  for (const song of matches) {
    const value = readValue(song)
    if (value !== null) {
      return { status: 'found', value }
    }
  }

  return { status: 'valueMissing' }
}

/**
 * 同じ曲名・アーティスト名のSTANDARD楽曲からBPMを取得する。
 *
 * @param songs - 照合対象のSTANDARD楽曲一覧。
 * @param title - WORLD'S END側の曲名。
 * @param artist - WORLD'S END側のアーティスト名。
 * @returns 照合結果。
 */
export const findStandardSongBpm = (
  songs: readonly StandardSongLookupItem[],
  title: string,
  artist: string
): StandardSongLookupResult<number> =>
  findStandardSongValue(songs, title, artist, (song) => song.bpm)

/**
 * 同じ曲名・アーティスト名のSTANDARD楽曲から読みを取得する。
 *
 * @param songs - 照合対象のSTANDARD楽曲一覧。
 * @param title - WORLD'S END側の曲名。
 * @param artist - WORLD'S END側のアーティスト名。
 * @returns 照合結果。
 */
export const findStandardSongReading = (
  songs: readonly StandardSongLookupItem[],
  title: string,
  artist: string
): StandardSongLookupResult<string> =>
  findStandardSongValue(songs, title, artist, (song) => {
    const reading = song.reading?.trim() ?? ''
    return reading === '' ? null : reading
  })
