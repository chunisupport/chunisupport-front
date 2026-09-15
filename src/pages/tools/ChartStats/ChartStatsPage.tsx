import { createMemo, createResource, createSignal, ErrorBoundary, Show } from 'solid-js'
import { fetchChartStats } from '../../../api/chartStats'
import { LoadError, Loading } from '../../../components'
import { AppSwitch } from '../../../components/common/AppSwitch'
import {
  AppTabContent,
  SegmentedToggleGroup,
  UnderlineTabs,
} from '../../../components/common/AppTabs'
import { PaginationNav } from '../../../components/common/PaginationNav'
import { SearchTextField } from '../../../components/common/SearchTextField'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { ChartStatsDifficulty, ChartStatsResponse } from '../../../types/chartStats'
import type { ChartStatsCategory } from '../../../utils/chartStats'
import { filterChartStatsByTitle, paginateChartStats } from '../../../utils/chartStats'
import { ChartStatsGraphList } from './ChartStatsGraphList'
import { ChartStatsTable } from './ChartStatsTable'
import { formatChartStatsGeneratedAt } from './chartStatsDisplay'
import {
  CHART_STATS_CATEGORY_OPTIONS,
  CHART_STATS_COPY,
  CHART_STATS_DEFAULT_DIFFICULTY,
  CHART_STATS_DIFFICULTY_OPTIONS,
  CHART_STATS_PAGE_SIZE,
  CHART_STATS_VALUE_OPTIONS,
  CHART_STATS_VIEW_OPTIONS,
  type ChartStatsValueMode,
  type ChartStatsViewMode,
} from './constants'

/**
 * 取得済みの難易度別統計を検索・ページング可能なグラフまたは表として表示する。
 *
 * @param props.data - 静的JSONから取得した難易度別統計。
 * @param props.difficulty - 現在選択中の難易度。
 * @returns 表示設定、検索結果、ページネーションを含む統計本体。
 */
const ChartStatsContent = (props: {
  data: ChartStatsResponse
  difficulty: ChartStatsDifficulty
}) => {
  const [viewMode, setViewMode] = createSignal<ChartStatsViewMode>('graph')
  const [category, setCategory] = createSignal<ChartStatsCategory>('rank')
  const [valueMode, setValueMode] = createSignal<ChartStatsValueMode>('count')
  const [showHeatmap, setShowHeatmap] = createSignal(false)
  const [searchQuery, setSearchQuery] = createSignal('')
  const [page, setPage] = createSignal(1)

  const filteredCharts = createMemo(() => filterChartStatsByTitle(props.data.charts, searchQuery()))
  const totalPages = createMemo(() =>
    Math.max(1, Math.ceil(filteredCharts().length / CHART_STATS_PAGE_SIZE))
  )
  const visibleCharts = createMemo(() =>
    paginateChartStats(filteredCharts(), page(), CHART_STATS_PAGE_SIZE)
  )
  const resultRange = createMemo(() => {
    if (filteredCharts().length === 0) return null
    const start = (page() - 1) * CHART_STATS_PAGE_SIZE + 1
    return {
      start,
      end: Math.min(start + CHART_STATS_PAGE_SIZE - 1, filteredCharts().length),
    }
  })

  /**
   * 曲名検索を更新し、検索結果の先頭ページへ戻す。
   *
   * @param value - 新しい検索文字列。
   * @returns なし。
   */
  const handleSearchChange = (value: string): void => {
    setSearchQuery(value)
    setPage(1)
  }

  return (
    <div class="space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <SearchTextField
          id="chart-stats-search"
          class="w-full lg:max-w-md"
          label={CHART_STATS_COPY.searchLabel}
          ariaLabel={CHART_STATS_COPY.searchLabel}
          value={searchQuery()}
          placeholder={CHART_STATS_COPY.searchPlaceholder}
          active={searchQuery().length > 0}
          onChange={handleSearchChange}
        />
        <div class="flex flex-wrap items-center gap-2">
          <SegmentedToggleGroup
            options={CHART_STATS_VIEW_OPTIONS}
            value={viewMode()}
            onChange={setViewMode}
          />
          <SegmentedToggleGroup
            options={CHART_STATS_VALUE_OPTIONS}
            value={valueMode()}
            onChange={setValueMode}
          />
          <Show when={viewMode() === 'table'}>
            <div class="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3">
              <span class="text-sm font-medium text-text-muted">{CHART_STATS_COPY.heatmap}</span>
              <AppSwitch
                label={CHART_STATS_COPY.heatmap}
                checked={showHeatmap()}
                onChange={setShowHeatmap}
              />
            </div>
          </Show>
        </div>
      </div>

      <SegmentedToggleGroup
        options={CHART_STATS_CATEGORY_OPTIONS}
        value={category()}
        onChange={setCategory}
        class="w-full sm:w-auto"
        itemClass="flex-1 sm:flex-none"
      />

      <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-text-muted">
        <p>
          {filteredCharts().length.toLocaleString()} {CHART_STATS_COPY.resultSuffix}
        </p>
        <Show when={resultRange()}>
          {(range) => (
            <p class="font-jost tabular-nums">
              {range().start.toLocaleString()}–{range().end.toLocaleString()} /{' '}
              {filteredCharts().length.toLocaleString()}
            </p>
          )}
        </Show>
      </div>

      <Show
        when={visibleCharts().length > 0}
        fallback={
          <p class="rounded-lg border border-border bg-surface px-4 py-6 text-sm text-text-muted">
            {CHART_STATS_COPY.empty}
          </p>
        }
      >
        <Show
          when={viewMode() === 'graph'}
          fallback={
            <ChartStatsTable
              charts={visibleCharts()}
              difficulty={props.difficulty}
              category={category()}
              valueMode={valueMode()}
              showHeatmap={showHeatmap()}
            />
          }
        >
          <ChartStatsGraphList
            charts={visibleCharts()}
            difficulty={props.difficulty}
            category={category()}
            valueMode={valueMode()}
          />
        </Show>
      </Show>

      <PaginationNav
        currentPage={page()}
        totalPages={totalPages()}
        onPageChange={setPage}
        labels={{
          nav: 'レコード統計のページ',
          previous: '前の50譜面',
          next: '次の50譜面',
        }}
      />
    </div>
  )
}

