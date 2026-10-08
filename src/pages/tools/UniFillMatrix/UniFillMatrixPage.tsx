import { useNavigate } from '@solidjs/router'
import { ArrowLeftRight, ArrowUpDown, Grid3X3 } from 'lucide-solid'
import type { Accessor, Component, JSX, Setter } from 'solid-js'
import { batch, createMemo, createResource, createSignal, ErrorBoundary, For, Show } from 'solid-js'
import { render } from 'solid-js/web'
import { fetchGenres } from '../../../api/genres'
import { fetchVersions } from '../../../api/songs'
import logoSingle from '../../../assets/logo_single.svg'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { AppIconButton } from '../../../components/common/AppButton'
import { AppSelect } from '../../../components/common/AppSelect'
import { SegmentedToggleGroup } from '../../../components/common/AppTabs'
import { CheckboxField } from '../../../components/common/CheckboxField'
import { HeatmapCountCell } from '../../../components/common/HeatmapCountCell'
import type { PlayerStatsHeatmapAxis } from '../../../constants/playerStats'
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
  type UniFillMatrixCellPosition,
  type UniFillMatrixDimension,
  type UniFillMatrixGridCell,
  type UniFillMatrixHeader,
} from '../../../utils/uniFillMatrix'
import { buildUserProfilePagePath } from '../../../utils/userProfileRoute'
import { scrollToUserProfileContent } from '../../../utils/userProfileScroll'
import {
  formatUniFillMatrixCaption,
  getUniFillMatrixDimensionName,
  UNI_FILL_MATRIX_ACHIEVEMENT_OPTIONS,
  UNI_FILL_MATRIX_COPY,
  UNI_FILL_MATRIX_DATA_COLUMN_MIN_SPACING,
  UNI_FILL_MATRIX_DEFAULT_ACHIEVEMENT,
  UNI_FILL_MATRIX_DEFAULT_DIFFICULTY,
  UNI_FILL_MATRIX_DEFAULT_HORIZONTAL,
  UNI_FILL_MATRIX_DEFAULT_VERTICAL,
  UNI_FILL_MATRIX_DIFFICULTY_OPTIONS,
  UNI_FILL_MATRIX_DIMENSION_OPTIONS,
  UNI_FILL_MATRIX_IMAGE_PADDING,
  UNI_FILL_MATRIX_IMAGE_PIXEL_RATIO,
  UNI_FILL_MATRIX_LEVEL_CONST_AXIS_OPTIONS,
  UNI_FILL_MATRIX_LINE_HEADER_WEIGHT,
  UNI_FILL_MATRIX_RECORD_SORT_QUERY,
  type UniFillMatrixAchievementOption,
  type UniFillMatrixDifficultyOption,
  type UniFillMatrixDimensionOption,
} from './constants'
import { UniFillMatrixImagePreviewDialog } from './UniFillMatrixImagePreviewDialog'

/** ページ内セクションに共通適用するカードクラス */
const PAGE_SECTION_CLASS = 'rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5'

/** 左端の見出しの左右余白・改行禁止・中央揃えの共通クラス */
const LINE_HEADER_CELL_CLASS = 'whitespace-nowrap px-2 py-2 text-center'

/**
 * 横スクロールで固定する左端セルのクラス。
 * border-collapse の罫線は固定セルに追従せずスクロールで消えるため、右罫線は疑似要素で描く。
 */
const STICKY_LINE_HEADER_CELL_CLASS =
  'sticky left-0 z-10 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border'

/** 固定した左端列の右罫線と2本重ならないよう、隣の列の左罫線を消す表のクラス */
const STICKY_LINE_HEADER_TABLE_CLASS = '[&_tr>:nth-child(2)]:border-l-0'

/** 合計行・合計列の文字を強調するクラス */
const TOTAL_CELL_CLASS = 'font-semibold'

/** 見出しの種類ごとのフォント。レベル・譜面定数は数値、ジャンルなどは自由なテキスト */
const HEADER_FONT_CLASS: Record<UniFillMatrixHeader['kind'], string> = {
  axis: 'font-jost',
  group: 'font-sans',
}

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
 * @param position - 対象マスのジャンル・バージョン・楽曲名順・レベル・譜面定数。
 * @returns マスの条件と操作内容をつなげた文言。
 */
const toCellActionLabel = (position: UniFillMatrixCellPosition): string =>
  [
    position.genre,
    position.version,
    position.nameFolder?.label,
    position.levelConst?.label,
    UNI_FILL_MATRIX_COPY.cellActionLabel,
  ]
    .filter((part) => part !== undefined)
    .join(' ')

/**
 * 軸の属性に対応する選択肢を取得する。
 *
 * @param dimension - 縦軸または横軸の属性。
 * @returns AppSelect に渡す選択肢。
 */
