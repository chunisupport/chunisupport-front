import { useNavigate } from '@solidjs/router'
import { Grid3X3 } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, For, Show } from 'solid-js'
import { render } from 'solid-js/web'
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import logoSingle from '../../../assets/logo_single.svg'
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
import { SITE_NAME } from '../../../constants/site'
import { getToolLink } from '../../../constants/tools'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { saveStandardRecordFilterSetting } from '../../../repositories/viewSettingsRepository'
import { authSession } from '../../../stores/authSession'
import { publishStandardRecordFilter } from '../../../stores/standardRecordNavigation'
import { fetchOwnPlayerStatsData } from '../../../usecases/playerStats/fetchOwnPlayerStatsData'
import { captureElementAsImage } from '../../../utils/domImageCapture'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { formatInteger } from '../../../utils/numberFormat'
import { filterPlayerStatsRecords } from '../../../utils/playerStatsDashboard'
import { buildDefaultFilter } from '../../../utils/recordFilterDefaults'
import {
  buildUniFillMatrix,
  buildUniFillMatrixRecordFilter,
  countUniFillMatrixChecks,
  formatUniFillMatrixImageFilename,
  type UniFillMatrix,
  type UniFillMatrixCell,
  type UniFillMatrixRecordTarget,
} from '../../../utils/uniFillMatrix'
import { buildUserProfilePagePath } from '../../../utils/userProfileRoute'
import { scrollToUserProfileContent } from '../../../utils/userProfileScroll'
import {
  UNI_FILL_MATRIX_ACHIEVEMENT_OPTIONS,
  UNI_FILL_MATRIX_AXIS_COLUMN_WEIGHT,
  UNI_FILL_MATRIX_COPY,
  UNI_FILL_MATRIX_DATA_COLUMN_MIN_SPACING,
  UNI_FILL_MATRIX_DEFAULT_ACHIEVEMENT,
  UNI_FILL_MATRIX_DEFAULT_DIFFICULTY,
  UNI_FILL_MATRIX_DIFFICULTY_OPTIONS,
  UNI_FILL_MATRIX_IMAGE_PADDING,
  UNI_FILL_MATRIX_IMAGE_PIXEL_RATIO,
  UNI_FILL_MATRIX_RECORD_SORT_QUERY,
  type UniFillMatrixAchievementOption,
  type UniFillMatrixDifficultyOption,
} from './constants'
import { UniFillMatrixImagePreviewDialog } from './UniFillMatrixImagePreviewDialog'

/** ページ内セクションに共通適用するカードクラス */
const PAGE_SECTION_CLASS = 'rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5'

/** レベル・譜面定数列の中央揃えと枠線のクラス */
const AXIS_CELL_CLASS = 'border-r border-border py-2 text-center'

/** 合計行・合計列の文字を強調するクラス */
const TOTAL_CELL_CLASS = 'font-semibold'

/** レコード画面で絞り込むマスの位置。未指定の軸は絞り込まない */
type UniFillMatrixCellTarget = Pick<UniFillMatrixRecordTarget, 'genre' | 'column'>

/**
 * 未達成の譜面が残っているマスか判定する。
 *
 * @param cell - 判定対象のマス。
 * @returns 未達成の譜面が1件以上ある場合はtrue。
 */
const hasUnachievedCharts = (cell: UniFillMatrixCell): boolean => cell.count < cell.total

/**
 * マスの位置を含むスクリーンリーダー向けの操作文言を作る。
 *
 * @param target - 対象マスのジャンルと列。
 * @returns ジャンル・列見出しと操作内容をつなげた文言。
 */
const toCellActionLabel = (target: UniFillMatrixCellTarget): string =>
  [target.genre, target.column?.label, UNI_FILL_MATRIX_COPY.cellActionLabel]
    .filter((part) => part !== undefined)
    .join(' ')

/**
 * レベル・譜面定数を縦軸、ジャンルを横軸にした達成状況をヒートマップ表で表示する。
 *
 * @param props.matrix - 集計済みのマトリクス。
 * @param props.caption - 表の読み上げ用説明。
 * @param props.axisHeader - 縦軸の見出し。
 * @param props.showPercent - 上段を達成率で表示するか。
 * @param props.onSelectCell - 未達成の譜面が残るマスをクリックしたときの処理。
 * @param props.imageMode - 画像用に固定見出しと操作を無効にするか。
 * @param props.tableRef - 表の論理幅を取得するための参照設定。
 * @returns レベル・譜面定数列を固定した横スクロール可能なデータ表。
 */
