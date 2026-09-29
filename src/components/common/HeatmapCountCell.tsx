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

/** ヒートマップセルの基本クラス */
const HEATMAP_CELL_CLASS = 'min-w-16 border-l border-border px-2 py-1.5 text-center'

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
  /** セルに追加で適用する Tailwind クラス */
  class?: string
}

/**
 * 達成件数と総数を色の濃淡付きの2段表示で描画する表セル。
 *
 * @param props - 達成件数、総数、達成率表示の有無、全件達成マークの有無、追加クラス。
 * @returns 上段に件数または達成率、下段に件数/総数を表示するセル。総数が0件の場合は記号のみ、
 * 全件達成マーク有効時に全件達成していればチェックアイコンのみ表示する。
 */
export const HeatmapCountCell = (props: HeatmapCountCellProps): JSX.Element => {
  const percent = () => calculatePlayerStatsPercent(props.count, props.total)
  return (
    <Show
      when={props.total > 0}
      fallback={
        <td class={`${HEATMAP_CELL_CLASS} text-sm text-text-subtle ${props.class ?? ''}`}>
          {HEATMAP_EMPTY_TEXT}
        </td>
      }
    >
      <td
        class={`${HEATMAP_CELL_CLASS} ${props.class ?? ''}`}
        style={{ background: getHeatmapBackground(props.count, props.total) }}
      >
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
      </td>
    </Show>
  )
}
