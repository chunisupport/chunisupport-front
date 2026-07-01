import type { MasterItemDTO, WorldsendSongDTO } from '../../../../types/api'
import { compareMasterItemNames, createMasterItemOrderMap } from '../../../../utils/masterData'
import {
  nextSortState as nextSharedSortState,
  type SortDirection,
} from '../../../../utils/sortingQuery'

export type WorldsendSongSortKey =
  | 'title'
  | 'artist'
  | 'genre'
  | 'release'
  | 'bpm'
  | 'attribute'
  | 'level'

const jaCollator = new Intl.Collator('ja')

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

const compareNullableString = (
  left: string | null | undefined,
  right: string | null | undefined,
  direction: number
): number => {
  const leftMissing = left === null || left === undefined || left === ''
  const rightMissing = right === null || right === undefined || right === ''

  if (leftMissing && rightMissing) return 0
  if (leftMissing) return 1
  if (rightMissing) return -1

  return jaCollator.compare(left, right) * direction
}

const releaseTimestamp = (release: string | null): number | null => {
  const parsed = Date.parse(release ?? '')
  return Number.isFinite(parsed) ? parsed : null
}

export const nextSortState = (
  currentSortKey: WorldsendSongSortKey | null,
  currentSortDirection: SortDirection | null,
  nextKey: WorldsendSongSortKey
): {
  sortKey: WorldsendSongSortKey | null
  sortDirection: SortDirection | null
} => nextSharedSortState(currentSortKey, currentSortDirection, nextKey)

export const sortWorldsendSongs = (
  songs: WorldsendSongDTO[],
  currentSortKey: WorldsendSongSortKey | null,
  currentSortDirection: SortDirection | null,
  genres?: MasterItemDTO[]
): WorldsendSongDTO[] => {
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
      const leftChart = left.charts.WORLDSEND
      const rightChart = right.charts.WORLDSEND
      let comparison = 0

      switch (currentSortKey) {
        case 'title':
          comparison = jaCollator.compare(left.title, right.title)
          break
        case 'artist':
          comparison = jaCollator.compare(left.artist, right.artist)
          break
        case 'genre':
          if (!left.genre || !right.genre) {
            comparison = compareNullableString(left.genre, right.genre, direction)
          } else {
            comparison = compareMasterItemNames(left.genre, right.genre, genreOrderMap) * direction
          }
          if (comparison !== 0) return comparison
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
        case 'attribute':
          comparison = compareNullableString(leftChart?.attribute, rightChart?.attribute, direction)
          if (comparison !== 0) return comparison
          break
        case 'level':
          comparison = compareNullableNumber(
            leftChart?.level_star,
            rightChart?.level_star,
            direction
          )
          if (comparison !== 0) return comparison
          break
      }

      if (comparison !== 0) {
        return comparison * direction
      }

      return a.index - b.index
    })
    .map(({ song }) => song)
}