const UniFillMatrixTable = (props: {
  matrix: UniFillMatrix
  caption: string
  axisHeader: string
  showPercent: boolean
  onSelectCell?: (target: UniFillMatrixCellTarget) => void
  imageMode?: boolean
  tableRef?: (element: HTMLTableElement) => void
}): JSX.Element => {
  /**
   * 未達成の譜面が残るマスだけにクリック時の処理を割り当てる。
   *
   * @param cell - 対象のマス。
   * @param target - レコード画面で絞り込むマスの位置。
   * @returns HeatmapCountCell に渡すクリック時の処理。対象外のマスでは undefined。
   */
  const selectHandler = (
    cell: UniFillMatrixCell,
    target: UniFillMatrixCellTarget
  ): (() => void) | undefined =>
    !props.imageMode && props.onSelectCell && hasUnachievedCharts(cell)
      ? () => props.onSelectCell?.(target)
      : undefined

  /**
   * ジャンル列と合計列に縦軸列の幅比率を加え、表全体の幅単位を取得する。
   *
   * @returns ジャンル・合計列の幅を1とした表全体の幅単位。
   */
  const columnWeight = () => props.matrix.rows.length + 1 + UNI_FILL_MATRIX_AXIS_COLUMN_WEIGHT

  /**
   * 画像では通常配置に、画面では横スクロールに追従する縦軸セルのクラスを取得する。
   *
   * @returns 中央揃え・枠線と、画面表示時だけ左端固定を適用するクラス。
   */
  const axisCellClass = () => `${AXIS_CELL_CLASS} ${props.imageMode ? '' : 'sticky left-0 z-10'}`

  return (
    <div class="overflow-x-auto rounded-lg border border-border">
      <table
        ref={props.tableRef}
        class="w-full table-fixed border-collapse"
        style={{
          'min-width': `calc(var(--spacing) * ${UNI_FILL_MATRIX_DATA_COLUMN_MIN_SPACING} * ${columnWeight()})`,
        }}
      >
        <caption class="sr-only">{props.caption}</caption>
        <colgroup>
          <col
            style={{ width: `${(UNI_FILL_MATRIX_AXIS_COLUMN_WEIGHT / columnWeight()) * 100}%` }}
          />
          <For each={props.matrix.rows}>{() => <col />}</For>
          <col />
        </colgroup>
        <thead class="text-xs text-text-muted">
          <tr>
            <th scope="col" class={`${axisCellClass()} bg-surface-muted px-1 font-semibold`}>
              {props.axisHeader}
            </th>
            <For each={props.matrix.rows}>
              {(row) => (
                <th
                  scope="col"
                  class="border-l border-border bg-surface-muted px-2 py-2 text-center font-sans font-semibold"
                >
                  {row.genre}
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
          <For each={props.matrix.columns}>
            {(column, columnIndex) => (
              <tr class="border-t border-border">
                <th
                  scope="row"
                  class={`${axisCellClass()} whitespace-nowrap bg-surface px-0 font-jost text-sm font-semibold text-text`}
                >
                  {column.label}
                </th>
                <For each={props.matrix.rows}>
                  {(row) => {
                    /**
                     * 現在のレベル・譜面定数に対応するジャンルのセルを取得する。
                     *
                     * @returns 達成件数と総数。
                     */
                    const cell = () => row.cells[columnIndex()]
                    const target = { genre: row.genre, column }
                    return (
                      <HeatmapCountCell
                        count={cell().count}
                        total={cell().total}
                        showPercent={props.showPercent}
                        showCompleteMark
                        showEmptyAsComplete
                        onSelect={selectHandler(cell(), target)}
                        selectLabel={toCellActionLabel(target)}
                      />
                    )
                  }}
                </For>
                <HeatmapCountCell
                  count={props.matrix.columnTotals[columnIndex()].count}
                  total={props.matrix.columnTotals[columnIndex()].total}
                  showPercent={props.showPercent}
                  showCompleteMark
                  showEmptyAsComplete
                  class={TOTAL_CELL_CLASS}
                  onSelect={selectHandler(props.matrix.columnTotals[columnIndex()], { column })}
                  selectLabel={toCellActionLabel({ column })}
                />
              </tr>
            )}
          </For>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-border">
            <th
              scope="row"
              class={`${axisCellClass()} bg-surface-muted px-1 text-sm font-semibold text-text`}
            >
              {UNI_FILL_MATRIX_COPY.totalHeader}
            </th>
            <For each={props.matrix.rows}>
              {(row) => (
                <HeatmapCountCell
                  count={row.total.count}
                  total={row.total.total}
                  showPercent={props.showPercent}
                  showCompleteMark
                  showEmptyAsComplete
                  class={TOTAL_CELL_CLASS}
                  onSelect={selectHandler(row.total, { genre: row.genre })}
                  selectLabel={toCellActionLabel({ genre: row.genre })}
                />
              )}
            </For>
            <HeatmapCountCell
              count={props.matrix.grandTotal.count}
              total={props.matrix.grandTotal.total}
              showPercent={props.showPercent}
              showCompleteMark
              showEmptyAsComplete
              class={TOTAL_CELL_CLASS}
              onSelect={selectHandler(props.matrix.grandTotal, {})}
              selectLabel={toCellActionLabel({})}
            />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/**
 * ジャンル×レベル（または譜面定数）ごとに、指定条件を何譜面達成したかを表示するツール画面。
 *
 * @returns 難易度・埋め条件・縦軸を切り替えられ、マスから未達成譜面のレコードへ遷移できるウニ埋めマトリックス。
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
  const [masterData] = createResource(fetchMasterData)
  const [versions] = createResource(fetchVersions)
  const [recordNavigationError, setRecordNavigationError] = createSignal('')
  const navigate = useNavigate()
  let matrixTable!: HTMLTableElement

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

  /**
   * マスの条件で埋め条件を満たしていない譜面を通常レコードへ引き継いで遷移する。
   *
   * @param target - レコード画面で絞り込むマスの位置。
   * @returns 保存と遷移処理の完了時に解決されるPromise。
   */
  const handleSelectCell = async (target: UniFillMatrixCellTarget): Promise<void> => {
    const username = authSession.status === 'authenticated' ? authSession.user?.username : undefined
    const currentMasterData = masterData()
    const versionItems = versions()?.versions
    if (!username || !currentMasterData || !versionItems) return

    setRecordNavigationError('')
    try {
      const filter = buildUniFillMatrixRecordFilter(
        buildDefaultFilter(currentMasterData, versionItems),
        {
          ...target,
          difficulty: difficulty().value,
          achievement: achievement().value,
        }
      )
      await saveStandardRecordFilterSetting(filter)
      publishStandardRecordFilter(username, filter)
      navigate(
        `${buildUserProfilePagePath(username, 'record_normal')}?${UNI_FILL_MATRIX_RECORD_SORT_QUERY}`
      )
      scrollToUserProfileContent()
    } catch (error) {
      setRecordNavigationError(
        toUserFriendlyErrorMessage(error, UNI_FILL_MATRIX_COPY.recordNavigationError)
      )
    }
  }

  const tool = getToolLink(UNI_FILL_MATRIX_PATH)
  useDocumentTitle(tool.title)

  /**
   * 表の見た目を保ち、ロゴ・埋め条件・チェック数と生成元を加えたPNGを生成する。
   *
   * @returns 生成したPNG画像。マトリクスが未集計の場合は拒否されるPromise。
   */
  const captureMatrixImage = async (): Promise<Blob> => {
    const currentMatrix = matrix()
    const tableWrapper = matrixTable.parentElement
    if (!currentMatrix || !tableWrapper) throw new Error('Uni fill matrix is not ready')

    const currentShowPercent = showPercent()
    const checks = countUniFillMatrixChecks(currentMatrix)
    const tableBorderWidth = tableWrapper.offsetWidth - tableWrapper.clientWidth
    const imageWidth =
      matrixTable.offsetWidth + tableBorderWidth + UNI_FILL_MATRIX_IMAGE_PADDING * 2
    const difficultyLabel = difficulty().label
    const achievementLabel = achievement().label
    const axisHeader =
      axis() === 'level'
        ? UNI_FILL_MATRIX_COPY.levelHeader
        : UNI_FILL_MATRIX_COPY.chartConstantHeader
    const caption =
      axis() === 'level'
        ? UNI_FILL_MATRIX_COPY.levelCaption
        : UNI_FILL_MATRIX_COPY.chartConstantCaption

    const host = document.createElement('div')
    host.className = 'pointer-events-none fixed top-0'
    host.style.left = `${-imageWidth}px`
    host.setAttribute('aria-hidden', 'true')
    host.inert = true
    document.body.appendChild(host)
    let dispose: (() => void) | undefined
    let sheet!: HTMLDivElement

    try {
      dispose = render(
        () => (
          <div
            ref={sheet}
            class="space-y-4 bg-surface font-sans text-text"
            style={{ width: `${imageWidth}px`, padding: `${UNI_FILL_MATRIX_IMAGE_PADDING}px` }}
          >
            <header class="flex flex-wrap items-center justify-between gap-6">
              <div class="min-w-0 flex-1 space-y-2">
                <div class="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    class="h-10 w-10 shrink-0 bg-text"
                    style={{
                      'mask-image': `url(${logoSingle})`,
                      'mask-position': 'center',
                      'mask-repeat': 'no-repeat',
                      'mask-size': 'contain',
                    }}
                  />
                  <h1 class="min-w-0 flex-1 text-2xl font-semibold">{tool.title}</h1>
                </div>
                <div class="text-sm text-text-muted">
                  <p class="whitespace-nowrap">{difficultyLabel}</p>
                  <p class="whitespace-nowrap">
                    <strong class="font-bold">{UNI_FILL_MATRIX_COPY.imageGoalLabel}</strong>
                    {`: ${achievementLabel}`}
                  </p>
                </div>
              </div>
              <p class="shrink-0 whitespace-nowrap font-jost tabular-nums">
                <span class="sr-only">{UNI_FILL_MATRIX_COPY.imageChecksLabel}</span>
                <span class="text-4xl font-semibold">{formatInteger(checks.count)}</span>
                <span class="text-xl font-normal text-text-muted">
                  {` / ${formatInteger(checks.total)}`}
                </span>
              </p>
            </header>
            <UniFillMatrixTable
              matrix={currentMatrix}
              caption={caption}
              axisHeader={axisHeader}
              showPercent={currentShowPercent}
              imageMode
            />
            <footer class="text-right text-sm text-text-muted">
              <span class="whitespace-nowrap">
                {UNI_FILL_MATRIX_COPY.imageGeneratedBy}{' '}
                <strong class="font-bold">{SITE_NAME}</strong>
              </span>
            </footer>
          </div>
        ),
        host
      )
      return await captureElementAsImage(sheet, {
        format: 'png',
        pixelRatio: UNI_FILL_MATRIX_IMAGE_PIXEL_RATIO,
      })
    } finally {
      dispose?.()
      host.remove()
    }
  }

  /**
   * 現在の表示条件と日時からマトリクス画像のファイル名を生成する。
   *
   * @returns 難易度・埋め条件・縦軸・日時を含むPNGファイル名。
   */
  const createMatrixImageFilename = (): string =>
    formatUniFillMatrixImageFilename({
      difficulty: difficulty().value,
      achievement: achievement().value,
      axis: axis(),
    })

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
                    <UniFillMatrixImagePreviewDialog
                      captureImage={captureMatrixImage}
                      createFilename={createMatrixImageFilename}
                      disabled={!matrix()}
                      triggerClass="self-start sm:self-auto"
                    />
                  </div>
                </div>

                <Show when={matrix()}>
                  {(currentMatrix) => (
                    <UniFillMatrixTable
                      matrix={currentMatrix()}
                      tableRef={(element) => {
                        matrixTable = element
                      }}
                      caption={
                        axis() === 'level'
                          ? UNI_FILL_MATRIX_COPY.levelCaption
                          : UNI_FILL_MATRIX_COPY.chartConstantCaption
                      }
                      axisHeader={
                        axis() === 'level'
                          ? UNI_FILL_MATRIX_COPY.levelHeader
                          : UNI_FILL_MATRIX_COPY.chartConstantHeader
                      }
                      showPercent={showPercent()}
                      onSelectCell={(target) => void handleSelectCell(target)}
                    />
                  )}
                </Show>
                <Show when={recordNavigationError()}>
                  <p class="font-sans text-sm text-danger" role="alert">
                    {recordNavigationError()}
                  </p>
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
