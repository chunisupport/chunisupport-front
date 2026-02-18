import type { PlayerRecordDTO, SongDTO } from '../types/api'
import { dateToChunithmVersion } from './versionConverter'

/** プレイ済み・未プレイを含むレコードの型定義 */
export interface PlayerRecordIncludeNoPlay extends PlayerRecordDTO {
  genre: string
  release: string | null
  release_version: string
}

/**
 * レコードに楽曲マスタ由来の補助情報を付与する
 * @param songs 全楽曲データ
 * @param records APIから取得した全レコード（未プレイ含む）
 * @returns 楽曲情報を付与したレコード配列
 */
export function mergeAllRecords(
  songs: SongDTO[],
  records: PlayerRecordDTO[]
): PlayerRecordIncludeNoPlay[] {
  const songMap = new Map(songs.map((song) => [song.id, song]))

  return records.map((record) => {
    const song = songMap.get(record.id)
    const release = song?.release ?? null

    return {
      ...record,
      genre: song?.genre ?? '不明',
      release,
      release_version: dateToChunithmVersion(release),
    }
  })
}
