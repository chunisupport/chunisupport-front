import type { VersionSummaryDTO, WorldsendRecordDTO, WorldsendSongDTO } from '../../../../types/api'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../../utils/versionConverter'
import type { WorldsendRecordWithSongMeta } from '../types/filterTypes'

/**
 * WORLD'S END レコードへ楽曲マスタ由来の検索・表示用メタ情報を付与する。
 *
 * @param songs - 楽曲マスタ一覧。
 * @param records - API から取得した WORLD'S END レコード一覧。
 * @param versions - リリース日からバージョン名を解決するためのバージョン一覧。
 * @returns 楽曲メタ情報を付与した WORLD'S END レコード一覧。
 */
export const attachWorldsendSongMetaToRecords = (
  songs: WorldsendSongDTO[],
  records: WorldsendRecordDTO[],
  versions: VersionSummaryDTO[]
): WorldsendRecordWithSongMeta[] => {
  const songMap = new Map(songs.map((song) => [song.id, song]))

  return records.map((record) => {
    const song = songMap.get(record.id)

    return {
      ...record,
      genre: song?.genre ?? null,
      reading: song?.reading ?? null,
      release: song?.release ?? null,
      release_version: getShortVersionName(
        resolveVersionNameByReleaseDate(song?.release ?? null, versions)
      ),
    }
  })
}
