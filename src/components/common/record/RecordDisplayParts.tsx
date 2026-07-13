import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api'
import { getScoreRank, type ScoreRank } from '../../../utils/scoreRank'
import { SortableHeaderButton, type SortDirection } from '../SortableTableHeader'
import { LampPlaceholderBadge } from './RecordBadges'
import { getDefaultRecordLampLabel } from './recordLampLabel'
import {
  getComboLampBadgeClass,
  HARD_LAMP_BADGE_BACKGROUND_CLASS,
  HARD_LAMP_BADGE_TEXT_CLASS,
  SCORE_RANK_TEXT_CLASS,
} from './recordStyleClasses'

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
  direction: SortDirection
  align?: 'start' | 'center'
  class?: string
  onClick: () => void
}

type RecordTitleCellProps = {
  href?: string
  title: string
}

/** レコード行とカードのホバー色変化に使う共通トランジション。 */
export const RECORD_HOVER_TRANSITION_CLASS = 'transition-colors'
/** レコード行のホバー背景色クラス。 */
export const RECORD_ROW_HOVER_CLASS = `${RECORD_HOVER_TRANSITION_CLASS} hover:bg-interactive-row-hover`
/** ホバー背景色で直前行の区切り線が隠れる行にだけ補助線を表示するクラス。 */
export const RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS = `${RECORD_ROW_HOVER_CLASS} hover:shadow-[inset_0_1px_0_var(--color-border)]`
/** レコードカードのホバー背景色クラス。 */
export const RECORD_CARD_HOVER_CLASS = `${RECORD_HOVER_TRANSITION_CLASS} group-hover:bg-interactive-row-hover`
/** 仮想スクロールで使うレコード1行の高さ。 */
export const RECORD_ROW_HEIGHT = 34
const RECORD_ROW_MIN_HEIGHT_CLASS_BY_HEIGHT = {
  [RECORD_ROW_HEIGHT]: 'min-h-[34px]',
} as const satisfies Record<typeof RECORD_ROW_HEIGHT, `min-h-[${typeof RECORD_ROW_HEIGHT}px]`>
/** レコード1行分の最小高さを揃えるクラス。 */
export const RECORD_ROW_MIN_HEIGHT_CLASS = RECORD_ROW_MIN_HEIGHT_CLASS_BY_HEIGHT[RECORD_ROW_HEIGHT]
/** レコード表ヘッダーボタンの共通レイアウトクラス。 */
export const RECORD_HEADER_BUTTON_CLASS = RECORD_ROW_MIN_HEIGHT_CLASS
/** 数値や英数字中心のレコード列に使う文字サイズクラス。 */
export const RECORD_ALPHANUMERIC_COLUMN_CLASS = 'text-sm'
/** レコード表セルの中央寄せレイアウトに使う基礎クラス。 */
export const RECORD_CELL_BASE_CLASS = `flex ${RECORD_ROW_MIN_HEIGHT_CLASS} items-center justify-center whitespace-nowrap`
/** レコード表セルの中央寄せテキストに使う共通クラス。 */
export const RECORD_CELL_CENTER_TEXT_CLASS = `${RECORD_CELL_BASE_CLASS} text-center ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`
/** レコードのランプ列に使うフォントと文字サイズの共通クラス。 */
export const RECORD_LAMP_COLUMN_CLASS = 'font-oswald text-sm font-semibold'
/** レコードのランプバッジに共通する固定幅と文字配置のクラス。 */
const RECORD_LAMP_BADGE_FIXED_WIDTH_CLASS =
  'inline-flex w-[34px] items-center justify-center rounded-lg py-1 text-sm font-extrabold'
const HARD_LAMP_BADGE_CLASS = RECORD_LAMP_BADGE_FIXED_WIDTH_CLASS
const HARD_LAMP_LABEL: Record<Exclude<NonNullable<ClearLamp>, 'FAILED'>, string> = {
  CLEAR: 'CLR',
  HARD: 'HRD',
  BRAVE: 'BRV',
  ABSOLUTE: 'ABS',
  CATASTROPHY: 'CTS',
}
const FULL_CHAIN_BADGE_CLASS = RECORD_LAMP_BADGE_FIXED_WIDTH_CLASS
const FULL_CHAIN_BADGE_VARIANT: Partial<
  Record<NonNullable<SharedRecordSource['full_chain']>, NonNullable<ComboLamp>>
> = {
  'FULL CHAIN GOLD': 'FULL COMBO',
  'FULL CHAIN PLATINUM': 'ALL JUSTICE',
}

/**
 * レコードのコンボランプ値から表示用バッジを生成する。
 *
 * @param lamp - コンボランプ値。
 * @param _record - スコア参照が必要なレコード。
 * @returns コンボランプバッジまたはプレースホルダー。
 */
