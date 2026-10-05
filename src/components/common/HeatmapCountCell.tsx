import { Button } from '@kobalte/core/button'
import { Check } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { getHeatmapBackground } from '../../utils/heatmapColor'
import { formatInteger, formatTruncatedFixed } from '../../utils/numberFormat'
import { calculatePlayerStatsPercent } from '../../utils/playerStatsDashboard'

/** 達成件数と総数の区切り文字 */
const HEATMAP_COUNT_SEPARATOR = '/'

/** 集計対象がないセルに表示する記号 */
const HEATMAP_EMPTY_TEXT = '-'

/** sr-only の絶対配置が表のスクロール領域を越えて表示領域を広げないよう、セルを配置基準にする。 */
const HEATMAP_CELL_CLASS = 'relative min-w-16 border-l border-border text-center'

/** ヒートマップセル内容の余白クラス */
const HEATMAP_CELL_PADDING_CLASS = 'px-2 py-1.5'

/**
 * クリック可能なヒートマップセルのボタンクラス。
 * セル全体を色付きの面として押せるよう、余白や角丸を持つ AppButton ではなく Kobalte Button を直接使う。
 */
const HEATMAP_CELL_BUTTON_CLASS = `block h-full w-full cursor-pointer ${HEATMAP_CELL_PADDING_CLASS} hover:ring-2 hover:ring-inset hover:ring-focus-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring`

/** 達成件数ヒートマップセルのプロパティ */
type HeatmapCountCellProps = {
  /** 達成件数 */
  count: number
  /** 集計対象の全譜面数 */
  total: number
  /** 上段を達成率で表示するか */
  showPercent: boolean
  /** 全件達成時に数値の代わりにチェックアイコンを表示するか */
  showCompleteMark?: boolean
  /** 集計対象がないセルを全件達成時と同じ背景色と大きめの白い記号で表示するか */
  showEmptyAsComplete?: boolean
  /** セルに追加で適用する Tailwind クラス */
  class?: string
  /** 指定時はセル全体をボタンにし、クリックで呼び出す */
  onSelect?: () => void
  /** ボタン化したセルの操作内容を補足するスクリーンリーダー向け文言 */
  selectLabel?: string
}

/**
 * 達成件数と総数を色の濃淡付きで描画する表セル。
 *
 * @param props - 達成件数、総数、達成率表示の有無、全件達成マークの有無、空セルの背景色指定、追加クラス、クリック時の処理。
 * @returns 上段に件数または達成率、下段に件数/総数を表示するセル。総数が0件の場合は記号のみ表示し、showEmptyAsComplete指定時は全件達成時の背景色と大きめの白い記号で表示する。
 * 全件達成マーク有効時に全件達成していればチェックアイコンのみ表示する。onSelect 指定時はセル全体がボタンになる。
 */
export const HeatmapCountCell = (props: HeatmapCountCellProps): JSX.Element => {
  const percent = () => calculatePlayerStatsPercent(props.count, props.total)
  /**
   * セル内の件数表示または全件達成マークを描画する。
   *
   * @returns ボタン化の有無にかかわらず共通のセル内容。
   */
  const content = () => (
    <Show
      when={props.showCompleteMark === true && props.count === props.total}
      fallback={
        <>
          <span class="block font-jost text-sm font-semibold leading-tight tabular-nums text-text">
            {props.showPercent
              ? `${formatTruncatedFixed(percent(), 2)}%`
              : formatInteger(props.count)}
          </span>
          <span class="block font-jost text-xs leading-tight tabular-nums text-text-muted">
            <Show when={props.showPercent}>{formatInteger(props.count)}</Show>
            {HEATMAP_COUNT_SEPARATOR}
            {formatInteger(props.total)}
          </span>
        </>
      }
    >
      <Check class="mx-auto h-8 w-8 text-text" stroke-width={3} aria-hidden={true} />
      <span class="sr-only">
        {formatInteger(props.count)}
        {HEATMAP_COUNT_SEPARATOR}
        {formatInteger(props.total)}
      </span>
    </Show>
  )
  return (
    <Show
      when={props.total > 0}
      fallback={
        <td
          class={`${HEATMAP_CELL_CLASS} ${HEATMAP_CELL_PADDING_CLASS} ${props.showEmptyAsComplete ? 'text-base text-white' : 'text-sm text-text-subtle'} ${props.class ?? ''}`}
          style={{ background: props.showEmptyAsComplete ? getHeatmapBackground(1, 1) : undefined }}
        >
          {HEATMAP_EMPTY_TEXT}
        </td>
      }
    >
      <td
        class={`${HEATMAP_CELL_CLASS} ${props.onSelect ? 'p-0' : HEATMAP_CELL_PADDING_CLASS} ${props.class ?? ''}`}
        style={{ background: getHeatmapBackground(props.count, props.total) }}
      >
        <Show when={props.onSelect} fallback={content()}>
          {(onSelect) => (
            <Button type="button" class={HEATMAP_CELL_BUTTON_CLASS} onClick={() => onSelect()()}>
              {content()}
              <Show when={props.selectLabel}>
                <span class="sr-only">{props.selectLabel}</span>
              </Show>
            </Button>
          )}
        </Show>
      </td>
    </Show>
  )
}
