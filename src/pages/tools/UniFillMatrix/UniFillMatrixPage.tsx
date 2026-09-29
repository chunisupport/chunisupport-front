import { Grid3X3 } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, For, Show } from 'solid-js'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { AppSelect } from '../../../components/common/AppSelect'
import { SegmentedToggleGroup } from '../../../components/common/AppTabs'
import { CheckboxField } from '../../../components/common/CheckboxField'
import { HeatmapCountCell } from '../../../components/common/HeatmapCountCell'
import {
  PLAYER_STATS_HEATMAP_AXIS_OPTIONS,
  type PlayerStatsHeatmapAxis,
} from '../../../constants/playerStats'
import { UNI_FILL_MATRIX_PATH } from '../../../constants/routes'
import { getToolLink } from '../../../constants/tools'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { fetchOwnPlayerStatsData } from '../../../usecases/playerStats/fetchOwnPlayerStatsData'
import { filterPlayerStatsRecords } from '../../../utils/playerStatsDashboard'
import { buildUniFillMatrix, type UniFillMatrix } from '../../../utils/uniFillMatrix'
import {
  UNI_FILL_MATRIX_ACHIEVEMENT_OPTIONS,
  UNI_FILL_MATRIX_COPY,
  UNI_FILL_MATRIX_DEFAULT_ACHIEVEMENT,
  UNI_FILL_MATRIX_DEFAULT_DIFFICULTY,
  UNI_FILL_MATRIX_DIFFICULTY_OPTIONS,
  type UniFillMatrixAchievementOption,
  type UniFillMatrixDifficultyOption,
} from './constants'

/** ページ内セクションに共通適用するカードクラス */
const PAGE_SECTION_CLASS = 'rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5'

/** 横スクロール時に左端へ固定するジャンル列のクラス */
const STICKY_GENRE_CELL_CLASS =
  'sticky left-0 z-10 whitespace-nowrap border-r border-border px-3 py-2 text-left'

/** 合計行・合計列の文字を強調するクラス */
const TOTAL_CELL_CLASS = 'font-semibold'

/**
 * ジャンル×横軸の達成状況をヒートマップ表で表示する。
 *
 * @param props.matrix - 集計済みのマトリクス。
 * @param props.caption - 表の読み上げ用説明。
 * @param props.showPercent - 上段を達成率で表示するか。
 * @returns ジャンル列を固定した横スクロール可能なデータ表。
 */
const UniFillMatrixTable = (props: {
  matrix: UniFillMatrix
  caption: string
  showPercent: boolean
}): JSX.Element => (
  <div class="overflow-x-auto rounded-lg border border-border">
    <table class="w-full border-collapse">
      <caption class="sr-only">{props.caption}</caption>
      <thead class="text-xs text-text-muted">
        <tr>
          <th scope="col" class={`${STICKY_GENRE_CELL_CLASS} bg-surface-muted font-semibold`}>
            {UNI_FILL_MATRIX_COPY.genreHeader}
          </th>
          <For each={props.matrix.columns}>
            {(column) => (
              <th
                scope="col"
                class="border-l border-border bg-surface-muted px-3 py-2 text-center font-jost font-semibold"
              >
                {column.label}
              </th>
            )}
          </For>
          <th
            scope="col"
            class="border-l border-border bg-surface-muted px-3 py-2 text-center font-semibold"
          >
            {UNI_FILL_MATRIX_COPY.totalHeader}
          </th>
        </tr>
      </thead>
      <tbody>
        <For each={props.matrix.rows}>
          {(row) => (
            <tr class="border-t border-border">
              <th
                scope="row"
                class={`${STICKY_GENRE_CELL_CLASS} bg-surface font-sans text-sm font-semibold text-text`}
              >
                {row.genre}
              </th>
              <For each={row.cells}>
                {(cell) => (
                  <HeatmapCountCell
                    count={cell.count}
                    total={cell.total}
                    showPercent={props.showPercent}
                    showCompleteMark
                  />
                )}
              </For>
              <HeatmapCountCell
                count={row.total.count}
                total={row.total.total}
                showPercent={props.showPercent}
                showCompleteMark
                class={TOTAL_CELL_CLASS}
              />
            </tr>
          )}
        </For>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-border">
          <th
            scope="row"
            class={`${STICKY_GENRE_CELL_CLASS} bg-surface-muted text-sm font-semibold text-text`}
          >
            {UNI_FILL_MATRIX_COPY.totalHeader}
          </th>
          <For each={props.matrix.columnTotals}>
            {(cell) => (
              <HeatmapCountCell
                count={cell.count}
                total={cell.total}
                showPercent={props.showPercent}
                showCompleteMark
                class={TOTAL_CELL_CLASS}
              />
            )}
          </For>
          <HeatmapCountCell
            count={props.matrix.grandTotal.count}
            total={props.matrix.grandTotal.total}
            showPercent={props.showPercent}
            showCompleteMark
            class={TOTAL_CELL_CLASS}
          />
        </tr>
      </tfoot>
    </table>
  </div>
)

