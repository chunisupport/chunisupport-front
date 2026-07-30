import { createResource, For, Show } from 'solid-js'
import { fetchAllSongs } from '../../api/songs'
import { Loading } from '../../components'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatInteger, formatTruncatedFixed } from '../../utils/numberFormat'
import {
  ADMIN_DATA_COVERAGE_COPY,
  DATA_COVERAGE_LEVEL_COLUMN_CLASS,
  DATA_COVERAGE_PERCENT_DECIMAL_PLACES,
  DATA_COVERAGE_VALUE_COLUMN_CLASS,
} from './AdminDataCoveragePage.constants'
import {
  buildChartConstantCoverage,
  type ChartConstantCoverage,
  type DataCoverageCount,
} from './dataCoverage'

/**
 * HTTPキャッシュを利用せず有効な通常楽曲を取得する。
 *
 * @returns APIから取得した最新の通常楽曲一覧。
 */
const fetchFreshAllSongs = () => fetchAllSongs({ cache: 'no-store' })

type CoverageValueProps = {
  /** 表示する判明数、総数、充足率。 */
  coverage: DataCoverageCount
}

/**
 * 判明数、総数、充足率を1つの集計値として表示する。
 *
 * @param props - 表示対象の集計値。
 * @returns 件数と小数第2位まで切り捨てた充足率。
 */
const CoverageValue = (props: CoverageValueProps) => (
  <span class="whitespace-nowrap font-jost tabular-nums">
    {formatInteger(props.coverage.known)} / {formatInteger(props.coverage.total)}（
    {props.coverage.total > 0
      ? `${formatTruncatedFixed(props.coverage.percent, DATA_COVERAGE_PERCENT_DECIMAL_PLACES)}%`
      : ADMIN_DATA_COVERAGE_COPY.unavailablePercentage}
    ）
  </span>
)

type CoverageCellProps = {
  /** セルに表示する判明数、総数、充足率。 */
  coverage: DataCoverageCount
  /** 全体集計セルとして強調するか。 */
  emphasized?: boolean
}

/**
 * 充足率に応じた背景バーと集計値を表のセルとして表示する。
 *
 * @param props - 表示対象の集計値と強調設定。
 * @returns 充足率を背景幅で示す集計セル。
 */
const CoverageCell = (props: CoverageCellProps) => (
  <td
    class={`p-0 text-right ${props.emphasized === true ? 'bg-surface-muted/50 font-semibold' : ''}`}
  >
    <div class="relative overflow-hidden px-3 py-3">
      <span
        aria-hidden="true"
        class="absolute inset-y-0 left-0 bg-action-primary-muted"
        style={{ width: `${props.coverage.percent}%` }}
      />
      <span class="relative">
        <CoverageValue coverage={props.coverage} />
      </span>
    </div>
  </td>
)

type CoverageMatrixProps = {
  /** 難易度・レベル別の譜面定数充足状況。 */
  coverage: ChartConstantCoverage
}

/**
 * 難易度とレベルを行列にした譜面定数充足状況を表示する。
 *
 * @param props - 表示する譜面定数充足状況。
 * @returns 難易度を列、レベルを行にした集計表。
 */
