import { createMemo, For } from 'solid-js'
import type { RatingBandDTO, SongStatsBandDTO } from '../../../../types/api'
import { truncateDecimal } from '../../../../utils/numberFormat'
import { ALL_RATING_BAND_LABEL } from '../../../../utils/ratingBand'
import {
  calculateDisplayedScoreDifference,
  formatScoreDifference,
  getScoreDifferenceClass,
} from '../../../../utils/scoreDifference'
import { completeSongStatsRatingBands } from '../../../../utils/songStats'
import {
  StatsAverageScoreChart,
  StatsBarChart,
  type StatsChartDataset,
} from '../../components/StatsCharts'
import { isOwnBestAverageRatingBand } from '../../components/statsHighlight'
import {
  CLEAR_CHART_DATASET_DEFINITIONS,
  COMBO_CHART_DATASET_DEFINITIONS,
  RANK_CHART_DATASET_DEFINITIONS,
} from './songStatsChartDefinitions'

type Props = {
  stats: SongStatsBandDTO[]
  selectedView: SongStatsTableView
  bestAverage?: number | null
  ratingBands?: RatingBandDTO[]
  ownScore?: number
}

type SongStatsChartsProps = {
  stats: SongStatsBandDTO[]
  ratingBands?: RatingBandDTO[]
  ownScore?: number
}

export type SongStatsTableView = 'averageScore' | 'medianScore' | 'scoreRank' | 'combo' | 'clear'

export type SongStatsTableViewOption = {
  label: string
  value: SongStatsTableView
}

type SongStatsTableColumnDefinition = {
  label: string
  getValue: (band: SongStatsBandDTO) => number | string
  getClass?: (band: SongStatsBandDTO) => string | undefined
}

/** 統計テーブルの表示カテゴリ選択肢 */
export const TABLE_VIEW_OPTIONS: SongStatsTableViewOption[] = [
  { label: '平均スコア', value: 'averageScore' },
  { label: '中央値スコア', value: 'medianScore' },
  { label: 'スコアランク', value: 'scoreRank' },
  { label: 'FC/AJ/AJC', value: 'combo' },
  { label: 'ハードランプ', value: 'clear' },
]
/** ランク別人数を表示する列とAPIレスポンスのキー */
const RANK_STAT_COLUMN_DEFINITIONS = [
  { label: 'MAX', valueKey: 'max' },
  { label: 'SSS+', valueKey: 'sssp' },
  { label: 'SSS', valueKey: 'sss' },
  { label: 'SS+', valueKey: 'ssp' },
  { label: 'SS', valueKey: 'ss' },
  { label: 'S+', valueKey: 'sp' },
  { label: 'S', valueKey: 's' },
  { label: '～AAA', valueKey: 'aaal' },
] as const
const HIGHLIGHTED_RATING_BAND_ROW_CLASS =
  'border-l-4 border-l-action-primary bg-action-primary-muted font-semibold'
const NORMAL_RATING_BAND_ROW_CLASS = 'border-l-4 border-l-transparent'
/** 統計テーブルのヘッダーセルに適用するTailwindクラス */
const TABLE_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-right whitespace-nowrap'
/** 統計テーブルの左寄せヘッダーセルに適用するTailwindクラス */
const TABLE_LEFT_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-left whitespace-nowrap'
/** 統計テーブルのベスト枠平均セルに適用するTailwindクラス */
const TABLE_RATING_BAND_CELL_CLASS = 'px-2 py-2 text-left'
/** 統計テーブルの通常セルに適用するTailwindクラス */
const TABLE_VALUE_CELL_CLASS = 'px-2 py-2 text-right tabular-nums'

/**
 * 平均スコアを整数部のみの表示文字列へ変換する。
 * 自分との差の算出と同じ `truncateDecimal` で切り捨て、表示値と差の基準を一致させる。
 *
 * @param score 表示するスコア値。
 * @returns 小数点以下を除いた平均スコア文字列。
 */
const formatAverageScore = (score: number): string => truncateDecimal(score, 0).toLocaleString()

/**
 * 統計表に表示する列定義をカテゴリごとに取得する。
 *
 * @param view 表示対象の統計カテゴリ。
 * @param ownScore 平均スコアとの差分表示に利用する自分のスコア。
 * @returns 共通列の右側に表示する列定義。
 */
const getTableColumnDefinitions = (
  view: SongStatsTableView,
  ownScore: number | undefined
): SongStatsTableColumnDefinition[] => {
  switch (view) {
    case 'averageScore':
      return [
        {
          label: '人数',
          getValue: (band) => band.player_count.toLocaleString(),
        },
        {
          label: '平均スコア',
          getValue: (band) =>
            band.average_score === null ? '-' : formatAverageScore(band.average_score),
        },
        {
          label: '自分との差',
          getValue: (band) => {
            const difference = calculateDisplayedScoreDifference(ownScore, band.average_score)
            return difference === undefined ? '-' : formatScoreDifference(difference)
          },
          getClass: (band) => {
            const difference = calculateDisplayedScoreDifference(ownScore, band.average_score)
            return difference === undefined ? undefined : getScoreDifferenceClass(difference)
          },
        },
      ]
    case 'medianScore':
      return [
        {
          label: '人数',
          getValue: (band) => band.player_count.toLocaleString(),
        },
        {
          label: '中央値スコア',
          getValue: (band) =>
            band.median_score === null ? '-' : formatAverageScore(band.median_score),
        },
        {
          label: '自分との差',
          getValue: (band) => {
            const difference = calculateDisplayedScoreDifference(ownScore, band.median_score)
            return difference === undefined ? '-' : formatScoreDifference(difference)
          },
          getClass: (band) => {
            const difference = calculateDisplayedScoreDifference(ownScore, band.median_score)
            return difference === undefined ? undefined : getScoreDifferenceClass(difference)
          },
        },
      ]
    case 'scoreRank':
      return RANK_STAT_COLUMN_DEFINITIONS.map((column) => ({
        label: column.label,
        getValue: (band: SongStatsBandDTO) => band.rank[column.valueKey].toLocaleString(),
      }))
    case 'combo':
      return [
        { label: 'FC', getValue: (band) => band.combo.fc.toLocaleString() },
        { label: 'AJ', getValue: (band) => band.combo.aj.toLocaleString() },
        { label: 'AJC', getValue: (band) => band.combo.ajc.toLocaleString() },
      ]
    case 'clear':
      return [
        { label: 'CLEAR', getValue: (band) => band.clear.clear.toLocaleString() },
        { label: 'HARD', getValue: (band) => band.clear.hard.toLocaleString() },
        { label: 'BRAVE', getValue: (band) => band.clear.brave.toLocaleString() },
        { label: 'ABSOLUTE', getValue: (band) => band.clear.absolute.toLocaleString() },
        {
          label: 'CATASTROPHY',
          getValue: (band) => band.clear.catastrophy.toLocaleString(),
        },
      ]
  }
}

