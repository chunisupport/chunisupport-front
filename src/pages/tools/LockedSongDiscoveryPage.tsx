import { TextField } from '@kobalte/core/text-field'
import { useNavigate } from '@solidjs/router'
import {
  ArrowDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Info,
  ScanSearch,
  SearchX,
  TriangleAlert,
} from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, createSignal, For, onMount, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { fetchMasterData, fetchVersions } from '../../api/songs'
import { LoadError, Loading, PlayerDataEmptyState } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { SegmentedToggleGroup } from '../../components/common/AppTabs'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { LOCKED_SONG_DISCOVERY_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useAppMainScrollRestoration } from '../../hooks/useAppMainScrollRestoration'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { saveStandardRecordFilterSetting } from '../../repositories/viewSettingsRepository'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import { publishStandardRecordFilter } from '../../stores/standardRecordNavigation'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { buildOverPowerChartEntries } from '../../usecases/overpower/aggregation'
import { buildOverPowerSummary } from '../../usecases/overpower/overpowerSummary'
import type { OverPowerSummaryRow } from '../../usecases/overpower/types'
import { isNotFoundApiError } from '../../utils/apiError'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  buildLockedSongCandidateRecordFilter,
  buildLockedSongDiscoveryCells,
  compareLockedSongObservation,
  hasCompleteLockedSongDiscoveryRecords,
  type LockedSongComparison,
  type LockedSongComparisonStatus,
  type LockedSongDiscoveryCell,
  type LockedSongDiscoveryDifficulty,
  type LockedSongObservation,
} from '../../utils/lockedSongDiscovery'
import { formatTruncatedFixed } from '../../utils/numberFormat'
import { buildDefaultFilter } from '../../utils/recordFilterDefaults'
import { buildUserProfilePagePath } from '../../utils/userProfileRoute'
import { scrollToUserProfileContent } from '../../utils/userProfileScroll'
import {
  LOCKED_SONG_DISCOVERY_AXIS_OPTIONS,
  LOCKED_SONG_DISCOVERY_COPY,
  LOCKED_SONG_DISCOVERY_DIFFICULTY_OPTIONS,
  type LockedSongDiscoveryAxis,
} from './lockedSongDiscovery.constants'

/** 照合行の列構成。見出し行と入力行で共有し、列位置を揃える。 */
const ROW_GRID_CLASS =
  'grid grid-cols-[minmax(0,1fr)_5.5rem_5rem] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_8rem_7rem] sm:gap-x-3'

/** 入力欄・見出しなどのID接頭辞。 */
const ID_PREFIX = 'locked-song-discovery'

/** 候補範囲パネルの見出しID。 */
const RESULT_TITLE_ID = `${ID_PREFIX}-result-title`

/** 筐体観測値入力に共通するスタイル。モバイルではタッチしやすい高さにする。 */
const INPUT_CLASS =
  'h-11 w-full sm:h-10 rounded-md border border-input-border bg-input-bg px-2 text-right font-jost text-base tabular-nums text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring data-[invalid]:border-danger'

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
  /** 入力エラー文。エラーがなければ空文字。 */
  error: string
  /** 入力変更時の通知先。 */
  onChange: (value: string) => void
}

/**
 * 筐体に表示されたOPまたはOP%を入力する欄を表示する。
 * 見出しは列ヘッダーで視覚的に示すため、ラベルはスクリーンリーダー専用にする。
 *
 * @param props - 入力欄ID、ラベル、現在値、エラー文、入力更新処理。
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
 * 1分類分の計算値、筐体入力、照合状態を1行で表示する。
 *
 * @param props - 入力欄IDの接頭辞、集計行、観測値、照合結果、入力更新処理。
 * @returns ジャンルまたはバージョン1行分の照合フォーム。
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
          <div class="min-w-0">
            <p class="truncate font-sans text-sm font-semibold text-text">{props.row.label}</p>
            <p
              class="flex flex-wrap gap-x-2 font-jost text-xs tabular-nums text-text-muted"
              title={LOCKED_SONG_DISCOVERY_COPY.calculated}
            >
              <span class="sr-only">{LOCKED_SONG_DISCOVERY_COPY.calculated}</span>
              <span>{formatTruncatedFixed(props.row.current, 2)}</span>
              <span>{formatTruncatedFixed(props.row.percent, 2)}%</span>
            </p>
          </div>
        </div>
        <ObservationField
          id={inputId('overPower')}
          label={`${props.row.label} ${LOCKED_SONG_DISCOVERY_COPY.observedOverPower}`}
          value={props.observation.overPower}
          error={props.comparison.overPowerError}
          onChange={(value) => props.onChange('overPower', value)}
        />
        <ObservationField
          id={inputId('percent')}
          label={`${props.row.label} ${LOCKED_SONG_DISCOVERY_COPY.observedPercent}`}
          value={props.observation.percent}
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

/** 差異のある分類名を並べるチップ群に必要な値。 */
type MismatchChipsProps = {
  /** チップ群の見出し。 */
  title: string
  /** 差異がある分類名。 */
  items: readonly string[]
}

