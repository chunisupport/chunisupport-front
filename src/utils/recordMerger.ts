import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../types/api'
import { getShortVersionName, resolveVersionNameByReleaseDate } from './versionConverter'

/** 楽曲メタ情報を付与したプレイヤーレコード */
export interface PlayerRecordWithSongMeta extends PlayerRecordDTO {
  genre: string
  release: string | null
  release_version: string
  notes: number | null
}

/**
 * レコードに楽曲マスタ由来の追加情報を付与する
 * @param songs 全楽曲データ
 * @param records APIから取得したレコード配列
 * @param versions バージョン一覧
 * @returns 楽曲情報を付与したレコード配列
 */
export function attachSongMetaToRecords(
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[]
): PlayerRecordWithSongMeta[] {
  const songMap = new Map(songs.map((song) => [song.id, song]))

  return records.map((record) => {
    const song = songMap.get(record.id)
    const release = song?.release ?? null
    const notes = song?.charts?.[record.difficulty]?.notes ?? null

    return {
      ...record,
      genre: song?.genre ?? '不明',
      release,
      notes,
      release_version: getShortVersionName(resolveVersionNameByReleaseDate(release, versions)),
    }
  })
}
