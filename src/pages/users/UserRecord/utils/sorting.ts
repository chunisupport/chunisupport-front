import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import {
  nextSortState as nextSharedSortState,
  parseSortQuery,
  type SortDirection,
  type SortParamsSource,
} from '../../recordTable/sortingQuery'
import type { RecordSortKey } from '../types/types'
import { calcJusticeCountForAj } from './justiceCount.ts'
import { compareUpdatedAtWithMissingLast, updatedAtTimestamp } from './updatedAt.ts'

const DIFFICULTY_ORDER: Record<string, number> = {
  BASIC: 0,
  ADVANCED: 1,
  EXPERT: 2,
  MASTER: 3,
  ULTIMA: 4,
}

const LAMP_ORDER: Record<string, number> = {
  'ALL JUSTICE': 0,
  'FULL COMBO': 1,
  NONE: 2,
  UNPLAYED: 3,
}
const HARD_LAMP_ORDER: Record<string, number> = {
  CLEAR: 0,
  HARD: 1,
  BRAVE: 2,
  ABSOLUTE: 3,
  CATASTROPHY: 4,
  FAILED: 5,
  NONE: 6,
  UNPLAYED: 7,
}

const isUpdatedAtMissing = (isPlayed: boolean, timestamp: number): boolean =>
  !isPlayed || timestamp === Number.NEGATIVE_INFINITY

const RECORD_SORT_COL_MAP: Record<string, RecordSortKey> = {
  title: 'title',
  diff: 'difficulty',
  const: 'const',
  rating: 'rating',
  score: 'score',
  overpower: 'overpower',
  op_percent: 'overpowerPercent',
  updated_at: 'updatedAt',
  lamp: 'lamp',
  hard_lamp: 'hardLamp',
  justice_count: 'justiceCount',
}

const calcOverpowerPercent = (record: PlayerRecordWithSongMeta): number =>
  (record.overpower / ((record.const + 3) * 5)) * 100

export const parseSortParams = (searchParams: SortParamsSource) => {
  const parsed = parseSortQuery(searchParams, RECORD_SORT_COL_MAP, {
    sortKey: 'rating',
    sortDirection: 'desc',
  })

  return {
    initialSortKey: parsed.sortKey,
    initialSortOrder: parsed.sortDirection,
  }
}

export const nextSortState = (
  currentSortKey: RecordSortKey | null,
  currentSortDirection: SortDirection | null,
  nextKey: RecordSortKey
): {
  sortKey: RecordSortKey | null
  sortDirection: SortDirection | null
} => nextSharedSortState(currentSortKey, currentSortDirection, nextKey)

