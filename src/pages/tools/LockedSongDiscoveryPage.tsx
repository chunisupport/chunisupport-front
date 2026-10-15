import { TextField } from '@kobalte/core/text-field'
import { useNavigate } from '@solidjs/router'
import {
  ArrowDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Eraser,
  ListMusic,
  ScanSearch,
  SearchX,
  Ticket,
  TriangleAlert,
} from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  on,
  onMount,
  Show,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { fetchGenres } from '../../api/genres'
import { fetchNameFolders } from '../../api/nameFolders'
import { fetchVersions } from '../../api/songs'
import { LoadError, Loading, PlayerDataEmptyState } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { SegmentedToggleGroup } from '../../components/common/AppTabs'
import { LOCKED_SONG_DISCOVERY_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useAppMainScrollRestoration } from '../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { saveStandardRecordFilterSetting } from '../../repositories/viewSettingsRepository'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import { publishStandardRecordFilter } from '../../stores/standardRecordNavigation'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import {
  buildOverPowerChartEntries,
  selectOverPowerChartEntries,
} from '../../usecases/overpower/aggregation'
import {
  buildLevelSummaries,
  buildNameFolderSummaries,
  buildOverPowerSummary,
} from '../../usecases/overpower/overpowerSummary'
import type { OverPowerSummaryRow } from '../../usecases/overpower/types'
import { isNotFoundApiError } from '../../utils/apiError'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  buildLockedSongCandidateRecordFilter,
  buildLockedSongDiscoveryCandidates,
  buildLockedSongDiscoveryCells,
  compareLockedSongObservation,
  hasCompleteLockedSongDiscoveryRecords,
  type LockedSongComparison,
  type LockedSongComparisonStatus,
  type LockedSongDiscoveryMismatches,
  type LockedSongObservation,
} from '../../utils/lockedSongDiscovery'
import { formatTruncatedFixed } from '../../utils/numberFormat'
import { buildDefaultFilter } from '../../utils/recordFilterDefaults'
import { buildUserProfilePagePath } from '../../utils/userProfileRoute'
import { scrollToUserProfileContent } from '../../utils/userProfileScroll'
import { LockedSongCandidatesDialog } from './LockedSongCandidatesDialog'
import {
  LOCKED_SONG_CANDIDATES_COPY,
  LOCKED_SONG_DISCOVERY_AXIS_OPTIONS,
  LOCKED_SONG_DISCOVERY_COPY,
  type LockedSongDiscoveryAxis,
} from './lockedSongDiscovery.constants'
import {
  clearLockedSongObservations,
  readLockedSongObservations,
  saveLockedSongObservations,
} from './lockedSongDiscoveryStorage'

/** 照合行の列構成。見出し行と入力行で共有し、列位置を揃える。OP%列は最大値100.00が収まる幅にする。 */
const ROW_GRID_CLASS =
  'grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_8rem_5rem] sm:gap-x-3'

/** 入力欄・見出しなどのID接頭辞。 */
const ID_PREFIX = 'locked-song-discovery'

/** 候補範囲パネルの見出しID。 */
const RESULT_TITLE_ID = `${ID_PREFIX}-result-title`

/** 筐体観測値入力に共通するスタイル。モバイルではタッチしやすい高さにする。 */
const INPUT_CLASS =
  'h-11 w-full sm:h-10 rounded-md border border-input-border bg-input-bg px-2 text-right font-jost text-base tabular-nums text-text placeholder:text-text-subtle hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring data-[invalid]:border-danger'

/**
 * アイコンと横並びにする日本語テキストのクラス。
 * Noto Sans JPは行ボックス内で文字が下寄りになるため、表意文字の外枠で上下を詰めてアイコンと中央を揃える。
 */
const ICON_ALIGNED_TEXT_CLASS = '[text-box:trim-both_ideographic]'

