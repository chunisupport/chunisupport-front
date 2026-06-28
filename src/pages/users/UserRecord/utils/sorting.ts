import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger.ts'
import {
  parseSortQuery,
  type SortDirection,
  type SortParamsSource,
} from '../../recordTable/sortingQuery.ts'
import {
  compareMissingJusticeCountRecords,
  isJusticeCountMissing,
} from '../../utils/justiceCountSorting.ts'
import { compareComboLamp, compareFullChainLamp, compareHardLamp } from '../../utils/lampSorting.ts'
import type { RecordSortCondition, RecordSortKey } from '../types/types.ts'
import { formatJusticeCountForAj } from './justiceCountDisplay.ts'
import { compareUpdatedAtWithMissingLast, updatedAtTimestamp } from './updatedAt.ts'

const DIFFICULTY_ORDER: Record<string, number> = {
  BASIC: 0,
  ADVANCED: 1,
  EXPERT: 2,
  MASTER: 3,
  ULTIMA: 4,
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
  full_chain: 'fullChain',
  justice_count: 'justiceCount',
}

/** 通常レコード一覧で常に適用する既定ソート条件。 */
export const DEFAULT_RECORD_SORT_CONDITIONS: RecordSortCondition[] = [
  { key: 'rating', direction: 'desc' },
  { key: 'const', direction: 'desc' },
  { key: 'difficulty', direction: 'desc' },
  { key: 'title', direction: 'asc' },
]

/**
 * ソート条件を常に4条件へ補正する。
 *
 * @param sortConditions - 補正対象のソート条件。
 * @returns 不足分を既定値で補い、第4ソートを曲名昇順固定にした4条件のソート条件。
 */
export const normalizeRecordSortConditions = (
  sortConditions: RecordSortCondition[]
): RecordSortCondition[] =>
  DEFAULT_RECORD_SORT_CONDITIONS.map((defaultSortCondition, index) => {
    if (index === DEFAULT_RECORD_SORT_CONDITIONS.length - 1) {
      return defaultSortCondition
    }

    return sortConditions[index] ?? defaultSortCondition
  })

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

/**
 * クエリ文字列から取得した第1ソートと既定の第2〜第4ソートを組み合わせる。
 *
 * @param sortKey - 初期表示で第1ソートにする列キー。
 * @param sortDirection - 初期表示で第1ソートにする方向。
 * @returns 4条件を持つ初期ソート条件。
 */
export const createInitialRecordSortConditions = (
  sortKey: RecordSortKey,
  sortDirection: SortDirection
): RecordSortCondition[] =>
  normalizeRecordSortConditions([{ key: sortKey, direction: sortDirection }])

/**
 * 列ヘッダークリック時に第1ソートだけを更新する。
 *
 * @param currentSortCondition - 現在の第1ソート条件。
 * @param nextKey - 次に第1ソート対象にする列キー。
 * @returns 空状態を作らない次の第1ソート条件。
 */
export const nextPrimaryRecordSortCondition = (
  currentSortCondition: RecordSortCondition | null,
  nextKey: RecordSortKey
): RecordSortCondition => {
  if (currentSortCondition?.key !== nextKey) {
    return { key: nextKey, direction: 'asc' }
  }

  return {
    key: nextKey,
    direction: currentSortCondition.direction === 'asc' ? 'desc' : 'asc',
  }
}

type SortableRecordEntry = {
  record: PlayerRecordWithSongMeta
  index: number
  updatedAtTs: number
  justiceCountForAj: number | '' | '-'
}

/**
 * 未プレイのレコードをソート方向に関係なく末尾へ寄せる。
 *
 * @param leftPlayed - 左側レコードがプレイ済みかどうか。
 * @param rightPlayed - 右側レコードがプレイ済みかどうか。
 * @returns 未プレイ判定だけで順序が決まる場合は比較結果、両方プレイ済みの場合はnull。
 */
const compareUnplayed = (leftPlayed: boolean, rightPlayed: boolean): number | null => {
  if (!leftPlayed && !rightPlayed) {
    return 0
  }

  if (!leftPlayed) {
    return 1
  }

  if (!rightPlayed) {
    return -1
  }

  return null
}

