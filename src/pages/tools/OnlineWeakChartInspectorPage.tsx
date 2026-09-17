import { A } from '@solidjs/router'
import { Chart, LinearScale, PointElement, ScatterController, Tooltip } from 'chart.js'
import { ChartNoAxesCombined } from 'lucide-solid'
import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import { fetchChartScores } from '../../api/chartScores'
import { fetchRatingBands } from '../../api/ratingBands'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { CheckboxField } from '../../components/common/CheckboxField'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { ONLINE_WEAK_CHART_MAX_DIFFERENCE_RANGE } from '../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { buildSongDetailPath } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { accentPreference, themePreference } from '../../stores/themePreferences'
import type { PlayerDataDifficulty, RatingBandDTO } from '../../types/api'
import type { ChartScoresResponse } from '../../types/chartScores'
import { fetchUserRatingWithCache } from '../../usecases/cache/fetchUserRatingWithCache'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { formatChartConst } from '../../utils/chartConstFormat'
import {
  CHART_SCATTER_TOOLTIP_CLASS,
  updateChartScatterTooltip,
} from '../../utils/chartScatterTooltip'
import { CHART_COLOR_FALLBACK, resolveChartColor } from '../../utils/chartTheme'
import { formatInteger } from '../../utils/numberFormat'
import {
  compareRecordsWithRatingBand,
  formatOnlineWeakChartTooltipDetail,
  type OnlineWeakChartEntry,
} from '../../utils/onlineWeakChartInspector'
import { ALL_RATING_BAND_LABEL, resolveInitialBestSlotRatingBand } from '../../utils/ratingBand'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import {
  ONLINE_WEAK_CHART_COPY,
  ONLINE_WEAK_CHART_PAGE_SIZE,
  ONLINE_WEAK_CHART_POINT_JITTER,
} from './onlineWeakChartInspector.constants'

Chart.register(ScatterController, LinearScale, PointElement, Tooltip)

type RatingBandOption = { label: string; value: string }
type ComparisonPoint = { x: number; y: number; entry: OnlineWeakChartEntry }

/**
 * 選択した難易度の公開スコア統計を取得する。
 *
 * @param difficulties - 集計対象の難易度。
 * @returns 難易度別の統計JSON。
 */
const fetchSelectedChartScores = (
  difficulties: PlayerDataDifficulty[]
): Promise<ChartScoresResponse[]> => Promise.all(difficulties.map(fetchChartScores))

/**
 * 比較する譜面をグラフ上で識別できる散布図座標へ変換する。
 *
 * @param entries - 比較済みの譜面。
 * @returns 譜面定数と平均との差の点。
 */
const createComparisonPoints = (entries: OnlineWeakChartEntry[]): ComparisonPoint[] =>
  entries.map((entry, index) => ({
    x: entry.record.const + ((index % 7) - 3) * ONLINE_WEAK_CHART_POINT_JITTER,
    y: entry.difference,
    entry,
  }))

/**
 * 譜面定数ごとに平均との差を散布図で表示する。
 *
 * @param props.entries - 比較対象の譜面。
 * @returns 平均以下と平均以上を色分けした散布図。
 */