export const renderDefaultRecordLampBadge: LampBadgeRenderer = (lamp, _record) => {
  const label = getDefaultRecordLampLabel(lamp, _record?.score)
  if (lamp && label) {
    return (
      <span
        class={`${RECORD_LAMP_BADGE_FIXED_WIDTH_CLASS} ${getComboLampBadgeClass(lamp, _record?.score)}`}
      >
        {label}
      </span>
    )
  }
  return <LampPlaceholderBadge class="w-[34px]" />
}

/**
 * レコードのハードランプバッジに共通する色とラベルを組み立てる。
 *
 * @param lamp - FAILED以外のハードランプ値。
 * @returns ハードランプのテキストバッジ。
 */
const renderHardLampTextBadge = (lamp: keyof typeof HARD_LAMP_LABEL): JSX.Element => (
  <span
    class={`${HARD_LAMP_BADGE_CLASS} ${HARD_LAMP_BADGE_BACKGROUND_CLASS[lamp]} ${HARD_LAMP_BADGE_TEXT_CLASS[lamp]}`}
  >
    {HARD_LAMP_LABEL[lamp]}
  </span>
)

/**
 * レコードのハードランプ値から表示用バッジを生成する。
 *
 * @param lamp - ハードランプ値。
 * @returns ハードランプバッジまたはプレースホルダー。
 */
export const renderDefaultRecordHardLampBadge = (lamp: ClearLamp): JSX.Element => {
  if (lamp && lamp !== 'FAILED') return renderHardLampTextBadge(lamp)
  return <LampPlaceholderBadge class="w-[34px]" />
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

  if (!lampType) return <LampPlaceholderBadge class="w-[34px]" />

  return (
    <span class={`${FULL_CHAIN_BADGE_CLASS} ${getComboLampBadgeClass(lampType, undefined)}`}>
      FCH
    </span>
  )
}

/**
 * レコード表向けの余白と高さを適用したソート可能ヘッダーボタンを表示する。
 *
 * @param props - ラベル、ソート状態、配置、クリック時の処理。
 * @returns レコード表向けのヘッダーボタン。
 */
export const RecordHeaderButton = (props: RecordHeaderButtonProps) => (
  <SortableHeaderButton
    label={props.label}
    active={props.active}
    direction={props.direction}
    align={props.align}
    class={`${RECORD_HEADER_BUTTON_CLASS} ${props.active && props.direction ? 'py-1' : ''} ${props.class ?? ''}`}
    onClick={props.onClick}
  />
)

/**
 * 曲名をレコード表セルとして表示する。
 *
 * @param props - 曲名と任意の遷移先URL。
 * @returns 遷移先があればリンク、なければテキストの曲名セル。
 */
export const RecordTitleCell = (props: RecordTitleCellProps) => {
  const className = `font-sans flex ${RECORD_ROW_MIN_HEIGHT_CLASS} min-w-0 w-full items-center text-sm text-inherit`
  const content = <span class="block w-full truncate pt-px">{props.title}</span>

  if (props.href) {
    return (
      <A href={props.href} class={`${className} hover:underline`} title={props.title}>
        {content}
      </A>
    )
  }

  return (
    <div class={className} title={props.title}>
      {content}
    </div>
  )
}

/**
 * レコードのスコアとランクを表示する。
 *
 * @param props - プレイ状態とスコアを含むレコード、および任意のランク判定関数。
 * @returns スコアセル。未プレイ時は空セル。
 */
export const RecordScoreCell = (props: {
  /** 表示するプレイ状態とスコア。 */
  record: ScoreRecord
  /** 通常スコア以外の尺度で使うランク判定関数。 */
  getRank?: (score: number) => ScoreRank
}): JSX.Element => {
  if (!props.record.is_played) {
    return (
      <div
        class={`flex ${RECORD_ROW_MIN_HEIGHT_CLASS} flex-col items-end justify-center px-1 text-right whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
      />
    )
  }

  const scoreRank = (props.getRank ?? getScoreRank)(props.record.score)

  return (
    <div
      class={`font-jost flex ${RECORD_ROW_MIN_HEIGHT_CLASS} flex-col items-end justify-center px-1 text-right whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
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

/**
 * レコードのコンボランプバッジを表示する。
 *
 * @param props - プレイ状態、ランプ、任意のランプ描画関数を含む設定。
 * @returns コンボランプセル。
 */
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

/**
 * レコードのハードランプバッジを表示する。
 *
 * @param props - プレイ状態とハードランプを含むレコード。
 * @returns ハードランプセル。
 */
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

/**
 * レコードのJUSTICE数を表示する。
 *
 * @param props - JUSTICE数計算対象のレコードと計算関数。
 * @returns JUSTICE数セル。
 */
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

/**
 * レコード更新日を表示する。
 *
 * @param props - プレイ状態、更新日時、表示整形関数。
 * @returns 更新日セル。未プレイ時は空セル。
 */
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
