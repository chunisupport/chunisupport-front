import type { SortDirection } from './sortingQuery'

/** 複数条件ソートで使う1行分のソート条件 */
export type SortCondition<TSortKey extends string> = {
  key: TSortKey
  direction: SortDirection
}

/**
 * ソート条件を既定条件と同じ長さへ補正し、重複キーを除去したうえで最後の条件を固定する。
 *
 * 同じキーを複数条件に並べても後段がタイブレークにならないため、
 * 指定済みキーと重複する既定条件は飛ばし、残りの既定条件で補完する。
 * 最後の条件には既定の最終条件を使い、それが既に使われている場合は未使用の既定条件を使う。
 *
 * @param sortConditions - 補正対象のソート条件。
 * @param defaultSortConditions - 不足分と最後の固定条件に使う既定ソート条件。
 * @returns キー重複を除き、最後の条件を固定したソート条件。
 */
export const normalizeSortConditions = <TSortKey extends string>(
  sortConditions: SortCondition<TSortKey>[],
  defaultSortConditions: SortCondition<TSortKey>[]
): SortCondition<TSortKey>[] => {
  const normalized: SortCondition<TSortKey>[] = []
  const usedKeys = new Set<TSortKey>()
  const lastIndex = defaultSortConditions.length - 1
  const findUnusedDefault = (): SortCondition<TSortKey> | undefined =>
    defaultSortConditions.find((condition) => !usedKeys.has(condition.key))

  const append = (condition: SortCondition<TSortKey>): void => {
    normalized.push(condition)
    usedKeys.add(condition.key)
  }

  for (let index = 0; index < defaultSortConditions.length; index += 1) {
    if (index === lastIndex) {
      const preferredLastCondition = defaultSortConditions[lastIndex]
      const lastCondition =
        preferredLastCondition && !usedKeys.has(preferredLastCondition.key)
          ? preferredLastCondition
          : findUnusedDefault()
      if (lastCondition) append(lastCondition)
      continue
    }

    const requestedCondition = sortConditions[index]
    if (requestedCondition && !usedKeys.has(requestedCondition.key)) {
      append(requestedCondition)
      continue
    }

    const fallbackCondition = findUnusedDefault()
    if (fallbackCondition) append(fallbackCondition)
  }

  return normalized
}

/**
 * クエリ文字列などから取得した第1ソートと既定の後続ソートを組み合わせる。
 *
 * @param sortKey - 初期表示で第1ソートにする列キー。
 * @param sortDirection - 初期表示で第1ソートにする方向。
 * @param defaultSortConditions - 第2条件以降の補完に使う既定ソート条件。
 * @returns キー重複を除いた初期ソート条件。
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