/** 照合状態ごとの行スタイル、アイコン、読み上げ文言。 */
const STATUS_VIEW: Record<
  LockedSongComparisonStatus,
  { rowClass: string; iconClass: string; icon: Component<{ class?: string }>; label: string }
> = {
  empty: {
    rowClass: 'border-l-transparent',
    iconClass: 'text-text-subtle',
    icon: CircleDashed,
    label: LOCKED_SONG_DISCOVERY_COPY.empty,
  },
  match: {
    rowClass: 'border-l-success bg-success-bg',
    iconClass: 'text-success',
    icon: CircleCheck,
    label: LOCKED_SONG_DISCOVERY_COPY.matched,
  },
  mismatch: {
    rowClass: 'border-l-warning bg-warning-bg',
    iconClass: 'text-warning',
    icon: TriangleAlert,
    label: LOCKED_SONG_DISCOVERY_COPY.mismatched,
  },
  invalid: {
    rowClass: 'border-l-danger bg-danger-bg',
    iconClass: 'text-danger',
    icon: CircleAlert,
    label: LOCKED_SONG_DISCOVERY_COPY.invalid,
  },
}

/** 未入力の分類に適用する観測値。 */
const EMPTY_OBSERVATION: LockedSongObservation = { overPower: '', percent: '' }

/** 筐体観測値1項目分の入力欄に必要な値と更新処理。 */
type ObservationFieldProps = {
  /** 入力欄のID。エラー文のIDにも使う。 */
  id: string
  /** スクリーンリーダー向けのラベル。 */
  label: string
  /** 現在の入力値。 */
  value: string
  /** 未入力時に表示する計算値。 */
  placeholder: string
  /** 入力エラー文。エラーがなければ空文字。 */
  error: string
  /** 入力変更時の通知先。 */
  onChange: (value: string) => void
}

/**
 * 筐体に表示されたOPまたはOP%を入力する欄を表示する。
 * 見出しは列ヘッダーで視覚的に示すため、ラベルはスクリーンリーダー専用にする。
 *
 * @param props - 入力欄ID、ラベル、現在値、未入力時の計算値、エラー文、入力更新処理。
 * @returns 小数入力用のテキストフィールド。
 */
const ObservationField: Component<ObservationFieldProps> = (props) => (
  <TextField
    value={props.value}
    onChange={props.onChange}
    validationState={props.error ? 'invalid' : 'valid'}
  >
    <TextField.Label for={props.id} class="sr-only">
      {props.label}
    </TextField.Label>
    <TextField.Input
      id={props.id}
      name={props.id}
      type="text"
      inputMode="decimal"
      autocomplete="off"
      pattern="[0-9]*[.]?[0-9]{0,2}"
      placeholder={props.placeholder}
      class={INPUT_CLASS}
      aria-describedby={props.error ? `${props.id}-error` : undefined}
    />
  </TextField>
)

/** 1分類分の照合行に必要な値と更新処理。 */
type ComparisonRowProps = {
  /** 行内の入力欄IDに付ける接頭辞。 */
  idPrefix: string
  /** ChuniSupportの分類別集計行。 */
  row: OverPowerSummaryRow
  /** 筐体の観測値。 */
  observation: LockedSongObservation
  /** 観測値と計算値の照合結果。 */
  comparison: LockedSongComparison
  /** 観測値の更新通知先。 */
  onChange: (field: keyof LockedSongObservation, value: string) => void
}

/**
 * 1分類分の筐体入力と照合状態を1行で表示する。計算値は入力欄のプレースホルダーで示す。
 *
 * @param props - 入力欄IDの接頭辞、集計行、観測値、照合結果、入力更新処理。
 * @returns ジャンル、バージョン、楽曲名順、レベルいずれか1行分の照合フォーム。
 */