const toDimensionOption = (
  dimension: UniFillMatrixDimension
): UniFillMatrixDimensionOption | undefined =>
  UNI_FILL_MATRIX_DIMENSION_OPTIONS.find((option) => option.value === dimension)

/**
 * 表示用の表を、左端の見出しを固定した横スクロール可能なヒートマップ表として表示する。
 *
 * @param props.matrix - 縦軸・横軸の属性で集計した表示用の表。
 * @param props.caption - 表の読み上げ用説明。
 * @param props.cornerHeader - 左端の見出し列の名前。スクリーンリーダー向けにのみ提供する。
 * @param props.showPercent - 上段を達成率で表示するか。
 * @param props.onSelectCell - 未達成の譜面が残るマスをクリックしたときの処理。
 * @param props.imageMode - 画像用に固定見出しと操作を無効にするか。
 * @param props.tableRef - 表の論理幅を取得するための参照設定。
 * @returns 左端の見出し列を固定した横スクロール可能なデータ表。
 */
const UniFillMatrixTable = (props: {
  matrix: UniFillMatrix
  caption: string
  cornerHeader: string
  showPercent: boolean
  onSelectCell?: (position: UniFillMatrixCellPosition) => void
  imageMode?: boolean
  tableRef?: (element: HTMLTableElement) => void
}): JSX.Element => {
  /**
   * 未達成の譜面が残るマスだけにクリック時の処理を割り当てる。
   *
   * @param gridCell - 対象のマスと絞り込み位置。
   * @returns HeatmapCountCell に渡すクリック時の処理。対象外のマスでは undefined。
   */
  const selectHandler = (gridCell: UniFillMatrixGridCell): (() => void) | undefined => {
    return !props.imageMode && props.onSelectCell && hasUnachievedCharts(gridCell.cell)
      ? () => props.onSelectCell?.(gridCell.position)
      : undefined
  }

  /**
   * 左端の見出し列の幅比率を取得する。
   *
   * @returns データ・合計列の幅を1とした左端列の幅。
   */
  const lineHeaderWeight = () => UNI_FILL_MATRIX_LINE_HEADER_WEIGHT[props.matrix.lineHeaderKind]

  /**
   * データ列と合計列に左端列の幅比率を加え、表全体の幅単位を取得する。
   *
   * @returns データ・合計列の幅を1とした表全体の幅単位。
   */
  const columnWeight = () => props.matrix.columnHeaders.length + 1 + lineHeaderWeight()

  /**
   * 画像では通常配置に、画面では横スクロールに追従する左端セルのクラスを取得する。
   *
   * @returns 中央揃えと、画像では通常の右罫線、画面表示時は左端固定と追従する右罫線を適用するクラス。
   */
  const lineHeaderCellClass = () =>
    `${LINE_HEADER_CELL_CLASS} ${props.imageMode ? 'border-r border-border' : STICKY_LINE_HEADER_CELL_CLASS}`

  /**
   * 表示用のマスを共通ヒートマップセルとして表示する。
   *
   * @param gridCell - 対象のマスと絞り込み位置。
   * @param isTotal - 合計行・合計列のマスか。
   * @returns 件数・達成率と、絞り込み可能な場合は操作を持つセル。
   */
  const renderCell = (gridCell: UniFillMatrixGridCell, isTotal = false) => (
    <HeatmapCountCell
      count={gridCell.cell.count}
      total={gridCell.cell.total}
      showPercent={props.showPercent}
      showCompleteMark
      showEmptyAsComplete
      class={isTotal ? TOTAL_CELL_CLASS : undefined}
      onSelect={selectHandler(gridCell)}
      selectLabel={toCellActionLabel(gridCell.position)}
    />
  )

  return (
    <div class="overflow-x-auto rounded-lg border border-border">
      <table
        ref={props.tableRef}
        class={`w-full table-fixed border-collapse ${props.imageMode ? '' : STICKY_LINE_HEADER_TABLE_CLASS}`}
        style={{
          'min-width': `calc(var(--spacing) * ${UNI_FILL_MATRIX_DATA_COLUMN_MIN_SPACING} * ${columnWeight()})`,
        }}
      >
        <caption class="sr-only">{props.caption}</caption>
        <colgroup>
          <col style={{ width: `${(lineHeaderWeight() / columnWeight()) * 100}%` }} />
          <For each={props.matrix.columnHeaders}>{() => <col />}</For>
          <col />
        </colgroup>
        <thead class="text-xs text-text-muted">
          <tr>
            <th scope="col" class={`${lineHeaderCellClass()} bg-surface-muted font-semibold`}>
              <span class="sr-only">{props.cornerHeader}</span>
            </th>
            <For each={props.matrix.columnHeaders}>
              {(header) => (
                <th
                  scope="col"
                  class={`whitespace-nowrap border-l border-border bg-surface-muted px-2 py-2 text-center font-semibold ${HEADER_FONT_CLASS[header.kind]}`}
                >
                  {header.label}
                </th>
              )}
            </For>
            <th
              scope="col"
              class="whitespace-nowrap border-l border-border bg-surface-muted px-3 py-2 text-center font-semibold"
            >
              {UNI_FILL_MATRIX_COPY.totalHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={props.matrix.lines}>
            {(line) => (
              <tr class="border-t border-border">
                <th
                  scope="row"
                  class={`${lineHeaderCellClass()} bg-surface text-sm font-semibold text-text ${HEADER_FONT_CLASS[line.header.kind]}`}
                >
                  {line.header.label}
                </th>
                <For each={line.cells}>{(gridCell) => renderCell(gridCell)}</For>
                {renderCell(line.total, true)}
              </tr>
            )}
          </For>
        </tbody>
        <tfoot>
          <tr class="border-t border-border">
            <th
              scope="row"
              class={`${lineHeaderCellClass()} bg-surface-muted text-sm font-semibold text-text`}
            >
              {UNI_FILL_MATRIX_COPY.totalHeader}
            </th>
            <For each={props.matrix.totals}>{(gridCell) => renderCell(gridCell, true)}</For>
            {renderCell(props.matrix.grandTotal, true)}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/**
 * レベル・譜面定数、ジャンル、追加バージョン、名前順フォルダから選んだ縦軸×横軸ごとに達成状況を表示する。
 *
 * @returns 難易度・埋め条件・両軸を切り替えられ、マスから未達成譜面へ遷移できる画面。
 */
const UniFillMatrixPage: Component = () => {
  const [difficulty, setDifficulty] = createSignal<UniFillMatrixDifficultyOption>(
    UNI_FILL_MATRIX_DEFAULT_DIFFICULTY
  )
  const [achievement, setAchievement] = createSignal<UniFillMatrixAchievementOption>(
    UNI_FILL_MATRIX_DEFAULT_ACHIEVEMENT
  )
  const [vertical, setVertical] = createSignal<UniFillMatrixDimension>(
    UNI_FILL_MATRIX_DEFAULT_VERTICAL
  )
  const [horizontal, setHorizontal] = createSignal<UniFillMatrixDimension>(
    UNI_FILL_MATRIX_DEFAULT_HORIZONTAL
  )
  const [levelConstAxis, setLevelConstAxis] = createSignal<PlayerStatsHeatmapAxis>('level')
  /**
   * 選択中の両軸に対応する読み上げ用説明を返す。
   *
   * @returns 表の縦軸と横軸を表す説明。
   */
  const matrixCaption = () => formatUniFillMatrixCaption(vertical(), horizontal(), levelConstAxis())
  /**
   * 左端の見出し列の名前を返す。
   *
   * @returns 縦軸の属性の名前。
   */
  const cornerHeader = () => getUniFillMatrixDimensionName(vertical(), levelConstAxis())
  /**
   * レベル・定数をどちらかの軸に選んでいるか判定する。
   *
   * @returns レベル別・定数別の切り替えを表示する場合はtrue。
   */
  const hasLevelConstAxis = () => vertical() === 'levelConst' || horizontal() === 'levelConst'
  /**
   * レベル別・定数別の切り替えが担う軸の名前を返す。
   *
   * @returns レベル・定数が縦軸なら縦軸、それ以外は横軸。
   */
  const levelConstAxisLabel = () =>
    vertical() === 'levelConst'
      ? UNI_FILL_MATRIX_COPY.axisLabel
      : UNI_FILL_MATRIX_COPY.horizontalAxisLabel
  /**
   * 一方の軸の属性を変更する。もう一方の軸と同じ属性を選んだ場合は、もう一方へ変更前の属性を移す。
   *
   * @param next - 新しく選んだ属性。
   * @param current - 変更する軸の現在の属性。
   * @param setCurrent - 変更する軸の更新関数。
   * @param other - もう一方の軸の現在の属性。
   * @param setOther - もう一方の軸の更新関数。
   */
  const selectDimension = (
    next: UniFillMatrixDimension,
    current: Accessor<UniFillMatrixDimension>,
    setCurrent: Setter<UniFillMatrixDimension>,
    other: Accessor<UniFillMatrixDimension>,
    setOther: Setter<UniFillMatrixDimension>
  ): void =>
    batch(() => {
      if (next === other()) setOther(current())
      setCurrent(next)
    })
  /**
   * 縦軸と横軸の属性を入れ替える。
   */
  const swapDimensions = (): void =>
    batch(() => {
      const currentVertical = vertical()
      setVertical(horizontal())
      setHorizontal(currentVertical)
    })
  const [showPercent, setShowPercent] = createSignal(false)
  const [pageData] = createResource(fetchOwnPlayerStatsData)
  const [genres] = createResource(fetchGenres)
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
    return buildUniFillMatrix(records, data.attributesBySongId, achievement().value, {
      vertical: vertical(),
      horizontal: horizontal(),
      levelConstAxis: levelConstAxis(),
      genres: data.genres,
      versions: data.versions,
      nameFolders: data.nameFolders,
      labels: data.shortNames,
    })
  })

  /**
   * マスの条件で埋め条件を満たしていない譜面を通常レコードへ引き継いで遷移する。
   *
   * @param target - レコード画面で絞り込むマスの位置。
   * @returns 保存と遷移処理の完了時に解決されるPromise。
   */
  const handleSelectCell = async (target: UniFillMatrixCellPosition): Promise<void> => {
    const username = authSession.status === 'authenticated' ? authSession.user?.username : undefined
    const genreItems = genres()
    const versionItems = versions()?.versions
    if (!username || !genreItems || !versionItems) return

    setRecordNavigationError('')
    try {
      const filter = buildUniFillMatrixRecordFilter(buildDefaultFilter(genreItems, versionItems), {
        ...target,
        difficulty: difficulty().value,
        achievement: achievement().value,
      })
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
    const currentCornerHeader = cornerHeader()
    const caption = matrixCaption()

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
              cornerHeader={currentCornerHeader}
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
   * @returns 難易度・埋め条件・縦軸・横軸・日時を含むPNGファイル名。
   */
  const createMatrixImageFilename = (): string =>
    formatUniFillMatrixImageFilename({
      difficulty: difficulty().value,
      achievement: achievement().value,
      levelConstAxis: levelConstAxis(),
      vertical: vertical(),
      horizontal: horizontal(),
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
                  <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-end">
                    <AppSelect<UniFillMatrixDimensionOption>
                      options={UNI_FILL_MATRIX_DIMENSION_OPTIONS}
                      optionValue="value"
                      optionTextValue="label"
                      value={toDimensionOption(vertical())}
                      onChange={(option) =>
                        option &&
                        selectDimension(
                          option.value,
                          vertical,
                          setVertical,
                          horizontal,
                          setHorizontal
                        )
                      }
                      label={UNI_FILL_MATRIX_COPY.axisLabel}
                      formatLabel={(option) => option.label}
                      rootClass="col-start-1 row-start-1 min-w-0 sm:flex-1 md:w-36 md:flex-none"
                    />
                    {/* 縦積み時はラベル分（text-sm の行高 + mb-1）を上に空け、2つのプルダウン枠の中間に揃える */}
                    <div class="col-start-2 row-span-2 row-start-1 flex items-center pt-6 sm:items-end sm:pt-0">
                      <AppIconButton
                        size="md"
                        aria-label={UNI_FILL_MATRIX_COPY.swapAxesLabel}
                        title={UNI_FILL_MATRIX_COPY.swapAxesLabel}
                        onClick={swapDimensions}
                        class="shrink-0"
                      >
                        <ArrowUpDown size={20} aria-hidden="true" class="sm:hidden" />
                        <ArrowLeftRight size={20} aria-hidden="true" class="hidden sm:block" />
                      </AppIconButton>
                    </div>
                    <AppSelect<UniFillMatrixDimensionOption>
                      options={UNI_FILL_MATRIX_DIMENSION_OPTIONS}
                      optionValue="value"
                      optionTextValue="label"
                      value={toDimensionOption(horizontal())}
                      onChange={(option) =>
                        option &&
                        selectDimension(
                          option.value,
                          horizontal,
                          setHorizontal,
                          vertical,
                          setVertical
                        )
                      }
                      label={UNI_FILL_MATRIX_COPY.horizontalAxisLabel}
                      formatLabel={(option) => option.label}
                      rootClass="col-start-1 row-start-2 min-w-0 sm:flex-1 md:w-36 md:flex-none"
                    />
                  </div>
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center md:ml-auto">
                    <CheckboxField
                      checked={showPercent()}
                      onChange={setShowPercent}
                      label={UNI_FILL_MATRIX_COPY.percentToggle}
                      class="min-h-8"
                    />
                    <Show when={hasLevelConstAxis()}>
                      <SegmentedToggleGroup
                        value={levelConstAxis()}
                        onChange={setLevelConstAxis}
                        options={UNI_FILL_MATRIX_LEVEL_CONST_AXIS_OPTIONS}
                        ariaLabel={levelConstAxisLabel()}
                        class="w-full sm:w-auto"
                        itemClass="flex-1 sm:flex-none"
                      />
                    </Show>
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
                      caption={matrixCaption()}
                      cornerHeader={cornerHeader()}
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
