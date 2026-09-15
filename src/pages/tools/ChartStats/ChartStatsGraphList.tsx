import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { For } from 'solid-js'
import { DistributionBar } from '../../../components/common/record/DistributionBar'
import {
  ALL_JUSTICE_CRITICAL_BG_CLASS,
  COMBO_LAMP_BAR_CLASS,
  HARD_LAMP_BAR_CLASS,
  SCORE_RANK_BAR_CLASS,
} from '../../../components/common/record/recordStyleClasses'
import { buildSongDetailPath, buildWorldsendSongDetailPath } from '../../../constants/routes'
import type { ChartStats, ChartStatsDifficulty } from '../../../types/chartStats'
import {
  buildChartStatsDistribution,
  type ChartStatsCategory,
  calculateChartStatsPercent,
  isWorldsendChartStats,
} from '../../../utils/chartStats'
import { formatInteger } from '../../../utils/numberFormat'
import {
  formatChartStatsLevel,
  formatChartStatsValue,
  getChartStatsLevelClass,
} from './chartStatsDisplay'
import { CHART_STATS_COPY, type ChartStatsValueMode } from './constants'

type ChartStatsGraphListProps = {
  /** 表示対象の譜面統計 */
  charts: readonly ChartStats[]
  /** 現在選択中の難易度 */
  difficulty: ChartStatsDifficulty
  /** 現在選択中の集計カテゴリ */
  category: ChartStatsCategory
  /** 人数または割合の表示形式 */
  valueMode: ChartStatsValueMode
}

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
 * 譜面ごとの排他的な達成状況を積み上げバーで表示する。
 *
 * @param props - 譜面一覧、難易度、カテゴリ、数値表示形式。
 * @returns 楽曲詳細リンクと分布グラフを含むカード一覧。
 */
export const ChartStatsGraphList = (props: ChartStatsGraphListProps): JSX.Element => (
  <section aria-label={`${CHART_STATS_CATEGORY_OPTIONS_LABEL[props.category]}のグラフ`}>
    <p class="mb-3 text-xs text-text-muted">{CHART_STATS_COPY.graphCaption}</p>
    <ul class="space-y-3">
      <For each={props.charts}>
        {(chart) => {
          const distribution = () => buildChartStatsDistribution(chart, props.category)
          return (
            <li>
              <article class="rounded-lg border border-border bg-surface p-4 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h2 class="font-sans text-base font-semibold text-text">
                      <A
                        href={buildChartHref(chart, props.difficulty)}
                        class="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        {chart.title}
                      </A>
                    </h2>
                    <p
                      class={`mt-1 font-oswald text-sm tabular-nums ${getChartStatsLevelClass(chart)}`}
                    >
                      {formatChartStatsLevel(chart)}
                    </p>
                  </div>
                  <p class="font-jost text-sm tabular-nums text-text-muted">
                    {CHART_STATS_COPY.playerCount} {formatInteger(chart.player_count)}
                  </p>
                </div>

                <DistributionBar
                  class="mt-3 rounded"
                  heightClass="h-7"
                  segments={distribution().map((metric) => ({
                    key: metric.key,
                    percent: calculateChartStatsPercent(metric.count, chart.player_count) ?? 0,
                    colorClass: getDistributionColorClass(props.category, metric.key),
                    title: `${metric.label}: ${formatChartStatsValue(metric.count, chart.player_count, props.valueMode)}`,
                  }))}
                />

                <ul class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
                  <For each={distribution()}>
                    {(metric) => (
                      <li class="flex min-w-0 items-center gap-2 text-xs">
                        <span
                          class={`${getDistributionColorClass(props.category, metric.key)} h-2.5 w-2.5 shrink-0 rounded-full`}
                          aria-hidden="true"
                        />
                        <span class="truncate text-text-muted">{metric.label}</span>
                        <span class="ml-auto font-jost font-semibold tabular-nums text-text">
                          {formatChartStatsValue(metric.count, chart.player_count, props.valueMode)}
                        </span>
                      </li>
                    )}
                  </For>
                </ul>
              </article>
            </li>
          )
        }}
      </For>
    </ul>
  </section>
)

/** 集計カテゴリのアクセシブル表示名 */
const CHART_STATS_CATEGORY_OPTIONS_LABEL: Record<ChartStatsCategory, string> = {
  rank: 'RANK',
  combo: 'COMBO',
  clear: 'HARD',
}
