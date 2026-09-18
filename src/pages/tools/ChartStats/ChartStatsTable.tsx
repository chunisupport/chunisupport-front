import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import { createWindowVirtualTable } from '../../../components/common/createWindowVirtualTable'
import { getDefaultRecordHardLampLabel } from '../../../components/common/record/recordLampLabel'
import type { SharedClearLamp } from '../../../components/common/record/recordStyleClasses'
import {
  getSortAriaValue,
  SortableHeaderButton,
} from '../../../components/common/SortableTableHeader'
import { buildSongDetailPath, buildWorldsendSongDetailPath } from '../../../constants/routes'
import type { ChartStats, ChartStatsDifficulty } from '../../../types/chartStats'
import {
  buildChartStatsTableValues,
  type ChartStatsCategory,
  isWorldsendChartStats,
  sortChartStats,
} from '../../../utils/chartStats'
import { formatInteger } from '../../../utils/numberFormat'
import { nextSortState, type SortDirection } from '../../../utils/sortingQuery'
import {
  formatChartStatsLevel,
  formatChartStatsValue,
  getChartStatsLevelClass,
} from './chartStatsDisplay'
import {
  CHART_STATS_COPY,
  CHART_STATS_HEATMAP_MAX_MIX_PERCENT,
  type ChartStatsValueMode,
} from './constants'

type ChartStatsTableProps = {
  /** 表示対象の譜面統計 */
  charts: readonly ChartStats[]
  /** 現在選択中の難易度 */
  difficulty: ChartStatsDifficulty
  /** 現在選択中の集計カテゴリ */
  category: ChartStatsCategory
  /** 人数または割合の表示形式 */
  valueMode: ChartStatsValueMode
  /** 各到達条件以上の累積人数で表示する場合はtrue、区分ごとの排他人数で表示する場合はfalse */
  cumulative: boolean
  /** 検索・カテゴリ・難易度の変更時に先頭へ戻すための値 */
  resetKey: string
}

/** 仮想化で使用する固定行高 */
const ROW_HEIGHT = 37
/**
 * 定数・人数・指標値の数値列に共通適用する固定幅。
 * Jost SemiBold 14px・tabular-nums での「100.00%」実測 59.53px に
 * セル水平余白 px-1（8px）と描画誤差の余裕を加えた値。
 * 伸縮させず余白をすべて曲名列へ回す。
 */
const NUMERIC_COLUMN_WIDTH = '4.5rem'
/** 狭幅の数値列に共通適用する水平余白 */
const NARROW_COLUMN_PADDING_CLASS = 'px-1'
/** 表の見出しセルに共通適用するクラス */
const TABLE_HEADER_CLASS =
  'flex min-h-[37px] items-center whitespace-nowrap bg-surface-muted py-2 text-xs font-semibold text-text-muted'
/** 仮想行のセルに共通適用するクラス */
const TABLE_CELL_CLASS = 'flex h-[37px] items-center'
/** 曲名以外の中央揃え列に共通適用する配置クラス */
const CENTER_COLUMN_CLASS = 'justify-center text-center'
/** 集計カテゴリごとの表の最小幅 */
const TABLE_MIN_WIDTH_CLASS: Record<ChartStatsCategory, string> = {
  rank: 'min-w-[55rem]',
  combo: 'min-w-[37rem]',
  clear: 'min-w-[46rem]',
}

/**
 * 集計列数に応じた仮想行と見出しで共有する列構成を生成する。
 * 数値列はすべて固定幅とし、曲名列だけが残り幅を受け持つ。
 *
 * @param columnCount - 集計列の数。
 * @returns 曲名、定数、人数、集計列のグリッドテンプレート。
 */
const buildGridTemplateColumns = (columnCount: number): string =>
  `minmax(14rem, 1fr) repeat(${columnCount + 2}, ${NUMERIC_COLUMN_WIDTH})`

/**
 * 表見出し用の指標短縮ラベルを取得する。
 * HARD系の指標には既存レコード表示と共通の3文字短縮（CTS・ABS等）を使い、
 * 該当しない指標には正式名をそのまま返す。
 *
 * @param key - 指標のキー（小文字）。
 * @param label - 指標の正式名。
 * @returns 「100.00%」幅の数値列に収まる見出しラベル。
 */
const getMetricShortLabel = (key: string, label: string): string =>
  getDefaultRecordHardLampLabel(key.toUpperCase() as SharedClearLamp) || label

/**
 * 達成率に応じたテーマ連動のヒートマップ背景色を生成する。
 *
 * @param count - 達成人数。
 * @param playerCount - 集計対象プレイヤー数。
 * @returns アクセント色と面色を混ぜた背景色。
 */
