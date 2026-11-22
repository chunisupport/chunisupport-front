import { createMemo, createSignal, For, Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import { AppSelect } from '../../../../components/common/AppSelect'
import type { CourseStatsBandDTO, RatingBandDTO } from '../../../../types/api'
import {
  COURSE_MAX_SCORE,
  completeCourseStatsRatingBands,
  formatCourseStatsRate,
} from '../../../../utils/courseStats'
import { truncateDecimal } from '../../../../utils/numberFormat'
import { ALL_RATING_BAND_LABEL } from '../../../../utils/ratingBand'
import {
  calculateDisplayedScoreDifference,
  formatScoreDifference,
  getScoreDifferenceClass,
} from '../../../../utils/scoreDifference'
import {
  StatsAverageScoreChart,
  StatsBarChart,
  type StatsChartDataset,
} from '../../components/StatsCharts'
import {
  COURSE_CLEAR_CHART_DATASET_DEFINITIONS,
  COURSE_COMBO_CHART_DATASET_DEFINITIONS,
} from '../../components/statsChartDefinitions'
import { isOwnBestAverageRatingBand } from '../../components/statsHighlight'
import { COURSE_PAGE_COPY } from '../../constants'

type CourseStatsTableView = 'averageScore' | 'medianScore' | 'clear' | 'combo'

type CourseStatsTableViewOption = {
  label: string
  value: CourseStatsTableView
}

type CourseStatsTableColumnDefinition = {
  label: string
  getValue: (band: CourseStatsBandDTO) => string
  getClass?: (band: CourseStatsBandDTO) => string | undefined
}

type Props = {
  /** レーティング帯別のコース統計一覧 */
  stats: CourseStatsBandDTO[] | undefined
  /** 統計取得中かどうか */
  isLoading: boolean
  /** 統計取得エラー */
  error: unknown
  /** ログインユーザーのベスト枠平均レーティング */
  bestAverage?: number | null
  /** マスターデータのレーティング帯定義 */
  ratingBands?: RatingBandDTO[]
  /** ログインユーザーのプレイ済みコーススコア */
  ownScore?: number
}

/** コース統計テーブルの表示カテゴリ選択肢 */
const COURSE_STATS_TABLE_VIEW_OPTIONS: CourseStatsTableViewOption[] = [
  { label: 'CLEAR平均スコア', value: 'averageScore' },
  { label: 'CLEAR中央値スコア', value: 'medianScore' },
  { label: 'クリア状況', value: 'clear' },
  { label: 'FC/AJ', value: 'combo' },
]

const HIGHLIGHTED_RATING_BAND_ROW_CLASS =
  'border-l-4 border-l-action-primary bg-action-primary-muted font-semibold'
const NORMAL_RATING_BAND_ROW_CLASS = 'border-l-4 border-l-transparent'
const TABLE_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-right whitespace-nowrap'
const TABLE_LEFT_HEADER_CELL_CLASS =
  'sticky top-0 z-10 bg-surface-muted px-2 py-2 text-left whitespace-nowrap'
const TABLE_RATING_BAND_CELL_CLASS = 'px-2 py-2 text-left whitespace-nowrap'
const TABLE_VALUE_CELL_CLASS = 'px-2 py-2 text-right font-jost tabular-nums whitespace-nowrap'

/**
 * 平均・中央値スコアを切り捨て整数で表示文字列へ変換する。
 *
 * @param score - 表示対象のスコア値。
 * @returns 小数点以下を切り捨てた桁区切り文字列。
 */
const formatTruncatedScore = (score: number): string =>
  truncateDecimal(score, 0).toLocaleString('ja-JP')

/**
 * 表示カテゴリに応じたコース統計テーブルの列定義を返す。
 *
 * @param view - 選択中の表示カテゴリ。
 * @param ownScore - 差分比較に使うログインユーザーのプレイ済みスコア。
 * @returns ベスト枠平均列の右側に表示する列定義一覧。
 */
const getCourseTableColumnDefinitions = (
  view: CourseStatsTableView,
  ownScore: number | undefined
): CourseStatsTableColumnDefinition[] => {
  switch (view) {
    case 'averageScore':
      return [
        {
          label: '人数',
          getValue: (band) => band.player_count.toLocaleString('ja-JP'),
        },
        {
          label: 'CLEAR平均',
          getValue: (band) =>
            band.average_score === null ? '-' : formatTruncatedScore(band.average_score),
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
          getValue: (band) => band.player_count.toLocaleString('ja-JP'),
        },
        {
          label: 'CLEAR中央値',
          getValue: (band) =>
            band.median_score === null ? '-' : formatTruncatedScore(band.median_score),
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
    case 'clear':
      return [
        {
          label: '人数',
          getValue: (band) => band.player_count.toLocaleString('ja-JP'),
        },
        {
          label: 'FAILED',
          getValue: (band) => band.clear.failed.toLocaleString('ja-JP'),
        },
        {
          label: 'CLEAR',
          getValue: (band) => band.clear.clear.toLocaleString('ja-JP'),
        },
        {
          label: 'CLEAR率',
          getValue: (band) => formatCourseStatsRate(band.clear.clear, band.player_count),
        },
      ]
    case 'combo':
      return [
        {
          label: '人数',
          getValue: (band) => band.player_count.toLocaleString('ja-JP'),
        },
        {
          label: 'NONE',
          getValue: (band) => band.combo.none.toLocaleString('ja-JP'),
        },
        {
          label: 'FC',
          getValue: (band) => band.combo.fc.toLocaleString('ja-JP'),
        },
        {
          label: 'AJ',
          getValue: (band) => band.combo.aj.toLocaleString('ja-JP'),
        },
        {
          label: 'FC以上率',
          getValue: (band) =>
            formatCourseStatsRate(band.combo.fc + band.combo.aj, band.player_count),
        },
        {
          label: 'AJ率',
          getValue: (band) => formatCourseStatsRate(band.combo.aj, band.player_count),
        },
      ]
  }
}

/**
 * コース詳細ページのレーティング帯別統計を表とグラフで表示する。
 *
 * @param props - 統計データ、読み込み状態、エラー、ログインユーザーのベスト枠平均・スコア情報。
 * @returns コース統計セクション。
 */
const CourseStatsSection = (props: Props) => {
  const [selectedTableView, setSelectedTableView] =
    createSignal<CourseStatsTableView>('averageScore')

  const selectedTableViewOption = createMemo(
    () =>
      COURSE_STATS_TABLE_VIEW_OPTIONS.find((option) => option.value === selectedTableView()) ??
      COURSE_STATS_TABLE_VIEW_OPTIONS[0]
  )
  const displayedColumns = createMemo(() =>
    getCourseTableColumnDefinitions(selectedTableView(), props.ownScore)
  )

  const chartStats = createMemo(() => {
    const rawStats = (props.stats ?? []).filter(
      (band) => band.rating_band !== ALL_RATING_BAND_LABEL
    )
    const ratingBands = props.ratingBands
    return ratingBands
      ? completeCourseStatsRatingBands(
          rawStats,
          ratingBands.filter((band) => band.label !== ALL_RATING_BAND_LABEL)
        )
      : rawStats
  })
  const labels = createMemo(() => chartStats().map((band) => band.rating_band))
  const clearDatasets = createMemo<StatsChartDataset[]>(() =>
    COURSE_CLEAR_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.clear[definition.valueKey]),
    }))
  )
  const comboDatasets = createMemo<StatsChartDataset[]>(() =>
    COURSE_COMBO_CHART_DATASET_DEFINITIONS.map((definition) => ({
      ...definition,
      values: chartStats().map((band) => band.combo[definition.valueKey]),
    }))
  )
  const averageScores = createMemo(() => chartStats().map((band) => band.average_score))
  const medianScores = createMemo(() => chartStats().map((band) => band.median_score))

  /**
   * 統計テーブルの表示カテゴリを更新する。
   *
   * @param option - 選択された表示カテゴリ。
   * @returns なし。
   */
  const handleTableViewChange = (option: CourseStatsTableViewOption | null): void => {
    if (option) setSelectedTableView(option.value)
  }

  /**
   * 統計行に適用するハイライト状態を含むクラスを返す。
   *
   * @param ratingBandLabel - 判定対象のレーティング帯ラベル。
   * @returns ハイライト有無に応じたテーブル行クラス。
   */
  const getRowClass = (ratingBandLabel: string): string =>
    `border-t border-border ${
      isOwnBestAverageRatingBand(ratingBandLabel, props.bestAverage, props.ratingBands)
        ? HIGHLIGHTED_RATING_BAND_ROW_CLASS
        : NORMAL_RATING_BAND_ROW_CLASS
    }`

  return (
    <section class="space-y-3 rounded-md border border-border bg-surface p-4">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">{COURSE_PAGE_COPY.statsHeading}</h2>
        <p class="text-xs text-text-muted">{COURSE_PAGE_COPY.statsDescription}</p>
      </div>

      <Show when={!props.error} fallback={<LoadError error={props.error} />}>
        <Show
          when={!props.isLoading && props.stats !== undefined}
          fallback={<Loading ariaLabel={COURSE_PAGE_COPY.statsLoadingLabel} />}
        >
          <Show
            when={(props.stats?.length ?? 0) > 0}
            fallback={<p class="text-sm text-text-muted">{COURSE_PAGE_COPY.statsEmpty}</p>}
          >
            <div class="sm:w-48">
              <AppSelect<CourseStatsTableViewOption>
                options={COURSE_STATS_TABLE_VIEW_OPTIONS}
                optionValue="value"
                optionTextValue="label"
                value={selectedTableViewOption()}
                onChange={handleTableViewChange}
                label={COURSE_PAGE_COPY.statsViewSelectLabel}
                labelVariant="srOnly"
                triggerClass="h-10 text-text-muted"
                contentZIndexClass="z-50"
                formatLabel={(option) => option.label}
              />
            </div>

            <div class="max-h-[75vh] overflow-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr>
                    <th class={TABLE_LEFT_HEADER_CELL_CLASS}>
                      {COURSE_PAGE_COPY.statsRatingBandColumn}
                    </th>
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
                            <td
                              class={`${TABLE_VALUE_CELL_CLASS} ${column.getClass?.(band) ?? ''}`}
                            >
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

            <div class="mt-4 grid gap-4 lg:grid-cols-2">
              <StatsAverageScoreChart
                class="lg:col-span-2"
                title={COURSE_PAGE_COPY.statsCharts.averageTitle}
                ariaLabel={COURSE_PAGE_COPY.statsCharts.averageAriaLabel}
                ariaLabelWithOwnScore={COURSE_PAGE_COPY.statsCharts.averageWithOwnScoreAriaLabel}
                labels={labels()}
                averageScores={averageScores()}
                medianScores={medianScores()}
                ownScore={props.ownScore}
                maxScore={COURSE_MAX_SCORE}
              />
              <StatsBarChart
                title={COURSE_PAGE_COPY.statsCharts.clearTitle}
                ariaLabel={COURSE_PAGE_COPY.statsCharts.clearAriaLabel}
                labels={labels()}
                datasets={clearDatasets()}
              />
              <StatsBarChart
                title={COURSE_PAGE_COPY.statsCharts.comboTitle}
                ariaLabel={COURSE_PAGE_COPY.statsCharts.comboAriaLabel}
                labels={labels()}
                datasets={comboDatasets()}
              />
            </div>
          </Show>
        </Show>
      </Show>
    </section>
  )
}

export default CourseStatsSection
