import type { WorldsendRecordDTO } from '../../../../types/api'
import { compareUnplayedRecords } from '../../recordTable/sortComparators'
import {
  createInitialSortConditions,
  nextPrimarySortCondition,
  normalizeSortConditions,
  type SortCondition,
} from '../../recordTable/sortConditions'
import {
  parseSortQuery,
  type SortDirection,
  type SortParamsSource,
} from '../../recordTable/sortingQuery'
import { sortRecordsWithConditions } from '../../recordTable/sortRecords'
import { formatJusticeCountForAj } from '../../UserRecord/utils/justiceCountDisplay'
import {
  compareUpdatedAtWithMissingLast,
  updatedAtTimestamp,
} from '../../UserRecord/utils/updatedAt'
import {
  compareMissingJusticeCountRecords,
  isJusticeCountMissing,
} from '../../utils/justiceCountSorting'
import { compareComboLamp, compareFullChainLamp, compareHardLamp } from '../../utils/lampSorting'
import type { WorldsendRecordSortKey } from './columns'

/** WORLD'S END レコードのソート条件。 */
export type WorldsendRecordSortCondition = SortCondition<WorldsendRecordSortKey>

type SortableWorldsendRecordEntry<TRecord extends WorldsendRecordDTO> = {
  record: TRecord
  index: number
  updatedAtTs: number
  justiceCountForAj: number | '' | '-'
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
  full_chain: 'fullChain',
  justice_count: 'justiceCount',
}

/** WORLD'S END レコード一覧で常に適用する既定ソート条件。 */
export const DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS: WorldsendRecordSortCondition[] = [
  { key: 'score', direction: 'desc' },
  { key: 'attribute', direction: 'asc' },
  { key: 'level', direction: 'desc' },
  { key: 'title', direction: 'asc' },
]

/**
 * WORLD'S END のソート条件を常に4条件へ補正する。
 *
 * @param sortConditions - 補正対象のソート条件。
 * @returns 不足分を既定値で補い、第4ソートを曲名昇順固定にした4条件のソート条件。
 */
export const normalizeWorldsendRecordSortConditions = (
  sortConditions: WorldsendRecordSortCondition[]
): WorldsendRecordSortCondition[] =>
  normalizeSortConditions(sortConditions, DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS)

/**
 * URLクエリから WORLD'S END レコードの初期ソート条件を取得する。
 *
 * @param searchParams - URLクエリパラメータ。
 * @returns 初期ソート列と初期ソート方向。
 */
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

/**
 * クエリ文字列から取得した第1ソートと既定の第2〜第4ソートを組み合わせる。
 *
 * @param sortKey - 初期表示で第1ソートにする列キー。
 * @param sortDirection - 初期表示で第1ソートにする方向。
 * @returns 4条件を持つ初期ソート条件。
 */
export const createInitialWorldsendRecordSortConditions = (
  sortKey: WorldsendRecordSortKey,
  sortDirection: SortDirection
): WorldsendRecordSortCondition[] =>
  createInitialSortConditions(sortKey, sortDirection, DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS)

/**
 * 列ヘッダークリック時に第1ソートだけを更新する。
 *
 * @param currentSortCondition - 現在の第1ソート条件。
 * @param nextKey - 次に第1ソート対象にする列キー。
 * @returns 空状態を作らない次の第1ソート条件。
 */
export const nextPrimaryWorldsendRecordSortCondition = (
  currentSortCondition: WorldsendRecordSortCondition | null,
  nextKey: WorldsendRecordSortKey
): WorldsendRecordSortCondition => nextPrimarySortCondition(currentSortCondition, nextKey)

/**
 * 1つのソート条件で WORLD'S END レコードを比較する。
 *
 * @param leftEntry - 左側の比較対象。
 * @param rightEntry - 右側の比較対象。
 * @param sortCondition - 適用するソート条件。
 * @returns ソート条件に基づく比較結果。
 */