const getHeatmapBackground = (count: number, playerCount: number): string => {
  const ratio = playerCount > 0 ? count / playerCount : 0
  const mixPercent = Math.round(ratio * CHART_STATS_HEATMAP_MAX_MIX_PERCENT)
  return `color-mix(in srgb, var(--cs-color-action-primary) ${mixPercent}%, var(--cs-color-surface))`
}

/**
 * 譜面統計から楽曲詳細へのリンクを生成する。
 *
 * @param chart - リンク対象の譜面統計。
 * @param difficulty - 現在の難易度。
 * @returns 通常楽曲またはWORLD'S END楽曲の詳細パス。
 */
const buildChartHref = (chart: ChartStats, difficulty: ChartStatsDifficulty): string =>
  isWorldsendChartStats(chart)
    ? buildWorldsendSongDetailPath(chart.song_id)
    : buildSongDetailPath(chart.song_id, difficulty)

/**
 * 譜面ごとの達成人数または達成率をTanStack Virtualで仮想化した表として表示する。
 * 曲名以外はすべて中央揃えにし、数値列は「100.00%」基準の固定幅で曲名列を最大化する。
 * すべての列が見出し操作でソートでき、ソート状態は画面内に閉じて保持する。
 *
 * @param props - 譜面一覧、難易度、カテゴリ、数値形式、累積表示設定、先頭復帰キー。
 * @returns 横スクロール可能な仮想化データテーブル。
 */
