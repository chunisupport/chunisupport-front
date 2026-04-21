import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'

/**
 * 仮想リストで行を一意に識別するキーを返す。
 * インデックス依存キーを避け、ソート変更時にもDOM再利用の不整合を防ぐ。
 */
export const getRecordVirtualRowKey = (
  records: PlayerRecordWithSongMeta[],
  index: number
): string => {
  const record = records[index]
  if (!record) {
    return `record-row-${index}`
  }

  return `${record.id}:${record.difficulty}`
}