const CoverageMatrix = (props: CoverageMatrixProps) => {
  /**
   * レベル10以上の譜面が存在する難易度だけを表示対象とする。
   *
   * @returns マトリクスへ表示する難易度の一覧。
   */
  const visibleDifficulties = () =>
    PLAYER_DATA_DIFFICULTIES.filter(
      (difficulty) => props.coverage.byDifficulty[difficulty].total > 0
    )

  return (
    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-text">{ADMIN_DATA_COVERAGE_COPY.matrixHeading}</h2>
      <div class="overflow-x-auto rounded-lg border border-border bg-surface">
        <table class="min-w-full table-fixed border-collapse text-sm whitespace-nowrap">
          <caption class="sr-only">{ADMIN_DATA_COVERAGE_COPY.matrixCaption}</caption>
          <colgroup>
            <col class={DATA_COVERAGE_LEVEL_COLUMN_CLASS} />
            <For each={visibleDifficulties()}>
              {() => <col class={DATA_COVERAGE_VALUE_COLUMN_CLASS} />}
            </For>
            <col class={DATA_COVERAGE_VALUE_COLUMN_CLASS} />
          </colgroup>
          <thead class="bg-surface-muted">
            <tr>
              <th class="px-3 py-3 text-center" scope="col">
                {ADMIN_DATA_COVERAGE_COPY.levelColumn}
              </th>
              <For each={visibleDifficulties()}>
                {(difficulty) => (
                  <th class="px-3 py-3 text-center" scope="col">
                    <DifficultyBadge difficulty={difficulty} />
                  </th>
                )}
              </For>
              <th class="px-3 py-3 text-center" scope="col">
                {ADMIN_DATA_COVERAGE_COPY.totalColumn}
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={props.coverage.rows}>
              {(row) => (
                <tr class="border-t border-border">
                  <th class="px-3 py-3 text-center font-jost text-base" scope="row">
                    {row.level}
                  </th>
                  <For each={visibleDifficulties()}>
                    {(difficulty) => <CoverageCell coverage={row.byDifficulty[difficulty]} />}
                  </For>
                  <CoverageCell coverage={row.total} emphasized />
                </tr>
              )}
            </For>
          </tbody>
          <tfoot class="border-t-2 border-border-strong bg-surface-muted font-semibold">
            <tr>
              <th
                aria-label={ADMIN_DATA_COVERAGE_COPY.allLevelsRowAriaLabel}
                class="px-3 py-3"
                scope="row"
              />
              <For each={visibleDifficulties()}>
                {(difficulty) => (
                  <CoverageCell coverage={props.coverage.byDifficulty[difficulty]} />
                )}
              </For>
              <CoverageCell coverage={props.coverage.overall} emphasized />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

/**
 * ADMINとEDITOR向けの譜面定数充足状況ダッシュボードを表示する。
 *
 * 画面を開くたびに全曲APIを直接呼び、ブラウザキャッシュとは独立した最新の有効楽曲を集計する。
 *
 * @returns 総合充足率、難易度・レベル別マトリクス、未判明譜面一覧。
 */
const AdminDataCoveragePage = () => {
  useDocumentTitle(ADMIN_DATA_COVERAGE_COPY.pageTitle)

  const [songsResponse] = createResource(fetchFreshAllSongs)

  return (
    <div class="mx-auto w-full max-w-7xl space-y-6 p-4">
      <h1 class="text-2xl font-semibold text-text">{ADMIN_DATA_COVERAGE_COPY.heading}</h1>

      <Show when={!songsResponse.loading} fallback={<Loading />}>
        <Show
          when={!songsResponse.error}
          fallback={
            <p
              class="rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger"
              role="alert"
            >
              {ADMIN_DATA_COVERAGE_COPY.loadError}
            </p>
          }
        >
          <Show when={songsResponse()} keyed>
            {(response) => {
              const coverage = buildChartConstantCoverage(response.songs)

              return (
                <>
                  <section class="rounded-lg border border-border bg-surface p-5 shadow-sm">
                    <h2 class="text-sm font-medium text-text-muted">
                      {ADMIN_DATA_COVERAGE_COPY.overallHeading}
                    </h2>
                    <div class="mt-2 text-3xl font-semibold text-text">
                      <CoverageValue coverage={coverage.overall} />
                    </div>
                    <progress
                      class="mt-4 h-3 w-full appearance-none overflow-hidden rounded bg-action-secondary [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-action-primary [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-action-secondary [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-action-primary"
                      value={coverage.overall.percent}
                      max="100"
                      aria-label={ADMIN_DATA_COVERAGE_COPY.overallHeading}
                    >
                      {formatTruncatedFixed(
                        coverage.overall.percent,
                        DATA_COVERAGE_PERCENT_DECIMAL_PLACES
                      )}
                      %
                    </progress>
                  </section>

                  <CoverageMatrix coverage={coverage} />

                  <section class="space-y-3">
                    <h2 class="text-xl font-semibold text-text">
                      {ADMIN_DATA_COVERAGE_COPY.unknownHeading}
                    </h2>
                    <p class="font-jost text-sm text-text-muted tabular-nums whitespace-nowrap">
                      {formatInteger(coverage.unknownCharts.length)}
                      {ADMIN_DATA_COVERAGE_COPY.unknownCountSuffix}
                    </p>
                    <Show
                      when={coverage.unknownCharts.length > 0}
                      fallback={
                        <p class="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
                          {ADMIN_DATA_COVERAGE_COPY.noUnknownCharts}
                        </p>
                      }
                    >
                      <div class="overflow-x-auto rounded-lg border border-border bg-surface">
                        <table class="min-w-full text-sm whitespace-nowrap">
                          <caption class="sr-only">
                            {ADMIN_DATA_COVERAGE_COPY.unknownCaption}
                          </caption>
                          <thead class="bg-surface-muted">
                            <tr>
                              <th class="w-full px-3 py-3 text-left" scope="col">
                                {ADMIN_DATA_COVERAGE_COPY.songColumn}
                              </th>
                              <th class="w-px px-3 py-3 text-right" scope="col">
                                {ADMIN_DATA_COVERAGE_COPY.difficultyColumn}
                              </th>
                              <th class="w-px px-3 py-3 text-right" scope="col">
                                {ADMIN_DATA_COVERAGE_COPY.levelColumn}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={coverage.unknownCharts}>
                              {(chart) => (
                                <tr class="border-t border-border">
                                  <td class="max-w-0 px-3 py-3 font-sans text-text">
                                    <span class="block truncate">{chart.songTitle}</span>
                                  </td>
                                  <td class="w-px px-3 py-3 text-right">
                                    <DifficultyBadge difficulty={chart.difficulty} />
                                  </td>
                                  <td class="w-px px-3 py-3 text-right font-jost tabular-nums">
                                    {chart.level}
                                  </td>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    </Show>
                  </section>
                </>
              )
            }}
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default AdminDataCoveragePage
