import { useQuery } from '@tanstack/solid-query'
import ChartColumnStacked from 'lucide-solid/icons/chart-column-stacked'
import { createMemo, createResource, createSignal, Match, onMount, Show, Switch } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import {
  AppTabContent,
  SegmentedToggleGroup,
  UnderlineTabs,
} from '../../../components/common/AppTabs'
import { CheckboxField } from '../../../components/common/CheckboxField'
import { SearchTextField } from '../../../components/common/SearchTextField'
import { CHART_STATS_PATH } from '../../../constants/routes'
import { getToolLink } from '../../../constants/tools'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { chartStatsQueryOptions } from '../../../queries/chartStats'
import { fetchVersions } from '../../../queries/masterData'
import { fetchNameFolders } from '../../../queries/nameFolders'
import { useSongsData } from '../../../stores/songsData'
import type {
  ChartStats,
  ChartStatsDifficulty,
  ChartStatsResponse,
} from '../../../types/chartStats'
import type {
  ChartStatsAttributeFilter,
  ChartStatsCategory,
  ChartStatsSongMeta,
} from '../../../utils/chartStats'
import {
  buildChartStatsAttributesBySongId,
  createDefaultChartStatsAttributeFilter,
  filterChartStats,
} from '../../../utils/chartStats'
import { ChartStatsDownloadDialog } from './ChartStatsDownloadDialog'
import { ChartStatsFilterPanel } from './ChartStatsFilterPanel'
import { ChartStatsGraphTable } from './ChartStatsGraphTable'
import { ChartStatsTable } from './ChartStatsTable'
import { formatChartStatsGeneratedAt } from './chartStatsDisplay'
import {
  CHART_STATS_CATEGORY_OPTIONS,
  CHART_STATS_COPY,
  CHART_STATS_DEFAULT_DIFFICULTY,
  CHART_STATS_DIFFICULTY_OPTIONS,
  CHART_STATS_VALUE_OPTIONS,
  CHART_STATS_VIEW_OPTIONS,
  type ChartStatsValueMode,
  type ChartStatsViewMode,
} from './constants'

/**
 * 取得済みの難易度別統計を検索可能なグラフまたは表として表示する。
 *
 * @param props.data - 静的JSONから取得した難易度別統計。
 * @param props.difficulty - 現在選択中の難易度。
 * @returns 表示設定と検索結果を含む統計本体。
 */