/**
 * ジャンル×レベル（または譜面定数）ごとに、指定条件を何譜面達成したかを表示するツール画面。
 *
 * @returns 難易度・埋め条件・横軸を切り替えられるウニ埋めマトリクス。
 */
const UniFillMatrixPage: Component = () => {
  const [difficulty, setDifficulty] = createSignal<UniFillMatrixDifficultyOption>(
    UNI_FILL_MATRIX_DEFAULT_DIFFICULTY
  )
  const [achievement, setAchievement] = createSignal<UniFillMatrixAchievementOption>(
    UNI_FILL_MATRIX_DEFAULT_ACHIEVEMENT
  )
  const [axis, setAxis] = createSignal<PlayerStatsHeatmapAxis>('level')
  const [showPercent, setShowPercent] = createSignal(false)
  const [pageData] = createResource(fetchOwnPlayerStatsData)

  const matrix = createMemo(() => {
    const data = pageData()
    if (!data) return undefined

    const records = filterPlayerStatsRecords(
      data.records,
      difficulty().value,
      data.targetDifficultyBySongId
    )
    return buildUniFillMatrix(
      records,
      data.attributesBySongId,
      data.genres,
      axis(),
      achievement().value
    )
  })

  const tool = getToolLink(UNI_FILL_MATRIX_PATH)
  useDocumentTitle(tool.title)

  return (
    <ErrorBoundary
      fallback={(error) => (
        <div class="mx-auto w-full max-w-7xl p-4">
          <LoadError error={error} />
        </div>
      )}
    >
      <Show when={pageData()} fallback={<Loading />}>
        {(data) => (
          <Show when={data().records.length > 0} fallback={<PlayerDataEmptyState />}>
            <main class="mx-auto w-full max-w-7xl space-y-4 p-4 sm:space-y-6">
              <header class="flex items-start gap-3">
                <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                  <Grid3X3 class="h-5 w-5 text-action-primary" aria-hidden={true} />
                </span>
                <div>
                  <h1 class="text-2xl font-semibold text-text">{tool.title}</h1>
                  <p class="mt-1 font-sans text-sm text-text-muted">{tool.description}</p>
                </div>
              </header>

              <section class={`${PAGE_SECTION_CLASS} space-y-4`}>
                <div class="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
                  <AppSelect<UniFillMatrixDifficultyOption>
                    options={UNI_FILL_MATRIX_DIFFICULTY_OPTIONS}
                    optionValue="value"
                    optionTextValue="label"
                    value={difficulty()}
                    onChange={(option) => option && setDifficulty(option)}
                    label={UNI_FILL_MATRIX_COPY.difficultyLabel}
                    formatLabel={(option) => option.label}
                    rootClass="md:w-52"
                  />
                  <AppSelect<UniFillMatrixAchievementOption>
                    options={UNI_FILL_MATRIX_ACHIEVEMENT_OPTIONS}
                    optionValue="value"
                    optionTextValue="label"
                    value={achievement()}
                    onChange={(option) => option && setAchievement(option)}
                    label={UNI_FILL_MATRIX_COPY.achievementLabel}
                    formatLabel={(option) => option.label}
                    rootClass="md:w-60"
                  />
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center md:ml-auto">
                    <CheckboxField
                      checked={showPercent()}
                      onChange={setShowPercent}
                      label={UNI_FILL_MATRIX_COPY.percentToggle}
                      class="min-h-8"
                    />
                    <SegmentedToggleGroup
                      value={axis()}
                      onChange={setAxis}
                      options={PLAYER_STATS_HEATMAP_AXIS_OPTIONS}
                      ariaLabel={UNI_FILL_MATRIX_COPY.axisLabel}
                      class="w-full sm:w-auto"
                      itemClass="flex-1 sm:flex-none"
                    />
                  </div>
                </div>

                <Show when={matrix()}>
                  {(currentMatrix) => (
                    <UniFillMatrixTable
                      matrix={currentMatrix()}
                      caption={
                        axis() === 'level'
                          ? UNI_FILL_MATRIX_COPY.levelCaption
                          : UNI_FILL_MATRIX_COPY.chartConstantCaption
                      }
                      showPercent={showPercent()}
                    />
                  )}
                </Show>
              </section>
            </main>
          </Show>
        )}
      </Show>
    </ErrorBoundary>
  )
}

export default UniFillMatrixPage
