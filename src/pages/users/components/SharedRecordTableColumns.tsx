import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'

import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api'
import { getScoreRank, MAX_SCORE, type ScoreRank } from '../../../utils/scoreRank'
import { LampPlaceholderBadge, renderSortIndicator } from './RecordTableUiParts'

type SharedSortDirection = 'asc' | 'desc' | null
type SharedRecordSource = PlayerRecordDTO | WorldsendRecordDTO
type ComboLamp = SharedRecordSource['combo_lamp']
type ClearLamp = SharedRecordSource['clear_lamp']
type ScoreRecord = Pick<SharedRecordSource, 'is_played' | 'score'>
type LampRecord = Pick<SharedRecordSource, 'is_played' | 'combo_lamp' | 'score'>
type HardLampRecord = Pick<SharedRecordSource, 'is_played' | 'clear_lamp'>

type JusticeCountRecord = Pick<SharedRecordSource, 'combo_lamp' | 'score' | 'notes'>
type UpdatedAtRecord = Pick<SharedRecordSource, 'is_played' | 'updated_at'>
type LampBadgeRenderer = (lamp: ComboLamp, record?: LampRecord) => JSX.Element
export type ColumnRenderer<TRecord> = (record: TRecord) => JSX.Element

type RecordHeaderButtonProps = {
  label: string
  active: boolean
  direction: SharedSortDirection
  align?: 'start' | 'center'
  class?: string
  onClick: () => void
}

type RecordTitleCellProps = {
  href: string
  title: string
}

export const RECORD_HOVER_TRANSITION_CLASS = 'transition-colors'
export const RECORD_ROW_HOVER_CLASS = `${RECORD_HOVER_TRANSITION_CLASS} hover:bg-green-50`
export const RECORD_CARD_HOVER_CLASS = `${RECORD_HOVER_TRANSITION_CLASS} group-hover:bg-green-50`
export const RECORD_ROW_HEIGHT = 34
export const RECORD_ROW_MIN_HEIGHT_CLASS = 'min-h-[34px]'
export const RECORD_HEADER_BUTTON_CLASS = `flex ${RECORD_ROW_MIN_HEIGHT_CLASS} w-full items-center text-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset`
export const RECORD_ALPHANUMERIC_COLUMN_CLASS = 'text-sm'
export const RECORD_CELL_BASE_CLASS = `flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-center whitespace-nowrap`
export const RECORD_CELL_CENTER_TEXT_CLASS = `${RECORD_CELL_BASE_CLASS} text-center ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`
export const RECORD_LAMP_COLUMN_CLASS = 'font-oswald text-sm font-semibold'
const HARD_LAMP_BADGE_CLASS =
  'inline-flex w-[40px] items-center justify-center rounded-lg py-1 text-sm font-extrabold'

const SCORE_RANK_TEXT_CLASS: Record<ScoreRank, string> = {
  'SSS+': 'text-green-500',
  SSS: 'text-yellow-500',
  'SS+': 'text-orange-500',
  SS: 'text-orange-500',
  'S+': 'text-orange-500',
  S: 'text-orange-500',
  AAA: 'text-red-500',
  AA: 'text-red-500',
  A: 'text-red-500',
  BBB: 'text-sky-500',
  BB: 'text-sky-500',
  B: 'text-sky-500',
  C: 'text-amber-700',
  D: 'text-gray-500',
}

export const renderDefaultRecordLampBadge: LampBadgeRenderer = (lamp, record) => {
  if (lamp === 'FULL COMBO')
    return (
      <span class="rounded-lg bg-orange-200 px-2 py-1 text-sm font-extrabold text-orange-900">
        FC
      </span>
    )
  if (lamp === 'ALL JUSTICE') {
    const ajBadgeClass =
      record?.score === MAX_SCORE
        ? 'bg-[linear-gradient(135deg,#ef4444_0%,#f97316_16%,#eab308_32%,#22c55e_48%,#06b6d4_64%,#3b82f6_80%,#a855f7_100%)] text-white shadow-sm [text-shadow:0_1px_2px_rgb(0_0_0_/_0.65)]'
        : 'bg-yellow-200 text-yellow-900'

    return <span class={`rounded-lg px-2 py-1 text-sm font-extrabold ${ajBadgeClass}`}>AJ</span>
  }
  return <LampPlaceholderBadge />
}