export const sortRecords = (
  records: PlayerRecordWithSongMeta[],
  currentSortKey: RecordSortKey | null,
  currentSortDirection: SortDirection | null
): PlayerRecordWithSongMeta[] => {
  if (!currentSortKey || !currentSortDirection) {
    return records
  }

  const direction = currentSortDirection === 'asc' ? 1 : -1

  return records
    .map((record, index) => ({
      record,
      index,
      updatedAtTs: updatedAtTimestamp(record.updated_at),
    }))
    .sort((a, b) => {
      const left = a.record
      const right = b.record
      let comparison = 0

      switch (currentSortKey) {
        case 'title':
          comparison = left.title.localeCompare(right.title, 'ja')
          break
        case 'difficulty':
          comparison =
            (DIFFICULTY_ORDER[left.difficulty] ?? Number.MAX_SAFE_INTEGER) -
            (DIFFICULTY_ORDER[right.difficulty] ?? Number.MAX_SAFE_INTEGER)
          break
        case 'const':
          comparison = left.const - right.const
          break
        case 'rating': {
          const leftUnplayed = !left.is_played
          const rightUnplayed = !right.is_played

          if (leftUnplayed && rightUnplayed) {
            comparison = 0
          } else if (leftUnplayed) {
            return 1
          } else if (rightUnplayed) {
            return -1
          } else {
            comparison = left.rating - right.rating
          }
          break
        }
        case 'score': {
          const leftUnplayed = !left.is_played
          const rightUnplayed = !right.is_played

          if (leftUnplayed && rightUnplayed) {
            comparison = 0
          } else if (leftUnplayed) {
            return 1
          } else if (rightUnplayed) {
            return -1
          } else {
            comparison = left.score - right.score
          }
          break
        }
        case 'overpower': {
          const leftUnplayed = !left.is_played
          const rightUnplayed = !right.is_played

          if (leftUnplayed && rightUnplayed) {
            comparison = 0
          } else if (leftUnplayed) {
            return 1
          } else if (rightUnplayed) {
            return -1
          } else {
            comparison = left.overpower - right.overpower
          }
          break
        }
        case 'overpowerPercent': {
          const leftUnplayed = !left.is_played
          const rightUnplayed = !right.is_played

          if (leftUnplayed && rightUnplayed) {
            comparison = 0
          } else if (leftUnplayed) {
            return 1
          } else if (rightUnplayed) {
            return -1
          } else {
            comparison = calcOverpowerPercent(left) - calcOverpowerPercent(right)
          }
          break
        }
        case 'updatedAt': {
          const leftMissing = isUpdatedAtMissing(left.is_played, a.updatedAtTs)
          const rightMissing = isUpdatedAtMissing(right.is_played, b.updatedAtTs)

          comparison = compareUpdatedAtWithMissingLast(
            { isPlayed: left.is_played, updatedAtTimestamp: a.updatedAtTs },
            { isPlayed: right.is_played, updatedAtTimestamp: b.updatedAtTs }
          )

          if (leftMissing || rightMissing) {
            return comparison
          }
          break
        }

        case 'justiceCount': {
          const leftJusticeCount = calcJusticeCountForAj({
            comboLamp: left.combo_lamp,
            score: left.score,
            notes: left.notes,
          })
          const rightJusticeCount = calcJusticeCountForAj({
            comboLamp: right.combo_lamp,
            score: right.score,
            notes: right.notes,
          })

          const leftMissing = leftJusticeCount === '' || leftJusticeCount === '-'
          const rightMissing = rightJusticeCount === '' || rightJusticeCount === '-'

          if (leftMissing && rightMissing) {
            comparison = 0
            break
          }

          if (leftMissing) {
            return 1
          }

          if (rightMissing) {
            return -1
          }

          comparison = leftJusticeCount - rightJusticeCount
          break
        }
        case 'lamp': {
          const leftMissing = !left.is_played || left.combo_lamp === null
          const rightMissing = !right.is_played || right.combo_lamp === null

          if (leftMissing && rightMissing) {
            comparison = 0
            break
          }

          if (leftMissing) {
            return 1
          }

          if (rightMissing) {
            return -1
          }

          const leftLampKey = !left.is_played
            ? 'UNPLAYED'
            : left.combo_lamp === null
              ? 'NONE'
              : left.combo_lamp
          const rightLampKey = !right.is_played
            ? 'UNPLAYED'
            : right.combo_lamp === null
              ? 'NONE'
              : right.combo_lamp

          comparison =
            (LAMP_ORDER[leftLampKey] ?? Number.MAX_SAFE_INTEGER) -
            (LAMP_ORDER[rightLampKey] ?? Number.MAX_SAFE_INTEGER)
          break
        }
        case 'hardLamp': {
          const leftMissing = !left.is_played || left.clear_lamp === null
          const rightMissing = !right.is_played || right.clear_lamp === null
          if (leftMissing && rightMissing) {
            comparison = 0
            break
          }
          if (leftMissing) return 1
          if (rightMissing) return -1
          const leftLampKey = !left.is_played
            ? 'UNPLAYED'
            : left.clear_lamp === null
              ? 'NONE'
              : left.clear_lamp
          const rightLampKey = !right.is_played
            ? 'UNPLAYED'
            : right.clear_lamp === null
              ? 'NONE'
              : right.clear_lamp
          comparison =
            (HARD_LAMP_ORDER[leftLampKey] ?? Number.MAX_SAFE_INTEGER) -
            (HARD_LAMP_ORDER[rightLampKey] ?? Number.MAX_SAFE_INTEGER)
          break
        }
      }

      if (comparison !== 0) {
        return comparison * direction
      }

      return a.index - b.index
    })
    .map(({ record }) => record)
}
