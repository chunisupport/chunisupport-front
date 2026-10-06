/** 読みの判定に必要な楽曲情報 */
export type SongReadingSource = {
  title: string
  reading?: string | null
}

/**
 * 楽曲の読みをソート・フォルダ判定用に正規化する。
 *
 * @param song - 対象の楽曲。
 * @returns 前後の空白を除去してNFKC正規化した読み。未設定または空欄の場合は曲名。
 */
export const normalizeSongReading = (song: SongReadingSource): string => {
  const reading = song.reading?.trim()
  return (reading || song.title.trim()).normalize('NFKC')
}