export const ChartStatsTable = (props: ChartStatsTableProps): JSX.Element => {
  const columns = () =>
    props.charts[0]
      ? buildChartStatsTableValues(props.charts[0], props.category, props.cumulative)
      : []
  const isWorldsend = () => props.difficulty === "WORLD'S END"
  const [sortKey, setSortKey] = createSignal<string | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const sortedCharts = createMemo(() =>
    sortChartStats(
      props.charts,
      sortKey(),
      sortDirection(),
      props.category,
      props.cumulative,
      props.valueMode
    )
  )
  const gridTemplateColumns = createMemo(() => buildGridTemplateColumns(columns().length))
  const virtualizedTable = createWindowVirtualTable<
    HTMLDivElement,
    HTMLTableSectionElement,
    HTMLDivElement,
    HTMLTableRowElement
  >({
    rowCount: () => sortedCharts().length,
    rowHeight: ROW_HEIGHT,
    resetOnRowCountChange: true,
    layoutDeps: () => props.category,
  })
  const virtualRows = createMemo(() => virtualizedTable.virtualRows())

  createEffect((previousKey?: string) => {
    const currentKey = props.resetKey
    if (previousKey !== undefined && previousKey !== currentKey) {
      virtualizedTable.resetToTop()
    }
    return currentKey
  })

  createEffect((previousKeys?: string) => {
    const currentKeys = `${props.category}|${props.cumulative}`
    if (previousKeys !== undefined && previousKeys !== currentKeys) {
      setSortKey(null)
      setSortDirection(null)
    }
    return currentKeys
  })

  /**
   * 列ヘッダー操作時の次のソート状態を適用し、仮想化表を先頭へ戻す。
   *
   * @param nextKey - 選択された列のソートキー。
   * @returns なし。
   */
  const handleSortChange = (nextKey: string): void => {
    const nextSort = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(nextSort.sortKey)
    setSortDirection(nextSort.sortDirection)
    virtualizedTable.resetToTop()
  }

  /**
   * ソート状態をth要素へ伝えるaria-sort値を返す。
   *
   * @param key - 列のソートキー。
   * @returns aria-sortへ渡すソート状態。
   */
  const headerAriaSort = (key: string) => getSortAriaValue(sortKey() === key, sortDirection())

  return (
    <div
      ref={virtualizedTable.setTableContainerRef}
      class="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-surface"
    >
      <table
        class={`block w-full text-sm ${TABLE_MIN_WIDTH_CLASS[props.category]}`}
        aria-rowcount={sortedCharts().length + 1}
      >
        <caption class="sr-only">{CHART_STATS_COPY.tableCaption}</caption>
        <thead class="block">
          <tr class="grid" style={{ 'grid-template-columns': gridTemplateColumns() }}>
            <th
              class={`${TABLE_HEADER_CLASS} justify-start px-3 text-left`}
              scope="col"
              aria-sort={headerAriaSort('title')}
            >
              <SortableHeaderButton
                label="曲名"
                active={sortKey() === 'title'}
                direction={sortDirection()}
                align="start"
                class="justify-start"
                onClick={() => handleSortChange('title')}
              />
            </th>
            <th
              class={`${TABLE_HEADER_CLASS} ${NARROW_COLUMN_PADDING_CLASS} ${CENTER_COLUMN_CLASS}`}
              scope="col"
              aria-sort={headerAriaSort('level')}
            >
              <SortableHeaderButton
                label={isWorldsend() ? CHART_STATS_COPY.worldsendLevel : CHART_STATS_COPY.level}
                active={sortKey() === 'level'}
                direction={sortDirection()}
                align="center"
                class="justify-center"
                onClick={() => handleSortChange('level')}
              />
            </th>
            <th
              class={`${TABLE_HEADER_CLASS} ${NARROW_COLUMN_PADDING_CLASS} ${CENTER_COLUMN_CLASS}`}
              scope="col"
              aria-sort={headerAriaSort('player_count')}
            >
              <SortableHeaderButton
                label={CHART_STATS_COPY.playerCount}
                active={sortKey() === 'player_count'}
                direction={sortDirection()}
                align="center"
                class="justify-center"
                onClick={() => handleSortChange('player_count')}
              />
            </th>
            <For each={columns()}>
              {(column) => (
                <th
                  class={`${TABLE_HEADER_CLASS} ${NARROW_COLUMN_PADDING_CLASS} ${CENTER_COLUMN_CLASS}`}
                  scope="col"
                  title={column.label}
                  aria-sort={headerAriaSort(column.key)}
                >
                  <SortableHeaderButton
                    label={getMetricShortLabel(column.key, column.label)}
                    active={sortKey() === column.key}
                    direction={sortDirection()}
                    align="center"
                    class="justify-center"
                    onClick={() => handleSortChange(column.key)}
                  />
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody
          ref={virtualizedTable.setTableBodyRef}
          class="relative block min-w-full"
          style={{ height: `${virtualizedTable.getTotalSize()}px` }}
        >
          <For each={virtualRows()}>
            {(virtualRow) => {
              const chart = createMemo(() => sortedCharts()[virtualRow.index])

              return (
                <Show when={chart()} keyed>
                  {(currentChart) => (
                    <tr
                      class="absolute left-0 top-0 grid min-w-full border-t border-border hover:bg-surface-muted"
                      style={{
                        'grid-template-columns': gridTemplateColumns(),
                        transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
                      }}
                      aria-rowindex={virtualRow.index + 2}
                    >
                      <th
                        class={`${TABLE_CELL_CLASS} min-w-0 p-0 text-left font-medium`}
                        scope="row"
                      >
                        <A
                          href={buildChartHref(currentChart, props.difficulty)}
                          class="flex h-full w-full min-w-0 items-center px-3 font-sans text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset"
                        >
                          <span class="truncate">{currentChart.title}</span>
                        </A>
                      </th>
                      <td
                        class={`${TABLE_CELL_CLASS} ${NARROW_COLUMN_PADDING_CLASS} ${CENTER_COLUMN_CLASS} whitespace-nowrap font-jost tabular-nums ${getChartStatsLevelClass(currentChart)}`}
                      >
                        {formatChartStatsLevel(currentChart)}
                      </td>
                      <td
                        class={`${TABLE_CELL_CLASS} ${NARROW_COLUMN_PADDING_CLASS} ${CENTER_COLUMN_CLASS} whitespace-nowrap font-jost tabular-nums text-text-muted`}
                      >
                        {formatInteger(currentChart.player_count)}
                      </td>
                      <For
                        each={buildChartStatsTableValues(
                          currentChart,
                          props.category,
                          props.cumulative
                        )}
                      >
                        {(metric) => (
                          <td
                            class={`${TABLE_CELL_CLASS} ${NARROW_COLUMN_PADDING_CLASS} ${CENTER_COLUMN_CLASS} min-w-0 whitespace-nowrap border-l border-border font-jost font-semibold tabular-nums text-text`}
                            style={{
                              background: getHeatmapBackground(
                                metric.count,
                                currentChart.player_count
                              ),
                            }}
                            title={`${formatInteger(metric.count)}人 / ${formatChartStatsValue(
                              metric.count,
                              currentChart.player_count,
                              'percent'
                            )}`}
                            aria-label={`${metric.label}: ${formatInteger(metric.count)}人 / ${formatInteger(
                              currentChart.player_count
                            )}人、${formatChartStatsValue(metric.count, currentChart.player_count, 'percent')}`}
                          >
                            <span class="truncate">
                              {formatChartStatsValue(
                                metric.count,
                                currentChart.player_count,
                                props.valueMode
                              )}
                            </span>
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}