const ComparisonRow: Component<ComparisonRowProps> = (props) => {
  const inputId = (field: keyof LockedSongObservation): string => `${props.idPrefix}-${field}`
  const status = () => STATUS_VIEW[props.comparison.status]

  return (
    <li class={`border-l-4 px-3 py-2 transition-colors ${status().rowClass}`}>
      <div class={ROW_GRID_CLASS}>
        <div class="flex min-w-0 items-center gap-2">
          <span class="shrink-0">
            <Dynamic
              component={status().icon}
              class={`h-4 w-4 ${status().iconClass}`}
              aria-hidden="true"
            />
            <span class="sr-only">{status().label}</span>
          </span>
          <p class="min-w-0 truncate font-sans text-sm font-semibold text-text">
            {props.row.label}
          </p>
        </div>
        <ObservationField
          id={inputId('overPower')}
          label={`${props.row.label} ${LOCKED_SONG_DISCOVERY_COPY.observedOverPower}`}
          value={props.observation.overPower}
          placeholder={formatTruncatedFixed(props.row.current, 2)}
          error={props.comparison.overPowerError}
          onChange={(value) => props.onChange('overPower', value)}
        />
        <ObservationField
          id={inputId('percent')}
          label={`${props.row.label} ${LOCKED_SONG_DISCOVERY_COPY.observedPercent}`}
          value={props.observation.percent}
          placeholder={formatTruncatedFixed(props.row.percent, 2)}
          error={props.comparison.percentError}
          onChange={(value) => props.onChange('percent', value)}
        />
      </div>
      <Show when={props.comparison.overPowerError}>
        <p id={`${inputId('overPower')}-error`} class="mt-1 font-sans text-xs text-danger">
          {props.comparison.overPowerError}
        </p>
      </Show>
      <Show when={props.comparison.percentError}>
        <p id={`${inputId('percent')}-error`} class="mt-1 font-sans text-xs text-danger">
          {props.comparison.percentError}
        </p>
      </Show>
    </li>
  )
}

/** 候補範囲がない状態の表示に必要な値。 */
type CandidateEmptyStateProps = {
  /** 状態を表すアイコン。 */
  icon: JSX.Element
  /** 状態を表す短い文言。 */
  message: string
}

/**
 * 候補範囲がない状態をアイコンと短い文言で表示する。
 *
 * @param props - 表示アイコンと文言。
 * @returns 候補なし状態のプレースホルダー。
 */
const CandidateEmptyState: Component<CandidateEmptyStateProps> = (props) => (
  <div class="flex flex-col items-center gap-2 px-4 py-10 text-center text-text-subtle">
    {props.icon}
    <p class="font-sans text-sm">{props.message}</p>
  </div>
)

/**
 * ログインユーザーの分類別OPを筐体表示と照合し、未解禁曲の範囲を絞り込む。
 *
 * @returns 未解禁曲ディスカバーツール画面。
 */