/**
 * 積み上げグラフに表示する統計行を取得する。
 * @param stats APIから取得したレーティング帯別統計行。
 * @returns ALL行を除いたグラフ表示用の統計行。
 */
const getChartStats = (stats: SongStatsBandDTO[]): SongStatsBandDTO[] =>
  stats.filter((band) => band.rating_band !== ALL_RATING_BAND_LABEL)

/**
 * 難易度別統計テーブルの下に表示する集計グラフを生成する。
 * @param props 表示対象の統計行と、平均・中央値グラフへ重ねる自分のスコア。
 * @returns RANK、FC/AJ/AJC、CLEAR系ランプ、平均スコアのグラフ。
 */
const SongStatsCharts = (props: SongStatsChartsProps) => {
  const chartStats = createMemo(() => {
    const stats = getChartStats(props.stats)
    const ratingBands = props.ratingBands

    return ratingBands
      ? completeSongStatsRatingBands(
          stats,
          ratingBands.filter((band) => band.label !== ALL_RATING_BAND_LABEL)
        )
      : stats
  })
  const labels = createMemo(() => chartStats().map((band) => band.rating_band))
  const rankDatasets = createMemo<StatsChartDataset[]>(() =>
    RANK_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.rank[definition.valueKey]),
    }))
  )
  const comboDatasets = createMemo<StatsChartDataset[]>(() =>
    COMBO_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.combo[definition.valueKey]),
    }))
  )
  const clearDatasets = createMemo<StatsChartDataset[]>(() =>
    CLEAR_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.clear[definition.valueKey]),
    }))
  )
  const averageScores = createMemo(() => chartStats().map((band) => band.average_score))
  const medianScores = createMemo(() => chartStats().map((band) => band.median_score))

  return (
    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <StatsBarChart
        title="RANK"
        ariaLabel="レーティング帯別のスコアランク人数グラフ"
        labels={labels()}
        datasets={rankDatasets()}
      />
      <StatsBarChart
        title="COMBO"
        ariaLabel="レーティング帯別のNONE、FC、AJ、AJC人数グラフ"
        labels={labels()}
        datasets={comboDatasets()}
      />
      <StatsBarChart
        title="HARD"
        ariaLabel="レーティング帯別のハードランプ人数グラフ"
        labels={labels()}
        datasets={clearDatasets()}
      />
      <StatsAverageScoreChart
        labels={labels()}
        averageScores={averageScores()}
        medianScores={medianScores()}
        ownScore={props.ownScore}
      />
    </div>
  )
}

/**
 * 楽曲詳細ページのレーティング帯別統計を表とグラフで表示する。
 * @param props 表示する統計行。
 * @returns 難易度別統計テーブルと集計グラフ。
 */
const SongStatsTable = (props: Props) => {
  const displayedColumns = createMemo(() =>
    getTableColumnDefinitions(props.selectedView, props.ownScore)
  )

  /**
   * 統計行に適用するハイライト状態を含むクラスを返す。
   *
   * @param ratingBandLabel 判定対象のレーティング帯ラベル。
   * @returns ハイライト有無に応じたテーブル行クラス。
   */
  const getRowClass = (ratingBandLabel: string): string =>
    `border-t border-border ${
      isOwnBestAverageRatingBand(ratingBandLabel, props.bestAverage, props.ratingBands)
        ? HIGHLIGHTED_RATING_BAND_ROW_CLASS
        : NORMAL_RATING_BAND_ROW_CLASS
    }`

  return (
    <>
      <div class="max-h-[75vh] overflow-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr>
              <th class={TABLE_LEFT_HEADER_CELL_CLASS}>ベスト枠平均</th>
              <For each={displayedColumns()}>
                {(column) => <th class={TABLE_HEADER_CELL_CLASS}>{column.label}</th>}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.stats}>
              {(band) => (
                <tr class={getRowClass(band.rating_band)}>
                  <td class={TABLE_RATING_BAND_CELL_CLASS}>{band.rating_band}</td>
                  <For each={displayedColumns()}>
                    {(column) => (
                      <td class={`${TABLE_VALUE_CELL_CLASS} ${column.getClass?.(band) ?? ''}`}>
                        {column.getValue(band)}
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <SongStatsCharts
        stats={props.stats}
        ratingBands={props.ratingBands}
        ownScore={props.ownScore}
      />
    </>
  )
}

export default SongStatsTable