/**
 * 筐体表示と差がある分類名をチップで表示する。
 *
 * @param props - 見出しと分類名一覧。
 * @returns 差異がある分類のチップ一覧。一覧が空なら何も表示しない。
 */
const MismatchChips: Component<MismatchChipsProps> = (props) => (
  <Show when={props.items.length > 0}>
    <div>
      <h3 class="font-sans text-xs font-medium text-text-muted">{props.title}</h3>
      <ul class="mt-1.5 flex flex-wrap gap-1.5">
        <For each={props.items}>
          {(item) => (
            <li class="rounded-full border border-warning-border bg-warning-bg px-2.5 py-0.5 font-sans text-xs font-medium text-warning">
              {item}
            </li>
          )}
        </For>
      </ul>
    </div>
  </Show>
)

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
  const [masterData] = createResource(fetchMasterData)
  const [versions] = createResource(fetchVersions)
  const [selectedDifficulty, setSelectedDifficulty] =
    createSignal<LockedSongDiscoveryDifficulty>('MASTER')
  const [selectedAxis, setSelectedAxis] = createSignal<LockedSongDiscoveryAxis>('genre')
  const [observations, setObservations] = createSignal<Record<string, LockedSongObservation>>({})
  const [recordNavigationError, setRecordNavigationError] = createSignal('')
  /** モバイルの移動ボタンからスクロールさせる候補範囲パネル。 */
  let resultPanel: HTMLElement | undefined

  onMount(ensureSongsLoaded)
  const tool = getToolLink(LOCKED_SONG_DISCOVERY_PATH)
  useDocumentTitle(tool.title)
  useAppMainScrollRestoration(
    () => !record.loading && !songsResponse.loading && !masterData.loading && !versions.loading
  )

  const loadError = createMemo(
    () => record.error ?? songsResponse.error ?? masterData.error ?? versions.error
  )
  const loading = createMemo(
    () => record.loading || songsResponse.loading || masterData.loading || versions.loading
  )
  const recordsComplete = createMemo(() =>
    hasCompleteLockedSongDiscoveryRecords(songsResponse()?.songs ?? [], record()?.standard ?? [])
  )
  const allChartEntries = createMemo(() => {
    const songs = songsResponse()?.songs
    const currentRecord = record()?.standard
    const versionItems = versions()?.versions
    if (!songs || !currentRecord || !versionItems) return []
    return buildOverPowerChartEntries(songs, currentRecord, versionItems)
  })
  const summary = createMemo(() => {
    const songs = songsResponse()?.songs
    const currentRecord = record()?.standard
    const versionItems = versions()?.versions
    const genres = masterData()?.genres
    if (!songs || !currentRecord || !versionItems || !genres) return undefined
    const masterSummary = buildOverPowerSummary(
      songs,
      currentRecord,
      versionItems,
      [],
      genres,
      'MASTER'
    )
    const ultimaSummary = buildOverPowerSummary(
      songs,
      currentRecord,
      versionItems,
      [],
      genres,
      'ULTIMA'
    )
    return { MASTER: masterSummary, ULTIMA: ultimaSummary }
  })

  /**
   * 難易度・分類軸・分類IDから観測値の保存キーを作る。
   *
   * @param difficulty - 照合対象の難易度。
   * @param axis - 照合対象の分類軸。
   * @param rowId - 分類ID。
   * @returns 観測値を保持するためのキー。
   */
  const observationKey = (
    difficulty: LockedSongDiscoveryDifficulty,
    axis: LockedSongDiscoveryAxis,
    rowId: string
  ): string => `${difficulty}:${axis}:${rowId}`

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
    setObservations((current) => ({
      ...current,
      [key]: { ...(current[key] ?? EMPTY_OBSERVATION), [field]: value },
    }))
  }

  /**
   * 指定難易度・分類軸で筐体値と差がある行IDを返す。
   *
   * @param difficulty - 照合対象の難易度。
   * @param axis - 照合対象の分類軸。
   * @param rows - ChuniSupportの分類別集計行。
   * @returns 筐体表示と差がある分類ID。
   */
  const findMismatchedRowIds = (
    difficulty: LockedSongDiscoveryDifficulty,
    axis: LockedSongDiscoveryAxis,
    rows: OverPowerSummaryRow[]
  ): string[] =>
    rows
      .filter(
        (row) =>
          compareLockedSongObservation(
            row,
            observations()[observationKey(difficulty, axis, row.id)] ?? EMPTY_OBSERVATION
          ).status === 'mismatch'
      )
      .map((row) => row.id)

  const mismatches = createMemo(() => {
    const currentSummary = summary()
    if (!currentSummary) {
      return {
        MASTER: { genres: [], versions: [] },
        ULTIMA: { genres: [], versions: [] },
      }
    }
    return {
      MASTER: {
        genres: findMismatchedRowIds('MASTER', 'genre', currentSummary.MASTER.genres),
        versions: findMismatchedRowIds('MASTER', 'version', currentSummary.MASTER.versions),
      },
      ULTIMA: {
        genres: findMismatchedRowIds('ULTIMA', 'genre', currentSummary.ULTIMA.genres),
        versions: findMismatchedRowIds('ULTIMA', 'version', currentSummary.ULTIMA.versions),
      },
    }
  })
  /** 選択中難易度で筐体表示と差がある分類。 */
  const currentMismatches = createMemo(() => mismatches()[selectedDifficulty()])
  /** 選択中難易度に差異が1件以上あるか。 */
  const hasCurrentMismatch = createMemo(
    () => currentMismatches().genres.length > 0 || currentMismatches().versions.length > 0
  )
  /** 選択中の難易度・分類軸で入力欄に並べる集計行。 */
  const currentRows = createMemo(() => {
    const difficultySummary = summary()?.[selectedDifficulty()]
    if (!difficultySummary) return []
    return selectedAxis() === 'genre' ? difficultySummary.genres : difficultySummary.versions
  })
  const candidateCells = createMemo(() => {
    const difficulty = selectedDifficulty()
    const difficultyMismatches = mismatches()[difficulty]
    return buildLockedSongDiscoveryCells(
      allChartEntries(),
      difficultyMismatches.genres,
      difficultyMismatches.versions,
      difficulty
    )
  })
  /** 候補範囲に含まれる楽曲の総数。 */
  const candidateSongCount = createMemo(() =>
    candidateCells().reduce((total, cell) => total + cell.songs.length, 0)
  )
  /** 差異がある分類軸に通知ドットを付けた選択肢。 */
  const axisOptions = createMemo(() =>
    LOCKED_SONG_DISCOVERY_AXIS_OPTIONS.map((option) => ({
      ...option,
      hasNotificationDot:
        option.value === 'genre'
          ? currentMismatches().genres.length > 0
          : currentMismatches().versions.length > 0,
    }))
  )
  /** 差異がある難易度に通知ドットを付けた選択肢。 */
  const difficultyOptions = createMemo(() =>
    LOCKED_SONG_DISCOVERY_DIFFICULTY_OPTIONS.map((option) => ({
      ...option,
      hasNotificationDot:
        mismatches()[option.value].genres.length > 0 ||
        mismatches()[option.value].versions.length > 0,
    }))
  )

  /**
   * 候補範囲のフィルターを通常レコードへ引き継いで遷移する。
   *
   * @param candidate - 遷移先で表示する候補範囲。
   * @returns 保存と遷移処理の完了時に解決されるPromise。
   */
  const handleOpenRecords = async (candidate: LockedSongDiscoveryCell): Promise<void> => {
    const currentUsername = username()
    const currentMasterData = masterData()
    const versionItems = versions()?.versions
    if (!currentUsername || !currentMasterData || !versionItems) return

    setRecordNavigationError('')
    try {
      const filter = buildLockedSongCandidateRecordFilter(
        buildDefaultFilter(currentMasterData, versionItems),
        candidate
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
              <div class="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <SegmentedToggleGroup
                  options={difficultyOptions()}
                  value={selectedDifficulty()}
                  onChange={setSelectedDifficulty}
                  ariaLabel={LOCKED_SONG_DISCOVERY_COPY.difficultySelect}
                  class="w-full sm:w-auto"
                  itemClass="min-h-10 flex-1 font-semibold tracking-wide sm:min-w-28"
                />
                <SegmentedToggleGroup
                  options={axisOptions()}
                  value={selectedAxis()}
                  onChange={setSelectedAxis}
                  ariaLabel={LOCKED_SONG_DISCOVERY_COPY.axisSelect}
                  class="w-full sm:w-auto"
                  itemClass="min-h-10 flex-1 sm:min-w-28"
                />
              </div>

              <div class="border-b border-border bg-surface-muted px-3 py-2">
                <div
                  class={`${ROW_GRID_CLASS} border-l-4 border-l-transparent font-sans text-xs font-medium text-text-muted`}
                  aria-hidden="true"
                >
                  <span class="pl-6">{LOCKED_SONG_DISCOVERY_COPY.categoryColumn}</span>
                  <span class="text-right">{LOCKED_SONG_DISCOVERY_COPY.observedOverPower}</span>
                  <span class="text-right">{LOCKED_SONG_DISCOVERY_COPY.observedPercent}</span>
                </div>
                <p class="mt-1 flex items-center gap-1 font-sans text-xs text-text-subtle">
                  <Info class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {LOCKED_SONG_DISCOVERY_COPY.inputGuide}
                </p>
              </div>

              <ul class="divide-y divide-border">
                <For each={currentRows()}>
                  {(row) => {
                    const key = () => observationKey(selectedDifficulty(), selectedAxis(), row.id)
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
              <div class="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 id={RESULT_TITLE_ID} class="font-sans text-base font-semibold">
                  {LOCKED_SONG_DISCOVERY_COPY.candidateTitle}
                </h2>
                <DifficultyBadge difficulty={selectedDifficulty()} compact />
              </div>

              <div class="flex shrink-0 flex-col gap-3 px-4 py-3">
                <p class="flex items-baseline gap-1.5" aria-live="polite">
                  <span class="font-jost text-4xl font-semibold tabular-nums leading-none">
                    {candidateCells().length}
                  </span>
                  <span class="font-sans text-sm text-text-muted">
                    {LOCKED_SONG_DISCOVERY_COPY.candidateCountUnit}
                  </span>
                  <Show when={candidateSongCount() > 0}>
                    <span class="ml-auto font-jost text-sm tabular-nums text-text-muted">
                      {candidateSongCount()}
                      {LOCKED_SONG_DISCOVERY_COPY.songCountUnit}
                    </span>
                  </Show>
                </p>
                <MismatchChips
                  title={LOCKED_SONG_DISCOVERY_COPY.mismatchedGenres}
                  items={currentMismatches().genres}
                />
                <MismatchChips
                  title={LOCKED_SONG_DISCOVERY_COPY.mismatchedVersions}
                  items={currentMismatches().versions}
                />
              </div>

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
                  <ul class="max-h-[60vh] min-h-0 flex-1 divide-y divide-border overflow-y-auto lg:max-h-none">
                    <For each={candidateCells()}>
                      {(cell) => (
                        <li>
                          <AppButton
                            variant="ghost"
                            fullWidth
                            class="justify-between gap-3 rounded-none px-4 py-2.5 text-left font-sans focus-visible:ring-inset"
                            aria-label={`${cell.difficulty} ${cell.genre} / ${cell.version}の${LOCKED_SONG_DISCOVERY_COPY.openRecords}`}
                            onClick={() => void handleOpenRecords(cell)}
                          >
                            <span class="min-w-0">
                              <span class="block truncate text-sm font-semibold text-text">
                                {cell.version}
                              </span>
                              <span class="block truncate text-xs text-text-muted">
                                {cell.genre}
                              </span>
                            </span>
                            <span class="flex shrink-0 items-center gap-1.5">
                              <span class="rounded-full bg-warning-bg px-2 py-0.5 font-jost text-xs font-medium tabular-nums text-warning">
                                {cell.songs.length}
                                {LOCKED_SONG_DISCOVERY_COPY.songCountUnit}
                              </span>
                              <ChevronRight class="h-4 w-4 text-text-subtle" aria-hidden="true" />
                            </span>
                          </AppButton>
                        </li>
                      )}
                    </For>
                  </ul>
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
                  {candidateCells().length}
                  {LOCKED_SONG_DISCOVERY_COPY.candidateCountUnit}
                </span>
              </AppButton>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default LockedSongDiscoveryPage
