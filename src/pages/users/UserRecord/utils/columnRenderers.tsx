import { Show } from 'solid-js'

import {
  difficultyBadgeClass,
  difficultyShort,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import {
  type ColumnRenderer,
  RECORD_ALPHANUMERIC_COLUMN_CLASS,
  RECORD_ROW_MIN_HEIGHT_CLASS,
  RecordLampCell,
  RecordScoreCell,
  RecordTitleCell,
  RecordUpdatedAtCell,
} from '../../components/SharedRecordTableColumns'
import type { RecordColumnId } from '../types/types'
import { getConstDisplay, getRatingDisplay } from './constDisplay'
import { calcJusticeCountForAj } from './justiceCount'
import { formatUpdatedAt } from './updatedAt'

const DIFFICULTY_BADGE_CLASS =
  'inline-flex h-6 w-7 items-center justify-center rounded-lg px-1 text-sm font-bold leading-none'
const BASE_CELL_CLASS = `flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-center whitespace-nowrap`
const DIFFICULTY_COLUMN_CLASS = `${BASE_CELL_CLASS} font-oswald text-sm font-semibold`

export const recordColumnRenderers: Record<
  RecordColumnId,
  ColumnRenderer<PlayerRecordWithSongMeta>
> = {
  title: (record) => (
    <RecordTitleCell
      href={`/songs/${encodeURIComponent(record.id)}?diff=${encodeURIComponent(difficultyToQueryValue(record.difficulty))}`}
      title={record.title}
    />
  ),
  difficulty: (record) => (
    <div class={DIFFICULTY_COLUMN_CLASS}>
      <span class={`${DIFFICULTY_BADGE_CLASS} ${difficultyBadgeClass(record.difficulty)}`}>
        {difficultyShort(record.difficulty)}
      </span>
    </div>
  ),
  const: (record) => {
    const constDisplay = getConstDisplay(record.const, record.is_const_unknown)
    return (
      <div class={`${BASE_CELL_CLASS} ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}>
        <span class={`inline-block w-full text-center leading-none ${constDisplay.className}`}>
          {constDisplay.valueText}
          <Show when={constDisplay.markerText}>
            {(m) => <sup class="align-super text-[0.7em]">{m}</sup>}
          </Show>
        </span>
      </div>
    )
  },
  score: (record) => <RecordScoreCell record={record} />,
  rating: (record) => {
    const ratingDisplay = getRatingDisplay(record.rating, record.is_played, record.is_const_unknown)
    return (
      <div class={`${BASE_CELL_CLASS} ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}>
        <span class={`inline-block w-full text-center leading-none ${ratingDisplay.className}`}>
          {ratingDisplay.text}
        </span>
      </div>
    )
  },
  lamp: (record) => <RecordLampCell record={record} />,
  justiceCount: (record) => {
    const justiceCount = calcJusticeCountForAj({
      comboLamp: record.combo_lamp,
      score: record.score,
      notes: record.notes,
    })
    return (
      <div class={`${BASE_CELL_CLASS} ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}>
        <span class="inline-block w-full text-center leading-none">{justiceCount}</span>
      </div>
    )
  },
  updatedAt: (record) => <RecordUpdatedAtCell record={record} formatUpdatedAt={formatUpdatedAt} />,
}

export const getRecordColumnRenderer = (
  columnId: RecordColumnId
): ColumnRenderer<PlayerRecordWithSongMeta> => {
  const renderer = recordColumnRenderers[columnId]
  if (!renderer) throw new Error(`Unknown record column renderer: ${columnId}`)
  return renderer
}
