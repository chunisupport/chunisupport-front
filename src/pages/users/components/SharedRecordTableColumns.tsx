import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'

import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api'
import { getScoreRank, type ScoreRank } from '../../../utils/scoreRank'
import { LampPlaceholderBadge, renderSortIndicator } from './RecordTableUiParts'

type SharedSortDirection = 'asc' | 'desc' | null
type SharedRecordSource = PlayerRecordDTO | WorldsendRecordDTO
type ComboLamp = SharedRecordSource['combo_lamp']
type ScoreRecord = Pick<SharedRecordSource, 'is_played' | 'score'>
type LampRecord = Pick<SharedRecordSource, 'is_played' | 'combo_lamp'>
type UpdatedAtRecord = Pick<SharedRecordSource, 'is_played' | 'updated_at'>
type LampBadgeRenderer = (lamp: ComboLamp) => JSX.Element
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
export const RECORD_HEADER_BUTTON_CLASS = `flex ${RECORD_ROW_MIN_HEIGHT_CLASS} w-full items-center text-center whitespace-nowrap ${RECORD_ROW_HOVER_CLASS} focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset`
export const RECORD_ALPHANUMERIC_COLUMN_CLASS = 'text-sm'
export const RECORD_LAMP_COLUMN_CLASS = 'font-oswald text-sm font-semibold'

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

export const renderDefaultRecordLampBadge: LampBadgeRenderer = (lamp) => {
  if (lamp === 'FULL COMBO')
    return (
      <span class="rounded-lg bg-orange-200 px-2 py-1 text-sm font-extrabold text-orange-900">
        FC
      </span>
    )
  if (lamp === 'ALL JUSTICE')
    return (
      <span class="rounded-lg bg-yellow-200 px-2 py-1 text-sm font-extrabold text-yellow-900">
        AJ
      </span>
    )
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
    <span class="block w-full truncate">{props.title}</span>
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
      ? (props.renderLampBadge ?? renderDefaultRecordLampBadge)(props.record.combo_lamp)
      : null}
  </div>
)

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