const LockedSongDiscoveryPage: Component = () => {
  const navigate = useNavigate()
  const username = (): string | undefined =>
    authSession.status === 'authenticated' ? authSession.user?.username : undefined
  const { songsResponse, ensureSongsLoaded } = useSongsData()
  const [record] = createResource(username, fetchUserRecordWithCache)
  const [genres] = createResource(fetchGenres)
  const [versions] = createResource(fetchVersions)
  const [nameFolders] = createResource(fetchNameFolders)
  const [selectedAxis, setSelectedAxis] = createSignal<LockedSongDiscoveryAxis>('genre')
  const [observations, setObservations] = createSignal<Record<string, LockedSongObservation>>({})
  const [recordNavigationError, setRecordNavigationError] = createSignal('')
  const [candidateDialogOpen, setCandidateDialogOpen] = createSignal(false)
  /** モバイルの移動ボタンからスクロールさせる候補範囲パネル。 */
  let resultPanel: HTMLElement | undefined

  createEffect(
    on(username, (currentUsername) => {
      setObservations(readLockedSongObservations(currentUsername))
    })
  )

  onMount(ensureSongsLoaded)
  const tool = getToolLink(LOCKED_SONG_DISCOVERY_PATH)
  useDocumentTitle(tool.title)
  useAppMainScrollRestoration(
    () =>
      !record.loading &&
      !songsResponse.loading &&
      !genres.loading &&
      !versions.loading &&
      !nameFolders.loading
  )

  const loadError = createMemo(
    () => record.error ?? songsResponse.error ?? genres.error ?? versions.error ?? nameFolders.error
  )
  const loading = createMemo(
    () =>
      record.loading ||
      songsResponse.loading ||
      genres.loading ||
      versions.loading ||
      nameFolders.loading
  )
  const recordsComplete = createMemo(() =>
    hasCompleteLockedSongDiscoveryRecords(songsResponse()?.songs ?? [], record()?.standard ?? [])
  )
  /** 未プレイを含む全通常譜面のOP集計エントリ。 */
  const chartEntries = createMemo(() => {
    const songs = songsResponse()?.songs
    const currentRecord = record()?.standard
    const versionItems = versions()?.versions
    if (!songs || !currentRecord || !versionItems) return []
    return buildOverPowerChartEntries(songs, currentRecord, versionItems)
  })
  /** 筐体表示と照合する、曲ごとの現在のOP対象譜面エントリ。 */
  const opTargetEntries = createMemo(() => selectOverPowerChartEntries(chartEntries(), 'OP_TARGET'))
  const summary = createMemo(() => {
    const songs = songsResponse()?.songs
    const currentRecord = record()?.standard
    const versionItems = versions()?.versions
    const genreItems = genres()
    const nameFolderItems = nameFolders()
    if (!songs || !currentRecord || !versionItems || !genreItems || !nameFolderItems) {
      return undefined
    }
    return {
      ...buildOverPowerSummary(songs, currentRecord, versionItems, [], genreItems),
      nameFolders: buildNameFolderSummaries(opTargetEntries(), nameFolderItems),
      levels: buildLevelSummaries(chartEntries()),
    }
  })
  /**
   * 分類軸・分類IDから観測値の保存キーを作る。
   *
   * @param axis - 照合対象の分類軸。
   * @param rowId - 分類ID。
   * @returns 観測値を保持するためのキー。
   */
  const observationKey = (axis: LockedSongDiscoveryAxis, rowId: string): string =>
    `${axis}:${rowId}`

  /**
   * 指定分類の筐体観測値を更新する。
   *
   * @param key - 分類軸と分類IDを組み合わせたキー。
   * @param field - 更新するOPまたはOP%。
   * @param value - 入力された表示値。
   * @returns なし。
   */
  const handleObservationChange = (
    key: string,
    field: keyof LockedSongObservation,
    value: string
  ): void => {
    const next = setObservations((current) => ({
      ...current,
      [key]: { ...(current[key] ?? EMPTY_OBSERVATION), [field]: value },
    }))
    saveLockedSongObservations(username(), next)
  }

  /**
   * 表示中の分類の入力値を消去し、保存済みの値へ反映する。
   *
   * @returns なし。
   */
  const handleClearObservations = (): void => {
    const next = setObservations((current) => clearLockedSongObservations(current, selectedAxis()))
    saveLockedSongObservations(username(), next)
  }

  /**
   * 指定分類軸で筐体値と差がある集計行を返す。
   *
   * @param axis - 照合対象の分類軸。
   * @param rows - ChuniSupportの分類別集計行。
   * @returns 筐体表示と差がある集計行。
   */
  const findMismatchedRows = <TRow extends OverPowerSummaryRow>(
    axis: LockedSongDiscoveryAxis,
    rows: TRow[]
  ): TRow[] =>
    rows.filter(
      (row) =>
        compareLockedSongObservation(
          row,
          observations()[observationKey(axis, row.id)] ?? EMPTY_OBSERVATION
        ).status === 'mismatch'
    )

  /** 筐体表示と差がある分類。 */
  const currentMismatches = createMemo((): LockedSongDiscoveryMismatches => {
    const currentSummary = summary()
    if (!currentSummary) return { genres: [], versions: [], nameFolders: [], levels: [] }
    return {
      genres: findMismatchedRows('genre', currentSummary.genres).map((row) => row.id),
      versions: findMismatchedRows('version', currentSummary.versions).map((row) => row.id),
      nameFolders: findMismatchedRows('nameFolder', currentSummary.nameFolders).map(
        (row) => row.id
      ),
      levels: findMismatchedRows('level', currentSummary.levels).map((row) => row.level),
    }
  })
  /**
   * 分類軸ごとに差異がある分類IDを返す。
   *
   * @param axis - 対象の分類軸。
   * @returns 筐体表示と差がある分類ID。
   */
  const mismatchesByAxis = (axis: LockedSongDiscoveryAxis): readonly string[] => {
    const mismatches = currentMismatches()
    if (axis === 'genre') return mismatches.genres
    if (axis === 'version') return mismatches.versions
    if (axis === 'nameFolder') return mismatches.nameFolders
    return mismatches.levels
  }
  /** 差異が1件以上あるか。 */
  const hasCurrentMismatch = createMemo(() =>
    LOCKED_SONG_DISCOVERY_AXIS_OPTIONS.some((option) => mismatchesByAxis(option.value).length > 0)
  )
  /** 選択中の分類軸で入力欄に並べる集計行。 */
  const currentRows = createMemo(() => {
    const currentSummary = summary()
    if (!currentSummary) return []
    const axis = selectedAxis()
    if (axis === 'genre') return currentSummary.genres
    if (axis === 'version') return currentSummary.versions
    if (axis === 'nameFolder') return currentSummary.nameFolders
    return currentSummary.levels
  })
  const candidateCells = createMemo(() =>
    buildLockedSongDiscoveryCells(chartEntries(), currentMismatches())
  )
  const dialogCandidates = createMemo(() =>
    buildLockedSongDiscoveryCandidates(chartEntries(), candidateCells())
  )
  /** 候補範囲に含まれる重複を除いた楽曲数。 */
  const candidateSongCount = createMemo(
    () => new Set(candidateCells().flatMap((cell) => cell.songs.map((song) => song.id))).size
  )
  /** 差異がある分類軸に通知ドットを付けた選択肢。 */
  const axisOptions = createMemo(() =>
    LOCKED_SONG_DISCOVERY_AXIS_OPTIONS.map((option) => ({
      ...option,
      hasNotificationDot: mismatchesByAxis(option.value).length > 0,
    }))
  )

  /**
   * すべての候補範囲を1つのフィルターにまとめて通常レコードへ遷移する。
   *
   * @returns 保存と遷移処理の完了時に解決されるPromise。
   */
  const handleOpenRecords = async (): Promise<void> => {
    const currentUsername = username()
    const genreItems = genres()
    const versionItems = versions()?.versions
    if (!currentUsername || !genreItems || !versionItems) return

    setRecordNavigationError('')
    try {
      const filter = buildLockedSongCandidateRecordFilter(
        buildDefaultFilter(genreItems, versionItems),
        currentMismatches()
      )
      await saveStandardRecordFilterSetting(filter)
      publishStandardRecordFilter(currentUsername, filter)
      navigate(
        `${buildUserProfilePagePath(currentUsername, 'record_normal')}?sortcol=title&sortorder=asc`
      )
      scrollToUserProfileContent()
    } catch (error) {
      setRecordNavigationError(
        toUserFriendlyErrorMessage(error, LOCKED_SONG_DISCOVERY_COPY.recordNavigationError)
      )
    }
  }

  return (
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <ScanSearch class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{tool.title}</h1>
          <p class="mt-1 font-sans text-sm text-text-muted">{tool.description}</p>
        </div>
      </header>

      <section
        class="flex flex-col gap-1.5 self-start rounded-md border border-warning-border bg-warning-bg px-3 py-2 font-sans text-sm text-warning"
        aria-labelledby="locked-song-discovery-prerequisites"
      >
        <h2 id="locked-song-discovery-prerequisites" class="flex items-center gap-2 font-semibold">
          <TriangleAlert class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span class={ICON_ALIGNED_TEXT_CLASS}>
            {LOCKED_SONG_DISCOVERY_COPY.prerequisitesLabel}
          </span>
        </h2>
        <ul class="flex flex-col gap-1.5 pl-6">
          <li class="flex items-center gap-2">
            <Ticket class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span class={ICON_ALIGNED_TEXT_CLASS}>
              {LOCKED_SONG_DISCOVERY_COPY.prerequisiteTicket}
            </span>
          </li>
          <li class="flex items-center gap-2">
            <ListMusic class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span class={ICON_ALIGNED_TEXT_CLASS}>
              {LOCKED_SONG_DISCOVERY_COPY.prerequisiteMaster}
            </span>
          </li>
        </ul>
      </section>

      <Show
        when={!loadError()}
        fallback={
          <Show when={isNotFoundApiError(loadError())} fallback={<LoadError error={loadError()} />}>
            <PlayerDataEmptyState />
          </Show>
        }
      >
        <Show
          when={!loading() && summary()}
          fallback={
            <div class="h-40">
              <Loading ariaLabel={LOCKED_SONG_DISCOVERY_COPY.dataLoading} />
            </div>
          }
        >
          <Show when={!recordsComplete()}>
            <p
              class="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-bg p-3 font-sans text-sm text-danger"
              role="alert"
            >
              <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {LOCKED_SONG_DISCOVERY_COPY.recordIncomplete}
            </p>
          </Show>

          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <section class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <div class="flex flex-wrap items-center gap-2 border-b border-border p-3">
                <SegmentedToggleGroup
                  options={axisOptions()}
                  value={selectedAxis()}
                  onChange={setSelectedAxis}
                  ariaLabel={LOCKED_SONG_DISCOVERY_COPY.axisSelect}
                  class="w-full flex-wrap sm:w-auto"
                  itemClass="min-h-10 grow basis-[calc(50%-0.125rem)] sm:basis-auto sm:min-w-28"
                />
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="ml-auto min-h-10 font-sans"
                  leftIcon={<Eraser class="h-4 w-4" aria-hidden="true" />}
                  aria-label={LOCKED_SONG_DISCOVERY_COPY.clearInputsAriaLabel}
                  onClick={handleClearObservations}
                >
                  {LOCKED_SONG_DISCOVERY_COPY.clearInputs}
                </AppButton>
              </div>

              <div class="border-b border-border bg-surface-muted px-3 py-2">
                <div
                  class={`${ROW_GRID_CLASS} border-l-4 border-l-transparent font-sans text-xs font-medium text-text-muted`}
                  aria-hidden="true"
                >
                  <span />
                  <span class="text-center">{LOCKED_SONG_DISCOVERY_COPY.observedOverPower}</span>
                  <span class="text-center">{LOCKED_SONG_DISCOVERY_COPY.observedPercent}</span>
                </div>
              </div>

              <ul class="divide-y divide-border">
                <For each={currentRows()}>
                  {(row) => {
                    const key = () => observationKey(selectedAxis(), row.id)
                    const observation = () => observations()[key()] ?? EMPTY_OBSERVATION
                    const comparison = createMemo(() =>
                      compareLockedSongObservation(row, observation())
                    )
                    return (
                      <ComparisonRow
                        idPrefix={`${ID_PREFIX}-${key().replace(/:/g, '-')}`}
                        row={row}
                        observation={observation()}
                        comparison={comparison()}
                        onChange={(field, value) => handleObservationChange(key(), field, value)}
                      />
                    )
                  }}
                </For>
              </ul>
            </section>

            <aside
              ref={resultPanel}
              class="flex scroll-mt-4 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)]"
              aria-labelledby={RESULT_TITLE_ID}
            >
              <div class="shrink-0 border-b border-border px-4 py-3">
                <h2 id={RESULT_TITLE_ID} class="font-sans text-base font-semibold">
                  {LOCKED_SONG_DISCOVERY_COPY.candidateTitle}
                </h2>
              </div>

              <p class="flex items-baseline gap-1.5 px-4 py-3" aria-live="polite">
                <span class="font-jost text-4xl font-semibold leading-none">
                  {candidateSongCount()}
                </span>
                <span class="font-sans text-sm text-text-muted">
                  {LOCKED_SONG_DISCOVERY_COPY.songCountUnit}
                </span>
              </p>

              <div class="flex min-h-0 flex-1 flex-col border-t border-border">
                <Show
                  when={candidateCells().length > 0}
                  fallback={
                    <Show
                      when={hasCurrentMismatch()}
                      fallback={
                        <CandidateEmptyState
                          icon={<ScanSearch class="h-8 w-8" aria-hidden="true" />}
                          message={LOCKED_SONG_DISCOVERY_COPY.candidateEmpty}
                        />
                      }
                    >
                      <CandidateEmptyState
                        icon={<SearchX class="h-8 w-8" aria-hidden="true" />}
                        message={LOCKED_SONG_DISCOVERY_COPY.candidateNotFound}
                      />
                    </Show>
                  }
                >
                  <div class="shrink-0 space-y-2 p-3">
                    <AppButton
                      variant="primary"
                      fullWidth
                      onClick={() => setCandidateDialogOpen(true)}
                    >
                      {LOCKED_SONG_CANDIDATES_COPY.open}
                    </AppButton>
                    <AppButton
                      variant="surface"
                      fullWidth
                      class="justify-between"
                      rightIcon={<ChevronRight class="h-4 w-4" aria-hidden="true" />}
                      onClick={() => void handleOpenRecords()}
                    >
                      {LOCKED_SONG_DISCOVERY_COPY.openRecords}
                    </AppButton>
                  </div>
                </Show>
                <Show when={recordNavigationError()}>
                  <p
                    class="border-t border-danger-border bg-danger-bg px-4 py-2 font-sans text-sm text-danger"
                    role="alert"
                  >
                    {recordNavigationError()}
                  </p>
                </Show>
              </div>
            </aside>
          </div>

          <Show when={hasCurrentMismatch()}>
            <div class="sticky bottom-0 z-10 -mx-4 -mb-4 border-t border-border bg-surface px-4 py-2 shadow-lg lg:hidden">
              <AppButton
                variant="primary"
                fullWidth
                class="justify-between"
                rightIcon={<ArrowDown class="h-4 w-4" aria-hidden="true" />}
                onClick={() => resultPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <span>{LOCKED_SONG_DISCOVERY_COPY.jumpToCandidates}</span>
                <span class="ml-auto font-jost tabular-nums">
                  {candidateSongCount()}
                  {LOCKED_SONG_DISCOVERY_COPY.songCountUnit}
                </span>
              </AppButton>
            </div>
          </Show>
        </Show>
      </Show>
      <Show when={candidateDialogOpen()}>
        <Show when={username()} keyed>
          {(currentUsername) => (
            <LockedSongCandidatesDialog
              username={currentUsername}
              candidates={dialogCandidates()}
              songs={songsResponse()?.songs ?? []}
              records={record()?.standard ?? []}
              recordsComplete={recordsComplete()}
              versions={versions()?.versions ?? []}
              onClose={() => setCandidateDialogOpen(false)}
            />
          )}
        </Show>
      </Show>
    </div>
  )
}

export default LockedSongDiscoveryPage
