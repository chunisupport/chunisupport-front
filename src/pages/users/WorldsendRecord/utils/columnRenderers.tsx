import {
  type ColumnRenderer,
  RECORD_ALPHANUMERIC_COLUMN_CLASS,
  RECORD_CELL_BASE_CLASS,
  RECORD_CELL_CENTER_TEXT_CLASS,
  RecordFullChainCell,
  RecordHardLampCell,
  RecordJusticeCountCell,
  RecordLampCell,
  RecordScoreCell,
  RecordTitleCell,
  RecordUpdatedAtCell,
} from '../../components/SharedRecordTableColumns'
import { buildWorldsendSongDetailPath } from '../../UserPage/worldsendNavigation'
import { formatJusticeCountForAj } from '../../UserRecord/utils/justiceCountDisplay'
import { formatUpdatedAt } from '../../UserRecord/utils/updatedAt'
import type { WorldsendRecordWithSongMeta } from '../types/filterTypes'
import type { WorldsendRecordColumnId } from './columns'

/**
 * WORLD'S END の★レベルを表示用文字列へ変換する。
 *
 * @param levelStar - API から取得した★レベル値。
 * @returns 表示用の★レベル。未設定の場合はハイフン。
 */
const formatWorldsendLevelLabel = (levelStar: number | null | undefined): string => {
  if (typeof levelStar !== 'number' || levelStar <= 0) {
    return '-'
  }

  return `★${levelStar}`
}

/** WORLD'S END レコードの列IDごとのセル描画処理。 */
const worldsendColumnRenderers: Record<
  WorldsendRecordColumnId,
  ColumnRenderer<WorldsendRecordWithSongMeta>
> = {
  title: (record) => (
    <RecordTitleCell href={buildWorldsendSongDetailPath(record.id)} title={record.title} />
  ),
  attribute: (record) => (
    <div class={RECORD_CELL_CENTER_TEXT_CLASS}>
      <span class="inline-block w-full text-center leading-none">{record.attribute ?? '-'}</span>
    </div>
  ),
  level: (record) => (
    <div class={`${RECORD_CELL_BASE_CLASS} ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}>
      <span class="inline-block leading-none">{formatWorldsendLevelLabel(record.level_star)}</span>
    </div>
  ),
  score: (record) => <RecordScoreCell record={record} />,
  lamp: (record) => <RecordLampCell record={record} />,
  hardLamp: (record) => <RecordHardLampCell record={record} />,
  fullChain: (record) => <RecordFullChainCell record={record} />,
  justiceCount: (record) => (
    <RecordJusticeCountCell
      record={record}
      calcJusticeCount={(target) =>
        formatJusticeCountForAj({
          comboLamp: target.combo_lamp,
          justiceCount: target.justice_count,
        })
      }
    />
  ),
  updatedAt: (record) => <RecordUpdatedAtCell record={record} formatUpdatedAt={formatUpdatedAt} />,
}

/**
 * WORLD'S END レコード列IDに対応するセル描画処理を取得する。
 *
 * @param columnId - 描画対象の列ID。
 * @returns 指定列のセル描画処理。
 */
export const getWorldsendColumnRenderer = (
  columnId: WorldsendRecordColumnId
): ColumnRenderer<WorldsendRecordWithSongMeta> => {
  const renderer = worldsendColumnRenderers[columnId]
  if (!renderer) throw new Error(`Unknown worldsend column renderer: ${columnId}`)
  return renderer
}
