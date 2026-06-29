import { type Component, createMemo } from 'solid-js'
import RecordDataTable from '../../components/RecordDataTable'
import type { WorldsendRecordWithSongMeta } from '../types/filterTypes'
import { getWorldsendColumnRenderer } from '../utils/columnRenderers'
import {
  getVisibleWorldsendColumns,
  type WorldsendRecordColumnId,
  type WorldsendRecordSortKey,
} from '../utils/columns'
import {
  DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS,
  sortWorldsendRecordsByConditions,
  type WorldsendRecordSortCondition,
} from '../utils/sorting'

type WorldsendRecordTableProps = {
  /** 表示対象の WORLD'S END レコード。 */
  records: WorldsendRecordWithSongMeta[]
  /** 現在の表示列ID。 */
  visibleColumnIds: WorldsendRecordColumnId[]
  /** 複数ソート条件。 */
  sortConditions: WorldsendRecordSortCondition[]
  /** ヘッダークリック時にソートキーを通知する処理。 */
  onSortChange: (nextKey: WorldsendRecordSortKey) => void
}

/**
 * WORLD'S END レコードを共通レコードテーブルで表示する。
 *
 * @param props - レコード、表示列、ソート状態、ソート変更ハンドラー。
 * @returns WORLD'S END レコードテーブル。
 */
const WorldsendRecordTable: Component<WorldsendRecordTableProps> = (props) => {
  const sortedRecords = createMemo(() =>
    sortWorldsendRecordsByConditions(props.records, props.sortConditions)
  )
  const visibleColumns = createMemo(() => getVisibleWorldsendColumns(props.visibleColumnIds))
  const primarySort = createMemo(
    () => props.sortConditions[0] ?? DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS[0]
  )

  return (
    <RecordDataTable
      records={sortedRecords()}
      columns={visibleColumns()}
      sortKey={primarySort().key}
      sortDirection={primarySort().direction}
      emptyMessage="WORLD'S END のレコードはありません。"
      getColumnRenderer={getWorldsendColumnRenderer}
      onSortChange={props.onSortChange}
    />
  )
}

export default WorldsendRecordTable
