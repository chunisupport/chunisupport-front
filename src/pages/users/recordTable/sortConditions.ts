import type { SortDirection } from './sortingQuery'

/** 複数条件ソートで使う1行分のソート条件。 */
export type SortCondition<TSortKey extends string> = {
  key: TSortKey
  direction: SortDirection
}

/**
 * ソート条件を既定条件と同じ長さへ補正し、最後の条件を固定する。
 *
 * @param sortConditions - 補正対象のソート条件。
 * @param defaultSortConditions - 不足分と最後の固定条件に使う既定ソート条件。
 * @returns 不足分を既定値で補い、最後の条件を既定値で固定したソート条件。
 */
export const normalizeSortConditions = <TSortKey extends string>(
  sortConditions: SortCondition<TSortKey>[],
  defaultSortConditions: SortCondition<TSortKey>[]
): SortCondition<TSortKey>[] =>
  defaultSortConditions.map((defaultSortCondition, index) => {
    if (index === defaultSortConditions.length - 1) {
      return defaultSortCondition
    }

    return sortConditions[index] ?? defaultSortCondition
  })

/**
 * クエリ文字列などから取得した第1ソートと既定の後続ソートを組み合わせる。
 *
 * @param sortKey - 初期表示で第1ソートにする列キー。
 * @param sortDirection - 初期表示で第1ソートにする方向。
 * @param defaultSortConditions - 第2条件以降の補完に使う既定ソート条件。
 * @returns 補正済みの初期ソート条件。
 */
export const createInitialSortConditions = <TSortKey extends string>(
  sortKey: TSortKey,
  sortDirection: SortDirection,
  defaultSortConditions: SortCondition<TSortKey>[]
): SortCondition<TSortKey>[] =>
  normalizeSortConditions([{ key: sortKey, direction: sortDirection }], defaultSortConditions)

/**
 * 列ヘッダークリック時に第1ソートだけを更新する。
 *
 * @param currentSortCondition - 現在の第1ソート条件。
 * @param nextKey - 次に第1ソート対象にする列キー。
 * @returns 空状態を作らない次の第1ソート条件。
 */
export const nextPrimarySortCondition = <TSortKey extends string>(
  currentSortCondition: SortCondition<TSortKey> | null,
  nextKey: TSortKey
): SortCondition<TSortKey> => {
  if (currentSortCondition?.key !== nextKey) {
    return { key: nextKey, direction: 'asc' }
  }

  return {
    key: nextKey,
    direction: currentSortCondition.direction === 'asc' ? 'desc' : 'asc',
  }
}