const ChartStatsContent = (props: {
  data: ChartStatsResponse
  difficulty: ChartStatsDifficulty
}) => {
  const [viewMode, setViewMode] = createSignal<ChartStatsViewMode>('graph')
  const [category, setCategory] = createSignal<ChartStatsCategory>('rank')
  const [valueMode, setValueMode] = createSignal<ChartStatsValueMode>('count')
  const [cumulative, setCumulative] = createSignal(false)
  const [searchQuery, setSearchQuery] = createSignal('')
  const [attributeFilter, setAttributeFilter] = createSignal<ChartStatsAttributeFilter>(
    createDefaultChartStatsAttributeFilter()
  )
  const { songsResponse, worldsendSongsResponse, ensureSongsLoaded, ensureWorldsendSongsLoaded } =
    useSongsData()
  const [versions] = createResource(fetchVersions)
  const [nameFolders] = createResource(fetchNameFolders)

  onMount(() => {
    ensureSongsLoaded()
    ensureWorldsendSongsLoaded()
  })

  const targetSongs = createMemo(() => {
    const response = props.difficulty === "WORLD'S END" ? worldsendSongsResponse() : songsResponse()
    return response?.songs
  })

  /**
   * 楽曲一覧とバージョン一覧から属性マップを生成する。どちらか未取得なら属性絞り込みを保留する。
   *
   * @param songs - 通常楽曲またはWORLD'S END楽曲の一覧。
   * @returns song_idごとの属性マップ。未取得の場合はundefined。
   */
  const buildAttributes = (songs: readonly ChartStatsSongMeta[] | undefined) => {
    const versionList = versions()?.versions
    if (!songs || !versionList) return undefined
    return buildChartStatsAttributesBySongId(songs, versionList)
  }

  const standardAttributesBySongId = createMemo(() => buildAttributes(songsResponse()?.songs))
  const worldsendAttributesBySongId = createMemo(() =>
    buildAttributes(worldsendSongsResponse()?.songs)
  )

  /**
   * 難易度に対応する属性マップを返す。
   *
   * @param difficulty - 対象の難易度。
   * @returns 通常楽曲またはWORLD'S END楽曲の属性マップ。
   */
  const getAttributesBySongId = (difficulty: ChartStatsDifficulty) =>
    difficulty === "WORLD'S END" ? worldsendAttributesBySongId() : standardAttributesBySongId()

  /**
   * 画面の検索・フィルター条件で任意の難易度の譜面を絞り込む。ダウンロード時に表示外の難易度へも適用する。
   *
   * @param stats - 絞り込む難易度別統計。
   * @returns 元の順序を保った絞り込み結果。
   */
  const filterStatsCharts = (stats: ChartStatsResponse): ChartStats[] =>
    filterChartStats(
      stats.charts,
      searchQuery(),
      getAttributesBySongId(stats.difficulty),
      attributeFilter()
    )

  /**
   * 選択した難易度すべてで、画面の属性フィルターを適用できる状態か判定する。
   * 属性マップが未取得の間は属性条件が適用されないため、属性条件があるときは取得完了を待つ。
   *
   * @param difficulties - 判定する難易度。
   * @returns 属性条件がない、または必要な属性マップがすべて取得済みの場合はtrue。
   */
  const isFilterReady = (difficulties: readonly ChartStatsDifficulty[]): boolean => {
    const filter = attributeFilter()
    if (filter.genres === null && filter.versions === null && filter.nameFolders === null) {
      return true
    }
    return difficulties.every((difficulty) => getAttributesBySongId(difficulty) !== undefined)
  }

  const genreOptions = createMemo(() => {
    const songs = targetSongs()
    if (!songs) return []
    return [...new Set(songs.map((song) => song.genre).filter((genre) => genre !== null))].sort(
      (left, right) => left.localeCompare(right, 'ja')
    )
  })

  const versionOptions = createMemo(() => versions()?.versions ?? [])

  const attributesBySongId = () => getAttributesBySongId(props.difficulty)

  const filteredCharts = createMemo(() => filterStatsCharts(props.data))
  const resetKey = createMemo(
    () => `${props.difficulty}|${category()}|${searchQuery()}|${JSON.stringify(attributeFilter())}`
  )

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <p class="font-jost text-xs tabular-nums text-text-muted">
          {CHART_STATS_COPY.generatedAt} {formatChartStatsGeneratedAt(props.data.generated_at)}
        </p>
        <ChartStatsDownloadDialog
          currentDifficulty={props.difficulty}
          filterCharts={filterStatsCharts}
          isFilterReady={isFilterReady}
        />
      </div>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex w-full min-w-0 flex-1 items-end lg:max-w-md">
          <SearchTextField
            id="chart-stats-search"
            class="min-w-0 flex-1"
            frameClass="rounded-l border-r-0"
            label={CHART_STATS_COPY.searchLabel}
            ariaLabel={CHART_STATS_COPY.searchLabel}
            value={searchQuery()}
            placeholder={CHART_STATS_COPY.searchPlaceholder}
            active={searchQuery().length > 0}
            onChange={setSearchQuery}
          />
          <ChartStatsFilterPanel
            idPrefix="chart-stats"
            filters={attributeFilter()}
            onChange={setAttributeFilter}
            genres={genreOptions()}
            versions={versionOptions()}
            nameFolders={nameFolders() ?? []}
            disabled={attributesBySongId() === undefined}
            showConstFilter={props.difficulty !== "WORLD'S END"}
          />
        </div>
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
          <div class="flex h-10 items-center rounded-lg border border-border bg-surface px-3">
            <CheckboxField
              checked={cumulative()}
              disabled={viewMode() !== 'table'}
              onChange={setCumulative}
              label={CHART_STATS_COPY.cumulative}
            />
          </div>
        </div>
      </div>

      <SegmentedToggleGroup
        options={CHART_STATS_CATEGORY_OPTIONS}
        value={category()}
        onChange={setCategory}
        class="w-full sm:w-auto"
        itemClass="flex-1 sm:flex-none"
      />

      <p class="text-sm text-text-muted">
        {filteredCharts().length.toLocaleString()} {CHART_STATS_COPY.resultSuffix}
      </p>

      <Show
        when={filteredCharts().length > 0}
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
              charts={filteredCharts()}
              difficulty={props.difficulty}
              category={category()}
              valueMode={valueMode()}
              cumulative={cumulative()}
              resetKey={resetKey()}
            />
          }
        >
          <ChartStatsGraphTable
            charts={filteredCharts()}
            difficulty={props.difficulty}
            category={category()}
            valueMode={valueMode()}
            resetKey={resetKey()}
          />
        </Show>
      </Show>
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
  const stats = useQuery(() => chartStatsQueryOptions(difficulty()))

  /**
   * 表示難易度を更新する。
   *
   * @param value - 選択された難易度。
   * @returns なし。
   */
  const handleDifficultyChange = (value: ChartStatsDifficulty): void => {
    setDifficulty(value.toUpperCase() as ChartStatsDifficulty)
  }

  const tool = getToolLink(CHART_STATS_PATH)
  useDocumentTitle(tool.title)

  return (
    <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <ChartColumnStacked class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold text-text">{tool.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{tool.description}</p>
        </div>
      </header>

      <UnderlineTabs
        options={CHART_STATS_DIFFICULTY_OPTIONS}
        value={difficulty()}
        onChange={handleDifficultyChange}
        listWrapperClass="sticky top-0 z-10 -mx-4 overflow-x-auto bg-page-pattern px-4 pt-2"
        listClass="min-w-max"
      >
        <AppTabContent value={difficulty()} class="pt-4">
          {/* 難易度ごとに検索・フィルターをリセットするため、統計本体は難易度単位で作り直す。
              再取得でデータが差し替わっても画面の状態は保つ */}
          <Show when={difficulty()} keyed>
            {(current) => (
              <Switch fallback={<Loading />}>
                <Match when={stats.data?.difficulty === current ? stats.data : undefined}>
                  {(data) => <ChartStatsContent data={data()} difficulty={current} />}
                </Match>
                <Match when={stats.isError && !stats.isFetching}>
                  <LoadError error={stats.error} />
                </Match>
              </Switch>
            )}
          </Show>
        </AppTabContent>
      </UnderlineTabs>
    </div>
  )
}

export default ChartStatsPage
