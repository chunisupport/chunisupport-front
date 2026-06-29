import type { SortCondition } from './sortConditions'

type SortableEntry<TRecord> = {
  record: TRecord
  index: number
}

/**
 * 複数のソート条件を上から順に適用し、同順の場合は元の順序を維持する。
 *
 * @param records - ソート対象のレコード配列。
 * @param sortConditions - 優先順に並んだソート条件。
 * @param createEntry - 比較用の派生値を持つエントリへ変換する処理。
 * @param compareEntry - 1つのソート条件で2件のエントリを比較する処理。
 * @returns 指定条件で安定ソートしたレコード配列。
 */
export const sortRecordsWithConditions = <
  TRecord,
  TSortKey extends string,
  TEntry extends SortableEntry<TRecord>,
>(
  records: TRecord[],
  sortConditions: SortCondition<TSortKey>[],
  createEntry: (record: TRecord, index: number) => TEntry,
  compareEntry: (
    leftEntry: TEntry,
    rightEntry: TEntry,
    sortCondition: SortCondition<TSortKey>
  ) => number
): TRecord[] =>
  records
    .map(createEntry)
    .sort((leftEntry, rightEntry) => {
      for (const sortCondition of sortConditions) {
        const comparison = compareEntry(leftEntry, rightEntry, sortCondition)
        if (comparison !== 0) {
          return comparison
        }
      }

      return leftEntry.index - rightEntry.index
    })
    .map(({ record }) => record)
