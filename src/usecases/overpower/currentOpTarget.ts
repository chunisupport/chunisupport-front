import type { PlayerRecordDTO } from '../../types/api'

/**
 * 曲ごとの現在OVER POWERを集計する。
 *
 * @param records - 集計対象のプレイヤーレコード一覧。
 * @returns 曲IDをキーに現在OVER POWERを保持するMap。
 */
export const buildCurrentOverPowerBySongId = (records: PlayerRecordDTO[]): Map<string, number> => {
  const groupedRecords = new Map<string, PlayerRecordDTO[]>()

  for (const record of records) {
    const songRecords = groupedRecords.get(record.id) ?? []
    songRecords.push(record)
    groupedRecords.set(record.id, songRecords)
  }

  const currentOverPowerBySongId = new Map<string, number>()
  for (const [songId, songRecords] of groupedRecords.entries()) {
    const targetRecords = songRecords.some((record) => record.is_op_target)
      ? songRecords.filter((record) => record.is_op_target)
      : songRecords
    const current = targetRecords.reduce(
      (maxOverPower, record) => Math.max(maxOverPower, record.overpower),
      0
    )
    currentOverPowerBySongId.set(songId, current)
  }

  return currentOverPowerBySongId
}
