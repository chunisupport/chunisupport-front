import { Button } from '@kobalte/core/button'
import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import { createWindowVirtualTable } from '../../../components/common/createWindowVirtualTable'
import { DistributionBar } from '../../../components/common/record/DistributionBar'
import {
  ALL_JUSTICE_CRITICAL_BG_CLASS,
  COMBO_LAMP_BAR_CLASS,
  HARD_LAMP_BAR_CLASS,
  SCORE_RANK_BAR_CLASS,
} from '../../../components/common/record/recordStyleClasses'
import {
  getSortAriaValue,
  SortableHeaderButton,
  SortIndicator,
} from '../../../components/common/SortableTableHeader'
import { buildSongDetailPath, buildWorldsendSongDetailPath } from '../../../constants/routes'
import type { ChartStats, ChartStatsDifficulty } from '../../../types/chartStats'
import {
  buildChartStatsDistribution,
  type ChartStatsCategory,
  calculateChartStatsBarWidthPercent,
  calculateChartStatsPercent,
  getMaxChartStatsPlayerCount,
  isWorldsendChartStats,
  sortChartStats,
} from '../../../utils/chartStats'
import { formatInteger } from '../../../utils/numberFormat'
import { nextSortState, type SortDirection } from '../../../utils/sortingQuery'
import { formatChartStatsLevel, getChartStatsLevelClass } from './chartStatsDisplay'
import { CHART_STATS_COPY, type ChartStatsValueMode } from './constants'

type ChartStatsGraphTableProps = {
  /** 表示対象の譜面統計 */
  charts: readonly ChartStats[]
  /** 現在選択中の難易度 */
  difficulty: ChartStatsDifficulty
  /** 現在選択中の集計カテゴリ */
  category: ChartStatsCategory
  /** 人数または割合の表示形式 */
  valueMode: ChartStatsValueMode
  /** 検索・カテゴリ・難易度の変更時に先頭へ戻すための値 */
  resetKey: string
}

/** 仮想化で使用する固定行高 */
const ROW_HEIGHT = 37
/** 定数列の幅。レコード表の定数列と同じ内容幅になるよう水平余白分だけ広げる */
const LEVEL_COLUMN_WIDTH = '3rem'
/** WORLD'S ENDの定数列の幅。見出し「Lv./属性」と「★5 属性」を収める */
const WORLDSEND_LEVEL_COLUMN_WIDTH = '3.5rem'
/** 人数列の幅。最大5桁の桁区切り人数を収める */
const PLAYER_COUNT_COLUMN_WIDTH = '3.5rem'
/** 狭幅の定数・人数列に共通適用する水平余白 */
const NARROW_COLUMN_PADDING_CLASS = 'px-1'
/** 表の見出しセルに共通適用するクラス */
const TABLE_HEADER_CLASS =
  'flex min-h-[37px] items-center whitespace-nowrap bg-surface-muted py-2 text-left text-xs font-semibold text-text-muted'
/** 仮想行のセルに共通適用するクラス */
const TABLE_CELL_CLASS = 'flex h-[37px] items-center'

/**
 * 難易度に応じた仮想行と見出しで共有する列構成を生成する。
 *
 * @param difficulty - 現在選択中の難易度。
 * @returns 曲名、定数、人数、分布グラフのグリッドテンプレート。
 */
const buildGridTemplateColumns = (difficulty: ChartStatsDifficulty): string =>
  `minmax(15rem, 1fr) ${difficulty === "WORLD'S END" ? WORLDSEND_LEVEL_COLUMN_WIDTH : LEVEL_COLUMN_WIDTH} ${PLAYER_COUNT_COLUMN_WIDTH} minmax(24rem, 1fr)`

/** 分布キーごとのスコアランク色 */
const RANK_COLOR_CLASS: Record<string, string> = {
  max: ALL_JUSTICE_CRITICAL_BG_CLASS,
  sssp: SCORE_RANK_BAR_CLASS['SSS+'],
  sss: SCORE_RANK_BAR_CLASS.SSS,
  ssp: SCORE_RANK_BAR_CLASS['SS+'],
  ss: SCORE_RANK_BAR_CLASS.SS,
  sp: SCORE_RANK_BAR_CLASS['S+'],
  s: SCORE_RANK_BAR_CLASS.S,
  aaal: SCORE_RANK_BAR_CLASS.OTHERS,
}

