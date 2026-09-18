import type { MasterItemDTO, WorldsendSongDTO } from '../../../../types/api'
import { compareMasterItemNames, createMasterItemOrderMap } from '../../../../utils/masterData'
import { compareSongsByReading } from '../../../../utils/songTitleSorting'
import {
  nextSortState as nextSharedSortState,
  type SortDirection,
} from '../../../../utils/sortingQuery'

/** WORLD'S END 楽曲一覧のソートキー */
export type WorldsendSongSortKey =
  | 'title'
  | 'artist'
  | 'genre'
  | 'release'
  | 'bpm'
  | 'attribute'
  | 'level'
  | 'notes'

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

/**
 * WORLD'S END 楽曲一覧のソート状態を次の状態へ進める。
 *
 * @param currentSortKey - 現在のソートキー。
 * @param currentSortDirection - 現在のソート方向。
 * @param nextKey - 選択されたソートキー。
 * @returns 次のソートキーと方向。同じキーを3回選ぶと解除される。
 */
export const nextSortState = (
  currentSortKey: WorldsendSongSortKey | null,
  currentSortDirection: SortDirection | null,
  nextKey: WorldsendSongSortKey
): {
  sortKey: WorldsendSongSortKey | null
  sortDirection: SortDirection | null
} => nextSharedSortState(currentSortKey, currentSortDirection, nextKey)

/**
 * WORLD'S END 楽曲を指定キーで安定ソートする。
 *
 * @param songs - ソート対象の楽曲。
 * @param currentSortKey - ソートキー。未指定なら入力順のまま返す。
 * @param currentSortDirection - 昇順または降順。未指定なら入力順のまま返す。
 * @param genres - ジャンルマスタ。ジャンルソート時の並び順に使う。
 * @returns ソート済みの楽曲配列。
 */
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
          comparison = compareSongsByReading(left, right)
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
        case 'notes':
          comparison = compareNullableNumber(leftChart?.notes, rightChart?.notes, direction)
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
