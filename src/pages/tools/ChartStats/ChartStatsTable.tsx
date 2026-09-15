import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { buildSongDetailPath, buildWorldsendSongDetailPath } from '../../../constants/routes'
import type { ChartStats, ChartStatsDifficulty } from '../../../types/chartStats'
import {
  buildChartStatsCumulativeValues,
  type ChartStatsCategory,
  isWorldsendChartStats,
} from '../../../utils/chartStats'
import { formatInteger } from '../../../utils/numberFormat'
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
  /** 達成率に応じたセル背景を表示するか */
  showHeatmap: boolean
}

/** 表の見出しセルに共通適用するクラス */
const TABLE_HEADER_CLASS =
  'whitespace-nowrap bg-surface-muted px-3 py-2 text-right text-xs font-semibold text-text-muted'

/**
 * 達成率に応じたテーマ連動のヒートマップ背景色を生成する。
 *
 * @param count - 累積達成人数。
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
 * 譜面ごとの累積達成人数または達成率を表形式で表示する。
 *
 * @param props - 譜面一覧、難易度、カテゴリ、数値形式、ヒートマップ設定。
 * @returns 横スクロール可能な意味的データテーブル。
 */
export const ChartStatsTable = (props: ChartStatsTableProps): JSX.Element => {
  const columns = () =>
    props.charts[0] ? buildChartStatsCumulativeValues(props.charts[0], props.category) : []

  return (
    <div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class="min-w-full border-collapse text-sm">
        <caption class="sr-only">{CHART_STATS_COPY.tableCaption}</caption>
        <thead>
          <tr>
            <th class={`${TABLE_HEADER_CLASS} min-w-56 text-left`} scope="col">
              曲名
            </th>
            <th class={TABLE_HEADER_CLASS} scope="col">
              {props.difficulty === "WORLD'S END" ? 'Lv./属性' : '譜面定数'}
            </th>
            <th class={TABLE_HEADER_CLASS} scope="col">
              {CHART_STATS_COPY.playerCount}
            </th>
            <For each={columns()}>
              {(column) => (
                <th class={TABLE_HEADER_CLASS} scope="col">
                  {column.label}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <For each={props.charts}>
            {(chart) => (
              <tr class="hover:bg-surface-muted">
                <th class="min-w-56 px-3 py-2 text-left font-medium" scope="row">
                  <A
                    href={buildChartHref(chart, props.difficulty)}
                    class="font-sans text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    {chart.title}
                  </A>
                </th>
                <td
                  class={`whitespace-nowrap px-3 py-2 text-right font-oswald tabular-nums ${getChartStatsLevelClass(chart)}`}
                >
                  {formatChartStatsLevel(chart)}
                </td>
                <td class="whitespace-nowrap px-3 py-2 text-right font-jost tabular-nums text-text-muted">
                  {formatInteger(chart.player_count)}
                </td>
                <For each={buildChartStatsCumulativeValues(chart, props.category)}>
                  {(metric) => (
                    <td
                      class="min-w-20 whitespace-nowrap border-l border-border px-3 py-2 text-right font-jost font-semibold tabular-nums text-text"
                      style={{
                        background: props.showHeatmap
                          ? getHeatmapBackground(metric.count, chart.player_count)
                          : undefined,
                      }}
                      title={`${formatInteger(metric.count)}人 / ${formatChartStatsValue(
                        metric.count,
                        chart.player_count,
                        'percent'
                      )}`}
                      aria-label={`${metric.label}: ${formatInteger(metric.count)}人 / ${formatInteger(
                        chart.player_count
                      )}人、${formatChartStatsValue(metric.count, chart.player_count, 'percent')}`}
                    >
                      {formatChartStatsValue(metric.count, chart.player_count, props.valueMode)}
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}