/**
 * 1つのソート条件で2件のレコードを比較する。
 *
 * @param a - 比較対象の左側レコード情報。
 * @param b - 比較対象の右側レコード情報。
 * @param sortCondition - 比較に使うソートキーと方向。
 * @returns 並び順に差がある場合は正負の数、同順の場合は0。
 */
const compareRecordBySortCondition = (
  a: SortableRecordEntry,
  b: SortableRecordEntry,
  sortCondition: RecordSortCondition
): number => {
  const left = a.record
  const right = b.record
  const direction = sortCondition.direction === 'asc' ? 1 : -1
  let comparison = 0

  switch (sortCondition.key) {
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
      const unplayedComparison = compareUnplayed(left.is_played, right.is_played)
      if (unplayedComparison !== null) return unplayedComparison

      comparison = left.rating - right.rating
      break
    }
    case 'score': {
      const unplayedComparison = compareUnplayed(left.is_played, right.is_played)
      if (unplayedComparison !== null) return unplayedComparison

      comparison = left.score - right.score
      break
    }
    case 'overpower': {
      const unplayedComparison = compareUnplayed(left.is_played, right.is_played)
      if (unplayedComparison !== null) return unplayedComparison

      comparison = left.overpower - right.overpower
      break
    }
    case 'overpowerPercent': {
      const unplayedComparison = compareUnplayed(left.is_played, right.is_played)
      if (unplayedComparison !== null) return unplayedComparison

      comparison = left.overpower_percent - right.overpower_percent
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
      const leftJusticeCount = a.justiceCountForAj
      const rightJusticeCount = b.justiceCountForAj

      const leftMissing = isJusticeCountMissing(leftJusticeCount)
      const rightMissing = isJusticeCountMissing(rightJusticeCount)

      if (leftMissing && rightMissing) {
        return compareMissingJusticeCountRecords(left, right)
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
 * 正規化済み、または単一条件のソート条件でレコードをソートする。
 *
 * @param records - ソート対象のレコード配列。
 * @param sortConditions - 適用するソート条件。
 * @returns 指定条件で並び替えたレコード配列。
 */
const sortRecordsByResolvedConditions = (
  records: PlayerRecordWithSongMeta[],
  sortConditions: RecordSortCondition[]
): PlayerRecordWithSongMeta[] => {
  return records
    .map((record, index) => ({
      record,
      index,
      updatedAtTs: updatedAtTimestamp(record.updated_at),
      justiceCountForAj: formatJusticeCountForAj({
        comboLamp: record.combo_lamp,
        justiceCount: record.justice_count,
      }),
    }))
    .sort((a, b) => {
      for (const sortCondition of sortConditions) {
        const comparison = compareRecordBySortCondition(a, b, sortCondition)
        if (comparison !== 0) {
          return comparison
        }
      }

      return a.index - b.index
    })
    .map(({ record }) => record)
}

/**
 * 指定された複数の条件を上から順に使ってレコードをソートする。
 *
 * @param records - ソート対象のレコード配列。
 * @param sortConditions - 優先順に並んだソート条件。
 * @returns 正規化した複数条件で並び替えたレコード配列。
 */
export const sortRecordsByConditions = (
  records: PlayerRecordWithSongMeta[],
  sortConditions: RecordSortCondition[]
): PlayerRecordWithSongMeta[] =>
  sortRecordsByResolvedConditions(records, normalizeRecordSortConditions(sortConditions))

/**
 * 互換用に単一条件でレコードをソートする。
 *
 * @param records - ソート対象のレコード配列。
 * @param currentSortKey - ソート対象列。未指定の場合はソートしない。
 * @param currentSortDirection - ソート方向。未指定の場合はソートしない。
 * @returns 単一条件で並び替えたレコード配列。条件がない場合は元の配列。
 */
export const sortRecords = (
  records: PlayerRecordWithSongMeta[],
  currentSortKey: RecordSortKey | null,
  currentSortDirection: SortDirection | null
): PlayerRecordWithSongMeta[] => {
  if (!currentSortKey || !currentSortDirection) {
    return records
  }

  return sortRecordsByResolvedConditions(records, [
    { key: currentSortKey, direction: currentSortDirection },
  ])
}
