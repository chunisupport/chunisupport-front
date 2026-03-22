import type { WorldsendRecordDTO } from '../../../types/api'

export type WorldsendSortKey = 'title' | 'attribute' | 'level' | 'score' | 'lamp'
export type WorldsendSortDirection = 'asc' | 'desc'

const worldsendLampOrder: Record<string, number> = {
  'ALL JUSTICE': 0,
  'FULL COMBO': 1,
  CATASTROPHY: 2,
  ABSOLUTE: 3,
  BRAVE: 4,
  HARD: 5,
  CLEAR: 6,
  FAILED: 7,
  NONE: 8,
  UNPLAYED: 9,
}

const getWorldsendLampKey = (record: WorldsendRecordDTO): string => {
  if (!record.is_played) return 'UNPLAYED'
  if (record.combo_lamp === 'ALL JUSTICE') return 'ALL JUSTICE'
  if (record.combo_lamp === 'FULL COMBO') return 'FULL COMBO'
  return record.clear_lamp ?? 'NONE'
}

export const sortWorldsendRecords = (
  records: WorldsendRecordDTO[],
  sortKey: WorldsendSortKey | null,
  sortDirection: WorldsendSortDirection | null
): WorldsendRecordDTO[] => {
  if (!sortKey || !sortDirection) {
    return records
  }

  const direction = sortDirection === 'asc' ? 1 : -1

  return records
    .map((record, index) => ({ record, index }))
    .sort((a, b) => {
      const left = a.record
      const right = b.record
      let comparison = 0

      switch (sortKey) {
        case 'title':
          comparison = left.title.localeCompare(right.title, 'ja')
          break
        case 'attribute':
          comparison = (left.attribute ?? '').localeCompare(right.attribute ?? '', 'ja')
          break
        case 'level':
          comparison =
            (left.level_star ?? Number.NEGATIVE_INFINITY) -
            (right.level_star ?? Number.NEGATIVE_INFINITY)
          break
        case 'score': {
          const leftUnplayed = !left.is_played
          const rightUnplayed = !right.is_played

          if (leftUnplayed && rightUnplayed) {
            comparison = 0
          } else if (leftUnplayed) {
            comparison = 1
          } else if (rightUnplayed) {
            comparison = -1
          } else {
            comparison = left.score - right.score
          }
          break
        }
        case 'lamp':
          comparison =
            (worldsendLampOrder[getWorldsendLampKey(left)] ?? Number.MAX_SAFE_INTEGER) -
            (worldsendLampOrder[getWorldsendLampKey(right)] ?? Number.MAX_SAFE_INTEGER)
          break
      }

      if (comparison !== 0) {
        return comparison * direction
      }

      return a.index - b.index
    })
    .map(({ record }) => record)
}