const OnlineWeakChartScatter = (props: { entries: OnlineWeakChartEntry[] }): JSX.Element => {
  let canvasRef!: HTMLCanvasElement
  let tooltipRef!: HTMLDivElement
  let chart: Chart<'scatter', ComparisonPoint[]> | undefined

  createEffect(() => {
    themePreference()
    accentPreference()
    const points = createComparisonPoints(props.entries)
    const textColor = resolveChartColor('--cs-color-text-muted', CHART_COLOR_FALLBACK)
    const gridColor = resolveChartColor('--cs-color-border', CHART_COLOR_FALLBACK)
    const lowerColor = resolveChartColor('--cs-color-weak-chart-outlier', CHART_COLOR_FALLBACK)
    const higherColor = resolveChartColor('--cs-color-weak-chart-point', CHART_COLOR_FALLBACK)

    chart?.destroy()
    chart = new Chart(canvasRef, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: ONLINE_WEAK_CHART_COPY.lowerDataset,
            data: points.filter((point) => point.y < 0),
            backgroundColor: lowerColor,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: ONLINE_WEAK_CHART_COPY.higherDataset,
            data: points.filter((point) => point.y >= 0),
            backgroundColor: higherColor,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          legend: { labels: { color: textColor } },
          tooltip: {
            enabled: false,
            external: ({ tooltip }) =>
              updateChartScatterTooltip(tooltipRef, canvasRef, tooltip, (raw) => {
                const { entry } = raw as ComparisonPoint
                return {
                  record: entry.record,
                  detail: formatOnlineWeakChartTooltipDetail(entry.record, entry.difference),
                }
              }),
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor },
          },
          y: {
            min: -ONLINE_WEAK_CHART_MAX_DIFFERENCE_RANGE,
            max: ONLINE_WEAK_CHART_MAX_DIFFERENCE_RANGE,
            grid: {
              color: (context) => (context.tick.value === 0 ? textColor : gridColor),
            },
            ticks: {
              color: textColor,
              callback: (value) => formatScoreDifference(Number(value)),
            },
          },
        },
      },
    })
  })

  onCleanup(() => chart?.destroy())

  return (
    <figure class="rounded-lg border border-border bg-surface p-4">
      <figcaption class="mb-3 font-semibold">{ONLINE_WEAK_CHART_COPY.chartTitle}</figcaption>
      <div class="overflow-x-auto overscroll-x-contain">
        <div class="h-112 min-w-[44rem]">
          <canvas ref={canvasRef} role="img" aria-label={ONLINE_WEAK_CHART_COPY.chartLabel} />
        </div>
      </div>
      <div ref={tooltipRef} class={CHART_SCATTER_TOOLTIP_CLASS} role="tooltip" />
    </figure>
  )
}

/**
 * 同じレート帯との比較結果を表示する。
 *
 * @returns レート帯と難易度を選択できる散布図・譜面表。
 */