export const renderDefaultRecordHardLampBadge = (lamp: ClearLamp): JSX.Element => {
  if (lamp === 'CLEAR')
    return <span class={`${HARD_LAMP_BADGE_CLASS} bg-gray-200 text-gray-900`}>CLR</span>
  if (lamp === 'HARD')
    return <span class={`${HARD_LAMP_BADGE_CLASS} bg-red-200 text-red-900`}>HRD</span>
  if (lamp === 'BRAVE')
    return <span class={`${HARD_LAMP_BADGE_CLASS} bg-orange-200 text-orange-900`}>BRV</span>
  if (lamp === 'ABSOLUTE')
    return <span class={`${HARD_LAMP_BADGE_CLASS} bg-yellow-200 text-yellow-900`}>ABS</span>
  if (lamp === 'CATASTROPHY')
    return <span class={`${HARD_LAMP_BADGE_CLASS} bg-green-200 text-green-900`}>CTS</span>
  return <LampPlaceholderBadge />
}

export const RecordHeaderButton = (props: RecordHeaderButtonProps) => (
  <button
    type="button"
    class={`${RECORD_HEADER_BUTTON_CLASS} ${props.active && props.direction ? 'py-1' : ''} ${props.class ?? ''}`}
    onClick={props.onClick}
  >
    <span
      class={`flex flex-col ${props.align === 'start' ? 'items-start' : 'items-center'} justify-center gap-0.5 leading-none`}
    >
      <span>{props.label}</span>
      {renderSortIndicator(props.active, props.direction)}
    </span>
  </button>
)

export const RecordTitleCell = (props: RecordTitleCellProps) => (
  <A
    href={props.href}
    class={`font-sans flex ${RECORD_ROW_MIN_HEIGHT_CLASS} min-w-0 w-full items-center text-sm text-inherit hover:underline`}
    title={props.title}
  >
    <span class="block w-full truncate pt-0.25">{props.title}</span>
  </A>
)

export const RecordScoreCell = (props: { record: ScoreRecord }): JSX.Element => {
  if (!props.record.is_played) {
    return (
      <div
        class={`flex ${RECORD_ROW_MIN_HEIGHT_CLASS} flex-col items-end justify-center px-1 text-right whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
      />
    )
  }

  const scoreRank = getScoreRank(props.record.score)

  return (
    <div
      class={`flex ${RECORD_ROW_MIN_HEIGHT_CLASS} flex-col items-end justify-center px-1 text-right whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
    >
      <span class="w-full text-right leading-none">
        {props.record.score.toLocaleString('ja-JP')}
      </span>
      <span
        class={`mt-0.5 w-full text-right text-[10px] font-semibold leading-none ${SCORE_RANK_TEXT_CLASS[scoreRank]}`}
      >
        {scoreRank}
      </span>
    </div>
  )
}

export const RecordLampCell = (props: {
  record: LampRecord
  renderLampBadge?: LampBadgeRenderer
}) => (
  <div
    class={`flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-center whitespace-nowrap ${RECORD_LAMP_COLUMN_CLASS}`}
  >
    {props.record.is_played
      ? (props.renderLampBadge ?? renderDefaultRecordLampBadge)(
          props.record.combo_lamp,
          props.record
        )
      : null}
  </div>
)

export const RecordHardLampCell = (props: { record: HardLampRecord }) => (
  <div
    class={`flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-center whitespace-nowrap ${RECORD_LAMP_COLUMN_CLASS}`}
  >
    {props.record.is_played ? renderDefaultRecordHardLampBadge(props.record.clear_lamp) : null}
  </div>
)

export const RecordJusticeCountCell = (props: {
  record: JusticeCountRecord
  calcJusticeCount: (record: JusticeCountRecord) => number | '' | '-'
}) => {
  const justiceCount = props.calcJusticeCount(props.record)

  return (
    <div class={RECORD_CELL_CENTER_TEXT_CLASS}>
      <span class="inline-block w-full text-center leading-none">
        {justiceCount === '' ? '' : justiceCount}
      </span>
    </div>
  )
}

export const RecordUpdatedAtCell = (props: {
  record: UpdatedAtRecord
  formatUpdatedAt: (updatedAt: string | null) => string
}) => (
  <div
    class={`flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-end text-right whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
  >
    <span class="inline-block text-right leading-none">
      {props.record.is_played ? props.formatUpdatedAt(props.record.updated_at) : ''}
    </span>
  </div>
)