/** 分布キーごとのコンボランプ色 */
const COMBO_COLOR_CLASS: Record<string, string> = {
  ajc: COMBO_LAMP_BAR_CLASS['ALL JUSTICE CRITICAL'],
  aj: COMBO_LAMP_BAR_CLASS['ALL JUSTICE'],
  fc: COMBO_LAMP_BAR_CLASS['FULL COMBO'],
  none: COMBO_LAMP_BAR_CLASS.なし,
}

/** 分布キーごとのクリアランプ色 */
const CLEAR_COLOR_CLASS: Record<string, string> = {
  catastrophy: HARD_LAMP_BAR_CLASS.CATASTROPHY,
  absolute: HARD_LAMP_BAR_CLASS.ABSOLUTE,
  brave: HARD_LAMP_BAR_CLASS.BRAVE,
  hard: HARD_LAMP_BAR_CLASS.HARD,
  clear: HARD_LAMP_BAR_CLASS.CLEAR,
  failed: HARD_LAMP_BAR_CLASS.FAILED,
}

/**
 * 集計カテゴリと分布キーに対応する既存レコード色を取得する。
 *
 * @param category - 集計カテゴリ。
 * @param key - 静的JSON内の分布キー。
 * @returns 背景色へ適用するTailwindクラス。
 */
