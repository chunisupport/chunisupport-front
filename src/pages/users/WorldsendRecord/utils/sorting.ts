import type { WorldsendRecordDTO } from '../../../../types/api'
import {
  nextSortState as nextSharedSortState,
  parseSortQuery,
  type SortDirection,
  type SortParamsSource,
} from '../../recordTable/sortingQuery'
import { calcJusticeCountForAj } from '../../UserRecord/utils/justiceCount'
import {
  compareUpdatedAtWithMissingLast,
  updatedAtTimestamp,
} from '../../UserRecord/utils/updatedAt'
import { compareHardLamp } from '../../utils/lampSorting'
import type { WorldsendRecordSortKey } from './columns'

const LAMP_ORDER: Record<string, number> = {
  UNPLAYED: 0,
  NONE: 1,
  'FULL COMBO': 2,
  'ALL JUSTICE': 3,
}

const isUpdatedAtMissing = (isPlayed: boolean, timestamp: number): boolean =>
  !isPlayed || timestamp === Number.NEGATIVE_INFINITY

const WE_SORT_COL_MAP: Record<string, WorldsendRecordSortKey> = {
  title: 'title',
  attr: 'attribute',
  level: 'level',
  score: 'score',
  updated_at: 'updatedAt',
  lamp: 'lamp',
  hard_lamp: 'hardLamp',
  justice_count: 'justiceCount',
}

export const parseWorldsendSortParams = (searchParams: SortParamsSource) => {
  const parsed = parseSortQuery(searchParams, WE_SORT_COL_MAP, {
    sortKey: 'score',
    sortDirection: 'desc',
  })

  return {
    initialSortKey: parsed.sortKey,
    initialSortOrder: parsed.sortDirection,
  }
}

export const nextWorldsendSortState = (
  currentSortKey: WorldsendRecordSortKey | null,
  currentSortDirection: SortDirection | null,
  nextKey: WorldsendRecordSortKey
): {
  sortKey: WorldsendRecordSortKey | null
  sortDirection: SortDirection | null
} => nextSharedSortState(currentSortKey, currentSortDirection, nextKey)

export const sortWorldsendRecords = (
  records: WorldsendRecordDTO[],
  currentSortKey: WorldsendRecordSortKey | null,
  currentSortDirection: SortDirection | null
): WorldsendRecordDTO[] => {
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
            return 1
          } else if (rightUnplayed) {
            return -1
          } else {
            comparison = left.score - right.score
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
          if (leftMissing) return 1
          if (rightMissing) return -1

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
          const result = compareHardLamp(left, right)
          if (result.skipDirection) return result.comparison
          comparison = result.comparison
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
