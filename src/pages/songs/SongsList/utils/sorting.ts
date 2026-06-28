import type { MasterItemDTO, SongDTO } from '../../../../types/api.ts'
import { compareMasterItemNames, createMasterItemOrderMap } from '../../../../utils/masterData.ts'
import {
  nextSortState as nextSharedSortState,
  type SortDirection,
} from '../../../users/recordTable/sortingQuery.ts'

export type SongSortKey =
  | 'title'
  | 'artist'
  | 'genre'
  | 'release'
  | 'bpm'
  | 'basic'
  | 'advanced'
  | 'expert'
  | 'master'
  | 'ultima'

const jaCollator = new Intl.Collator('ja')

const CHART_SORT_KEY_MAP = {
  basic: 'BASIC',
  advanced: 'ADVANCED',
  expert: 'EXPERT',
  master: 'MASTER',
  ultima: 'ULTIMA',
} as const satisfies Partial<Record<SongSortKey, keyof SongDTO['charts']>>

const compareNullableNumber = (
  left: number | null | undefined,
  right: number | null | undefined,
  direction: number
): number => {
  const leftMissing = left === null || left === undefined
  const rightMissing = right === null || right === undefined

  if (leftMissing && rightMissing) return 0
  if (leftMissing) return 1
  if (rightMissing) return -1

  return (left - right) * direction
}

const releaseTimestamp = (release: string | null): number | null => {
  const parsed = Date.parse(release ?? '')
  return Number.isFinite(parsed) ? parsed : null
}

export const nextSortState = (
  currentSortKey: SongSortKey | null,
  currentSortDirection: SortDirection | null,
  nextKey: SongSortKey
): {
  sortKey: SongSortKey | null
  sortDirection: SortDirection | null
} => nextSharedSortState(currentSortKey, currentSortDirection, nextKey)

export const sortSongs = (
  songs: SongDTO[],
  currentSortKey: SongSortKey | null,
  currentSortDirection: SortDirection | null,
  genres?: MasterItemDTO[]
): SongDTO[] => {
  if (!currentSortKey || !currentSortDirection) {
    return songs
  }

  const direction = currentSortDirection === 'asc' ? 1 : -1
  const genreOrderMap = createMasterItemOrderMap(genres)

  return songs
    .map((song, index) => ({ song, index }))
    .sort((a, b) => {
      const left = a.song
      const right = b.song
      let comparison = 0

      switch (currentSortKey) {
        case 'title':
          comparison = jaCollator.compare(left.title, right.title)
          break
        case 'artist':
          comparison = jaCollator.compare(left.artist, right.artist)
          break
        case 'genre':
          comparison = compareMasterItemNames(left.genre, right.genre, genreOrderMap)
          break
        case 'release':
          comparison = compareNullableNumber(
            releaseTimestamp(left.release),
            releaseTimestamp(right.release),
            direction
          )
          if (comparison !== 0) return comparison
          break
        case 'bpm':
          comparison = compareNullableNumber(left.bpm, right.bpm, direction)
          if (comparison !== 0) return comparison
          break
        default: {
          const difficulty = CHART_SORT_KEY_MAP[currentSortKey]
          const leftChart = left.charts[difficulty]
          const rightChart = right.charts[difficulty]
          comparison = compareNullableNumber(leftChart?.const, rightChart?.const, direction)
          if (comparison !== 0) return comparison
          break
        }
      }

      if (comparison !== 0) {
        return comparison * direction
      }

      return a.index - b.index
    })
    .map(({ song }) => song)
}
