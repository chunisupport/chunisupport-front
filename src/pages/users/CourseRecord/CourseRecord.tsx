import type { Component } from 'solid-js'
import { createMemo, createSignal } from 'solid-js'
import type { CourseRecordDTO } from '../../../types/api'
import { nextPrimarySortCondition } from '../../../utils/sortConditions'
import RecordDataTable from '../components/RecordDataTable'
import { getCourseRecordColumnRenderer } from './columnRenderers'
import { COURSE_RECORD_COLUMN_DEFINITIONS, type CourseRecordSortKey } from './columns'
import { COURSE_RECORD_EMPTY_MESSAGE, COURSE_RECORD_TABLE_ARIA_LABEL } from './constants'
import {
  type CourseRecordSortCondition,
  DEFAULT_COURSE_RECORD_SORT_CONDITION,
  sortCourseRecords,
} from './sorting'

type Props = {
  /** 表示対象のコースレコード。 */
  records: CourseRecordDTO[]
}

/**
 * コースモードのレコードを共通レコードテーブルで表示する。
 *
 * @param props - 表示するコースレコード一覧。
 * @returns 既存レコード列と同じ幅・セルを使ったコースレコード表。
 */
const CourseRecord: Component<Props> = (props) => {
  const [sortCondition, setSortCondition] = createSignal<CourseRecordSortCondition>(
    DEFAULT_COURSE_RECORD_SORT_CONDITION
  )
  const sortedRecords = createMemo(() => sortCourseRecords(props.records, sortCondition()))

  /**
   * 選択された列を第1ソートへ設定し、同じ列なら昇降順を切り替える。
   *
   * @param nextKey - 次にソートするコースレコード列。
   * @returns なし。
   */
  const handleSortChange = (nextKey: CourseRecordSortKey): void => {
    setSortCondition((current) => nextPrimarySortCondition(current, nextKey))
  }

  return (
    <div class="mx-2 text-sm">
      <RecordDataTable
        records={sortedRecords()}
        columns={COURSE_RECORD_COLUMN_DEFINITIONS}
        sortKey={sortCondition().key}
        sortDirection={sortCondition().direction}
        emptyMessage={COURSE_RECORD_EMPTY_MESSAGE}
        ariaLabel={COURSE_RECORD_TABLE_ARIA_LABEL}
        getColumnRenderer={getCourseRecordColumnRenderer}
        onSortChange={handleSortChange}
      />
    </div>
  )
}

export default CourseRecord