const compareWorldsendRecordBySortCondition = <TRecord extends WorldsendRecordDTO>(
  leftEntry: SortableWorldsendRecordEntry<TRecord>,
  rightEntry: SortableWorldsendRecordEntry<TRecord>,
  sortCondition: WorldsendRecordSortCondition
): number => {
  const left = leftEntry.record
  const right = rightEntry.record
  const direction = sortCondition.direction === 'asc' ? 1 : -1
  let comparison = 0

  switch (sortCondition.key) {
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
      const unplayedComparison = compareUnplayedRecords(left.is_played, right.is_played)
      if (unplayedComparison !== null) return unplayedComparison
      comparison = left.score - right.score
      break
    }
    case 'updatedAt': {
      const leftMissing = isUpdatedAtMissing(left.is_played, leftEntry.updatedAtTs)
      const rightMissing = isUpdatedAtMissing(right.is_played, rightEntry.updatedAtTs)

      comparison = compareUpdatedAtWithMissingLast(
        { isPlayed: left.is_played, updatedAtTimestamp: leftEntry.updatedAtTs },
        { isPlayed: right.is_played, updatedAtTimestamp: rightEntry.updatedAtTs }
      )

      if (leftMissing || rightMissing) {
        return comparison
      }
      break
    }
    case 'justiceCount': {
      const leftJusticeCount = leftEntry.justiceCountForAj
      const rightJusticeCount = rightEntry.justiceCountForAj

      const leftMissing = isJusticeCountMissing(leftJusticeCount)
      const rightMissing = isJusticeCountMissing(rightJusticeCount)

      if (leftMissing && rightMissing) {
        return compareMissingJusticeCountRecords(left, right)
      }
      if (leftMissing) return 1
      if (rightMissing) return -1

      comparison = leftJusticeCount - rightJusticeCount
      break
    }
    case 'lamp': {
      const result = compareComboLamp(left, right)
      if (result.skipDirection) return result.comparison
      comparison = result.comparison
      break
    }
    case 'hardLamp': {
      const result = compareHardLamp(left, right)
      if (result.skipDirection) return result.comparison
      comparison = result.comparison
      break
    }
    case 'fullChain': {
      const result = compareFullChainLamp(left, right)
      if (result.skipDirection) return result.comparison
      comparison = result.comparison
      break
    }
  }

  return comparison * direction
}

/**
 * WORLD'S END レコードを指定済みソート条件でソートする。
 *
 * @param records - ソート対象の WORLD'S END レコード配列。
 * @param sortConditions - 正規化済み、または単一条件のソート条件。
 * @returns 指定条件で並べ替えた WORLD'S END レコード配列。
 */
const sortWorldsendRecordsByResolvedConditions = <TRecord extends WorldsendRecordDTO>(
  records: TRecord[],
  sortConditions: WorldsendRecordSortCondition[]
): TRecord[] =>
  sortRecordsWithConditions(
    records,
    sortConditions,
    (record, index): SortableWorldsendRecordEntry<TRecord> => ({
      record,
      index,
      updatedAtTs: updatedAtTimestamp(record.updated_at),
      justiceCountForAj: formatJusticeCountForAj({
        comboLamp: record.combo_lamp,
        justiceCount: record.justice_count,
      }),
    }),
    compareWorldsendRecordBySortCondition
  )

/**
 * WORLD'S END レコードを複数条件でソートする。
 *
 * @param records - ソート対象の WORLD'S END レコード配列。
 * @param sortConditions - 適用するソート条件。
 * @returns 複数条件で並べ替えた WORLD'S END レコード配列。
 */
export const sortWorldsendRecordsByConditions = <TRecord extends WorldsendRecordDTO>(
  records: TRecord[],
  sortConditions: WorldsendRecordSortCondition[]
): TRecord[] =>
  sortWorldsendRecordsByResolvedConditions(
    records,
    normalizeWorldsendRecordSortConditions(sortConditions)
  )

/**
 * WORLD'S END レコードを単一条件でソートする。
 *
 * @param records - ソート対象の WORLD'S END レコード配列。
 * @param currentSortKey - ソート対象の列キー。未指定の場合はソートしない。
 * @param currentSortDirection - ソート方向。未指定の場合はソートしない。
 * @returns 単一条件で並べ替えた WORLD'S END レコード配列。
 */
export const sortWorldsendRecords = <TRecord extends WorldsendRecordDTO>(
  records: TRecord[],
  currentSortKey: WorldsendRecordSortKey | null,
  currentSortDirection: SortDirection | null
): TRecord[] => {
  if (!currentSortKey || !currentSortDirection) {
    return records
  }

  return sortWorldsendRecordsByResolvedConditions(records, [
    { key: currentSortKey, direction: currentSortDirection },
  ])
}