const OnlineWeakChartInspectorPage = (): JSX.Element => {
  useDocumentTitle(ONLINE_WEAK_CHART_COPY.title)
  const [ratingBandsResource] = createResource(fetchRatingBands)
  const username = () => authSession.user?.username ?? null
  const [ownRating] = createResource(username, fetchUserRatingWithCache)
  const [ownRecords] = createResource(username, fetchUserRecordWithCache)
  const [selectedBand, setSelectedBand] = createSignal<RatingBandOption | null>(null)
  const [selectedDifficulties, setSelectedDifficulties] = createSignal<PlayerDataDifficulty[]>([
    'MASTER',
    'ULTIMA',
  ])
  const [scoreSnapshots] = createResource(selectedDifficulties, fetchSelectedChartScores)
  const [visibleCount, setVisibleCount] = createSignal(ONLINE_WEAK_CHART_PAGE_SIZE)

  const ratingBandOptions = createMemo(() =>
    (ratingBandsResource() ?? [])
      .filter((band) => band.label !== ALL_RATING_BAND_LABEL)
      .sort((left, right) => right.sort_order - left.sort_order)
      .map((band: RatingBandDTO) => ({ label: band.label, value: band.label }))
  )

  createEffect(() => {
    if (selectedBand() || !ratingBandsResource() || ownRating.loading) return
    const band = resolveInitialBestSlotRatingBand(
      ratingBandsResource() ?? [],
      ownRating()?.best_average
    )
    if (band) setSelectedBand({ label: band.label, value: band.label })
  })

  const entries = createMemo(() =>
    compareRecordsWithRatingBand(
      ownRecords()?.standard ?? [],
      scoreSnapshots() ?? [],
      selectedBand()?.value ?? ''
    ).sort((left, right) => left.difference - right.difference)
  )
  const visibleEntries = createMemo(() => entries().slice(0, visibleCount()))
  const isLoading = () =>
    ratingBandsResource.loading || ownRating.loading || ownRecords.loading || scoreSnapshots.loading
  const loadError = () =>
    ratingBandsResource.error ?? ownRating.error ?? ownRecords.error ?? scoreSnapshots.error

  /**
   * 対象難易度の選択状態を更新する。
   *
   * @param difficulty - 切り替える難易度。
   * @returns なし。
   */
  const toggleDifficulty = (difficulty: PlayerDataDifficulty): void => {
    setSelectedDifficulties((current) =>
      current.includes(difficulty)
        ? current.length > 1
          ? current.filter((item) => item !== difficulty)
          : current
        : PLAYER_DATA_DIFFICULTIES.filter((item) => current.includes(item) || item === difficulty)
    )
    setVisibleCount(ONLINE_WEAK_CHART_PAGE_SIZE)
  }

  return (
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <ChartNoAxesCombined class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{ONLINE_WEAK_CHART_COPY.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{ONLINE_WEAK_CHART_COPY.description}</p>
        </div>
      </header>

      <div class="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4">
        <Show when={selectedBand()}>
          <AppSelect<RatingBandOption>
            options={ratingBandOptions()}
            optionValue="value"
            optionTextValue="label"
            value={selectedBand()}
            onChange={(option) => {
              if (option) {
                setSelectedBand(option)
                setVisibleCount(ONLINE_WEAK_CHART_PAGE_SIZE)
              }
            }}
            label={ONLINE_WEAK_CHART_COPY.ratingBand}
            rootClass="w-full sm:w-44"
            triggerClass="h-10"
            formatLabel={(option) => option.label}
          />
        </Show>
        <fieldset class="flex flex-wrap gap-x-3 gap-y-1">
          <legend class="mb-1 text-sm font-medium">{ONLINE_WEAK_CHART_COPY.difficulty}</legend>
          <For each={PLAYER_DATA_DIFFICULTIES}>
            {(difficulty) => (
              <CheckboxField
                id={`online-weak-chart-${difficulty}`}
                checked={selectedDifficulties().includes(difficulty)}
                onChange={() => toggleDifficulty(difficulty)}
                label={difficulty}
                textVariant="large"
                class="relative flex items-center gap-2"
              />
            )}
          </For>
        </fieldset>
      </div>

      <Show when={!loadError()} fallback={<LoadError error={loadError()} />}>
        <Show when={!isLoading()} fallback={<Loading />}>
          <Show
            when={entries().length > 0}
            fallback={
              <p class="rounded-lg border border-border bg-surface p-8 text-center text-text-muted">
                {ONLINE_WEAK_CHART_COPY.empty}
              </p>
            }
          >
            <OnlineWeakChartScatter entries={entries()} />
            <section class="rounded-lg border border-border bg-surface">
              <h2 class="border-b border-border px-4 py-3 text-lg font-semibold">
                {ONLINE_WEAK_CHART_COPY.tableTitle}
                <span class="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-sm text-text-muted">
                  {entries().length}
                </span>
              </h2>
              <div class="overflow-x-auto">
                <table class="w-full min-w-150 text-sm">
                  <caption class="sr-only">{ONLINE_WEAK_CHART_COPY.tableCaption}</caption>
                  <thead class="bg-surface-muted text-text-muted">
                    <tr>
                      <th scope="col" class="px-3 py-2 text-left">
                        {ONLINE_WEAK_CHART_COPY.songTitle}
                      </th>
                      <th scope="col" class="px-3 py-2 text-center">
                        難易度
                      </th>
                      <th scope="col" class="px-3 py-2 text-center">
                        {ONLINE_WEAK_CHART_COPY.chartConst}
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        {ONLINE_WEAK_CHART_COPY.ownScore}
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        {ONLINE_WEAK_CHART_COPY.averageScore}
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        {ONLINE_WEAK_CHART_COPY.difference}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={visibleEntries()}>
                      {({ record, averageScore, difference }) => (
                        <tr class="border-t border-border hover:bg-surface-muted">
                          <td class="max-w-64 px-3 py-2 font-sans">
                            <A
                              href={buildSongDetailPath(record.id, record.difficulty)}
                              class="block truncate text-link hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                              title={record.title}
                            >
                              {record.title}
                            </A>
                          </td>
                          <td class="px-3 py-2 text-center">
                            <DifficultyBadge difficulty={record.difficulty} />
                          </td>
                          <td class="px-3 py-2 text-center font-jost">
                            {formatChartConst(record.const)}
                          </td>
                          <td class="px-3 py-2 text-right font-jost tabular-nums">
                            {formatInteger(record.score)}
                          </td>
                          <td class="px-3 py-2 text-right font-jost tabular-nums">
                            {formatInteger(Math.trunc(averageScore))}
                          </td>
                          <td
                            class={`px-3 py-2 text-right font-jost tabular-nums ${getScoreDifferenceClass(difference)}`}
                          >
                            {formatScoreDifference(difference)}
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
              <Show when={visibleEntries().length < entries().length}>
                <div class="border-t border-border p-3 text-center">
                  <AppButton
                    onClick={() => setVisibleCount((count) => count + ONLINE_WEAK_CHART_PAGE_SIZE)}
                  >
                    {ONLINE_WEAK_CHART_COPY.more}
                  </AppButton>
                </div>
              </Show>
            </section>
          </Show>
        </Show>
      </Show>
    </main>
  )
}

export default OnlineWeakChartInspectorPage