/**
 * 難易度別の全譜面レコード統計ページを表示する。
 *
 * @returns 難易度タブと静的JSONから取得した統計画面。
 */
const ChartStatsPage = () => {
  const [difficulty, setDifficulty] = createSignal<ChartStatsDifficulty>(
    CHART_STATS_DEFAULT_DIFFICULTY
  )
  const [stats] = createResource(difficulty, fetchChartStats)

  /**
   * 表示難易度を更新する。
   *
   * @param value - 選択された難易度。
   * @returns なし。
   */
  const handleDifficultyChange = (value: ChartStatsDifficulty): void => {
    setDifficulty(value.toUpperCase() as ChartStatsDifficulty)
  }

  useDocumentTitle(CHART_STATS_COPY.title)

  return (
    <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold text-text">{CHART_STATS_COPY.title}</h1>
        <p class="text-sm text-text-muted">{CHART_STATS_COPY.description}</p>
        <Show when={!stats.loading && !stats.error ? stats() : undefined}>
          {(data) => (
            <p class="font-jost text-xs tabular-nums text-text-muted">
              {CHART_STATS_COPY.generatedAt} {formatChartStatsGeneratedAt(data().generated_at)}
            </p>
          )}
        </Show>
      </header>

      <UnderlineTabs
        options={CHART_STATS_DIFFICULTY_OPTIONS}
        value={difficulty()}
        onChange={handleDifficultyChange}
        listWrapperClass="overflow-x-auto"
        listClass="min-w-max"
      >
        <AppTabContent value={difficulty()} class="pt-4">
          <ErrorBoundary fallback={(error) => <LoadError error={error} />}>
            <Show when={!stats.loading ? stats() : undefined} fallback={<Loading />}>
              {(data) => <ChartStatsContent data={data()} difficulty={difficulty()} />}
            </Show>
          </ErrorBoundary>
        </AppTabContent>
      </UnderlineTabs>
    </div>
  )
}

export default ChartStatsPage