const getDistributionColorClass = (category: ChartStatsCategory, key: string): string => {
  if (category === 'rank') return RANK_COLOR_CLASS[key] ?? SCORE_RANK_BAR_CLASS.OTHERS
  if (category === 'combo') return COMBO_COLOR_CLASS[key] ?? COMBO_LAMP_BAR_CLASS.なし
  return CLEAR_COLOR_CLASS[key] ?? HARD_LAMP_BAR_CLASS.FAILED
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
 * 譜面ごとの排他的な達成状況を1行1グラフの仮想化表として表示する。
 * 定数と人数の列は中央揃えにする。
 * 曲名、定数、人数の列と分布の各凡例でソートでき、ソート状態は画面内に閉じて保持する。
 * 人数表示では最大プレイ人数を100%としてバー幅を伸縮させ、割合表示では全行を同じ幅にする。
 *
 * @param props - 譜面一覧、難易度、集計カテゴリ、数値形式、先頭復帰キー。
 * @returns 楽曲情報と分布グラフを横並びにした仮想化表。
 */
export const ChartStatsGraphTable = (props: ChartStatsGraphTableProps): JSX.Element => {
  const legend = () =>
    props.charts[0] ? buildChartStatsDistribution(props.charts[0], props.category) : []
  const maxPlayerCount = createMemo(() => getMaxChartStatsPlayerCount(props.charts))
  const [sortKey, setSortKey] = createSignal<string | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const sortedCharts = createMemo(() =>
    sortChartStats(props.charts, sortKey(), sortDirection(), props.category, false, props.valueMode)
  )
  const virtualizedTable = createWindowVirtualTable<
    HTMLDivElement,
    HTMLTableSectionElement,
    HTMLDivElement,
    HTMLTableRowElement
  >({
    rowCount: () => sortedCharts().length,
    rowHeight: ROW_HEIGHT,
    resetOnRowCountChange: true,
    layoutDeps: () => `${props.category}|${props.difficulty}`,
  })
  const virtualRows = createMemo(() => virtualizedTable.virtualRows())

  createEffect((previousKey?: string) => {
    const currentKey = props.resetKey
    if (previousKey !== undefined && previousKey !== currentKey) {
      virtualizedTable.resetToTop()
    }
    return currentKey
  })

  createEffect((previousCategory?: ChartStatsCategory) => {
    const currentCategory = props.category
    if (previousCategory !== undefined && previousCategory !== currentCategory) {
      setSortKey(null)
      setSortDirection(null)
    }
    return currentCategory
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
      <table class="block w-full min-w-[46rem] text-sm" aria-rowcount={sortedCharts().length + 1}>
        <caption class="sr-only">{CHART_STATS_COPY.graphTableCaption}</caption>
        <thead class="block">
          <tr
            class="grid"
            style={{ 'grid-template-columns': buildGridTemplateColumns(props.difficulty) }}
          >
            <th
              class={`${TABLE_HEADER_CLASS} px-3`}
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
              class={`${TABLE_HEADER_CLASS} ${NARROW_COLUMN_PADDING_CLASS} justify-center text-center`}
              scope="col"
              aria-sort={headerAriaSort('level')}
            >
              <SortableHeaderButton
                label={
                  props.difficulty === "WORLD'S END"
                    ? CHART_STATS_COPY.worldsendLevel
                    : CHART_STATS_COPY.level
                }
                active={sortKey() === 'level'}
                direction={sortDirection()}
                align="center"
                class="justify-center"
                onClick={() => handleSortChange('level')}
              />
            </th>
            <th
              class={`${TABLE_HEADER_CLASS} ${NARROW_COLUMN_PADDING_CLASS} justify-center text-center`}
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
            <th
              class={`${TABLE_HEADER_CLASS} px-3`}
              scope="col"
              aria-sort={getSortAriaValue(
                legend().some((metric) => metric.key === sortKey()),
                sortDirection()
              )}
            >
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ul class="flex flex-wrap items-center gap-x-3 gap-y-1 font-normal">
                  <For each={legend()}>
                    {(metric) => (
                      <li>
                        <Button
                          type="button"
                          class="relative inline-flex items-center gap-1.5 rounded-sm pb-1 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                          aria-label={`${metric.label}${CHART_STATS_COPY.sortByMetric}${
                            sortKey() === metric.key
                              ? `（${
                                  sortDirection() === 'asc'
                                    ? CHART_STATS_COPY.sortAscending
                                    : CHART_STATS_COPY.sortDescending
                                }）`
                              : ''
                          }`}
                          onClick={() => handleSortChange(metric.key)}
                        >
                          <span
                            class={`${getDistributionColorClass(props.category, metric.key)} h-2.5 w-2.5 rounded-full`}
                            aria-hidden="true"
                          />
                          <span>{metric.label}</span>
                          <span class="absolute bottom-0 left-1/2 flex h-[3px] -translate-x-1/2 items-center">
                            <SortIndicator
                              active={sortKey() === metric.key}
                              direction={sortDirection()}
                            />
                          </span>
                        </Button>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </th>
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
                  {(currentChart) => {
                    const distribution = () =>
                      buildChartStatsDistribution(currentChart, props.category)
                    const barWidthPercent = () =>
                      props.valueMode === 'count'
                        ? calculateChartStatsBarWidthPercent(
                            currentChart.player_count,
                            maxPlayerCount()
                          )
                        : 100

                    return (
                      <tr
                        class="absolute left-0 top-0 grid min-w-full border-t border-border hover:bg-surface-muted"
                        style={{
                          'grid-template-columns': buildGridTemplateColumns(props.difficulty),
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
                          class={`${TABLE_CELL_CLASS} ${NARROW_COLUMN_PADDING_CLASS} justify-center whitespace-nowrap text-center font-jost tabular-nums ${getChartStatsLevelClass(currentChart)}`}
                        >
                          {formatChartStatsLevel(currentChart)}
                        </td>
                        <td
                          class={`${TABLE_CELL_CLASS} ${NARROW_COLUMN_PADDING_CLASS} justify-center whitespace-nowrap text-center font-jost tabular-nums text-text-muted`}
                        >
                          {formatInteger(currentChart.player_count)}
                        </td>
                        <td class={`${TABLE_CELL_CLASS} px-3`}>
                          <span class="sr-only">
                            {distribution()
                              .map((metric) => `${metric.label} ${formatInteger(metric.count)}人`)
                              .join('、')}
                          </span>
                          <div class="w-full">
                            <div style={{ width: `${barWidthPercent()}%` }}>
                              <DistributionBar
                                class="w-full rounded"
                                heightClass="h-3.5"
                                segments={distribution().map((metric) => ({
                                  key: metric.key,
                                  percent:
                                    calculateChartStatsPercent(
                                      metric.count,
                                      currentChart.player_count
                                    ) ?? 0,
                                  colorClass: getDistributionColorClass(props.category, metric.key),
                                  title: metric.label,
                                }))}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  }}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}
