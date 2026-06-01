import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'

import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api'
import { getScoreRank } from '../../../utils/scoreRank'
import { LampPlaceholderBadge, renderSortIndicator } from './RecordTableUiParts'
import {
  getComboLampBadgeClass,
  HARD_LAMP_BADGE_BACKGROUND_CLASS,
  HARD_LAMP_BADGE_TEXT_CLASS,
  SCORE_RANK_TEXT_CLASS,
} from './recordStyleClasses'

type SharedSortDirection = 'asc' | 'desc' | null
type SharedRecordSource = PlayerRecordDTO | WorldsendRecordDTO
type ComboLamp = SharedRecordSource['combo_lamp']
type ClearLamp = SharedRecordSource['clear_lamp']
type ScoreRecord = Pick<SharedRecordSource, 'is_played' | 'score'>
type LampRecord = Pick<SharedRecordSource, 'is_played' | 'combo_lamp' | 'score'>
type HardLampRecord = Pick<SharedRecordSource, 'is_played' | 'clear_lamp'>
type FullChainRecord = Pick<SharedRecordSource, 'is_played' | 'full_chain'>

type JusticeCountRecord = {
  combo_lamp: ComboLamp
  justice_count: number | null
}
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

/** レコード行とカードのホバー色変化に使う共通トランジション。 */
export const RECORD_HOVER_TRANSITION_CLASS = 'transition-colors'
/** レコード行のホバー背景色クラス。 */
export const RECORD_ROW_HOVER_CLASS = `${RECORD_HOVER_TRANSITION_CLASS} hover:bg-success-bg`
/** ホバー背景色で直前行の区切り線が隠れる行にだけ補助線を表示するクラス。 */
export const RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS = `${RECORD_ROW_HOVER_CLASS} hover:shadow-[inset_0_1px_0_var(--color-border)]`
/** レコードカードのホバー背景色クラス。 */
export const RECORD_CARD_HOVER_CLASS = `${RECORD_HOVER_TRANSITION_CLASS} group-hover:bg-success-bg`
export const RECORD_ROW_HEIGHT = 34
export const RECORD_ROW_MIN_HEIGHT_CLASS = 'min-h-[34px]'
export const RECORD_HEADER_BUTTON_CLASS = `flex ${RECORD_ROW_MIN_HEIGHT_CLASS} w-full items-center text-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset`
export const RECORD_ALPHANUMERIC_COLUMN_CLASS = 'text-sm'
export const RECORD_CELL_BASE_CLASS = `flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-center whitespace-nowrap`
export const RECORD_CELL_CENTER_TEXT_CLASS = `${RECORD_CELL_BASE_CLASS} text-center ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`
export const RECORD_LAMP_COLUMN_CLASS = 'font-oswald text-sm font-semibold'
const HARD_LAMP_BADGE_CLASS =
  'inline-flex w-[40px] items-center justify-center rounded-lg py-1 text-sm font-extrabold'
const HARD_LAMP_LABEL: Record<Exclude<NonNullable<ClearLamp>, 'FAILED'>, string> = {
  CLEAR: 'CLR',
  HARD: 'HRD',
  BRAVE: 'BRV',
  ABSOLUTE: 'ABS',
  CATASTROPHY: 'CTS',
}
const FULL_CHAIN_BADGE_CLASS =
  'inline-flex w-[40px] items-center justify-center rounded-lg py-1 text-sm font-extrabold'
const FULL_CHAIN_BADGE_VARIANT: Partial<
  Record<NonNullable<SharedRecordSource['full_chain']>, NonNullable<ComboLamp>>
> = {
  'FULL CHAIN GOLD': 'FULL COMBO',
  'FULL CHAIN PLATINUM': 'ALL JUSTICE',
}

/** レコードのコンボランプ値から表示用バッジを生成する。 */
export const renderDefaultRecordLampBadge: LampBadgeRenderer = (lamp, _record) => {
  if (lamp === 'FULL COMBO')
    return (
      <span
        class={`rounded-lg px-2 py-1 text-sm font-extrabold ${getComboLampBadgeClass(lamp, _record?.score)}`}
      >
        FC
      </span>
    )
  if (lamp === 'ALL JUSTICE') {
    return (
      <span
        class={`rounded-lg px-2 py-1 text-sm font-extrabold ${getComboLampBadgeClass(lamp, _record?.score)}`}
      >
        AJ
      </span>
    )
  }
  return <LampPlaceholderBadge />
}

/** レコードのハードランプバッジに共通する色とラベルを組み立てる。 */
const renderHardLampTextBadge = (lamp: keyof typeof HARD_LAMP_LABEL): JSX.Element => (
  <span
    class={`${HARD_LAMP_BADGE_CLASS} ${HARD_LAMP_BADGE_BACKGROUND_CLASS[lamp]} ${HARD_LAMP_BADGE_TEXT_CLASS[lamp]}`}
  >
    {HARD_LAMP_LABEL[lamp]}
  </span>
)

/** レコードのハードランプ値から表示用バッジを生成する。 */
export const renderDefaultRecordHardLampBadge = (lamp: ClearLamp): JSX.Element => {
  if (lamp && lamp !== 'FAILED') return renderHardLampTextBadge(lamp)
  return <LampPlaceholderBadge class="w-[40px]" />
}

/**
 * レコードのFULL CHAINランプ値から表示用バッジを生成する。
 * @param fullChain - レコードのフルチェイン状態 (FULL CHAIN GOLD, FULL CHAIN PLATINUM, またはnull)
 * @returns フルチェインバッジまたはプレースホルダーを表すJSX要素
 */
export const renderDefaultRecordFullChainBadge = (
  fullChain: SharedRecordSource['full_chain']
): JSX.Element => {
  const lampType = fullChain ? FULL_CHAIN_BADGE_VARIANT[fullChain] : undefined

  if (!lampType) return <LampPlaceholderBadge class="w-[40px]" />

  return (
    <span class={`${FULL_CHAIN_BADGE_CLASS} ${getComboLampBadgeClass(lampType, undefined)}`}>
      FCH
    </span>
  )
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

/**
 * レコード行にFULL CHAINランプバッジセルを表示する。
 * @param props - コンポーネントのプロパティ
 * @param props.record - プレイ状態とフルチェイン情報を含むレコードデータ
 * @returns フルチェインセルを表すJSX要素
 */
export const RecordFullChainCell = (props: { record: FullChainRecord }) => (
  <div
    class={`flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-center whitespace-nowrap ${RECORD_LAMP_COLUMN_CLASS}`}
  >
    {props.record.is_played ? renderDefaultRecordFullChainBadge(props.record.full_chain) : null}
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
