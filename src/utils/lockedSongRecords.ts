import type { PlayerLockedSongResponseItem, PlayerRecordDTO } from '../types/api'

/** 未解禁判定に使う楽曲ID・未解禁範囲 */
type LockedSong = Pick<PlayerLockedSongResponseItem, 'id' | 'is_ultima'>

/**
 * 未解禁設定に登録された楽曲・譜面のレコードを除外する。
 * 楽曲単位の設定は全難易度を、ULTIMAのみの設定はULTIMA譜面だけを除外する。
 *
 * @param records - 除外前の通常譜面レコード。
 * @param lockedSongs - ユーザーの未解禁楽曲設定。
 * @returns 未解禁の楽曲・譜面を除いた新しい配列。
 */
export const excludeLockedSongRecords = (
  records: PlayerRecordDTO[],
  lockedSongs: LockedSong[]
): PlayerRecordDTO[] => {
  const lockedSongIds = new Set(
    lockedSongs.filter((song) => !song.is_ultima).map((song) => song.id)
  )
  const ultimaLockedSongIds = new Set(
    lockedSongs.filter((song) => song.is_ultima).map((song) => song.id)
  )
  return records.filter(
    (record) =>
      !lockedSongIds.has(record.id) &&
      !(record.difficulty.toUpperCase() === 'ULTIMA' && ultimaLockedSongIds.has(record.id))
  )
}
