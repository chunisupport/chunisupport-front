import { TextField } from '@kobalte/core/text-field'
import { useNavigate } from '@solidjs/router'
import { ArrowRight, CheckCircle2, ScanSearch, TriangleAlert } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, For, onMount, Show } from 'solid-js'
import { fetchMasterData, fetchVersions } from '../../api/songs'
import { LoadError, Loading, PlayerDataEmptyState } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppTabContent, SegmentedTabs } from '../../components/common/AppTabs'
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

/** 筐体観測値入力に共通するスタイル。 */
const INPUT_CLASS =
  'min-h-12 w-full rounded-md border border-border-strong bg-input-bg px-3 py-2 font-jost text-base tabular-nums text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/** 未入力の分類に適用する観測値。 */
const EMPTY_OBSERVATION: LockedSongObservation = { overPower: '', percent: '' }

/** 1分類分の照合行に必要な値と更新処理。 */
type ComparisonRowProps = {
  difficulty: LockedSongDiscoveryDifficulty
  axis: LockedSongDiscoveryAxis
  index: number
  row: OverPowerSummaryRow
  observation: LockedSongObservation
  comparison: LockedSongComparison
  onChange: (field: keyof LockedSongObservation, value: string) => void
}

/**
 * 1分類分の計算値、筐体入力、照合状態を表示する。
 *
 * @param props - 分類軸、集計行、観測値、照合結果、入力更新処理。
 * @returns ジャンルまたはバージョン1行分の照合フォーム。
 */
const ComparisonRow: Component<ComparisonRowProps> = (props) => {
  const inputId = (field: keyof LockedSongObservation): string =>
    `locked-song-discovery-${props.difficulty}-${props.axis}-${props.index}-${field}`
  const statusContent = () => {
    switch (props.comparison.status) {
      case 'match':
        return (
          <span class="inline-flex items-center gap-1 text-success">
            <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
            {LOCKED_SONG_DISCOVERY_COPY.matched}
          </span>
        )
      case 'mismatch':
        return (
          <span class="inline-flex items-center gap-1 text-warning">
            <TriangleAlert class="h-4 w-4" aria-hidden="true" />
            {LOCKED_SONG_DISCOVERY_COPY.mismatched}
          </span>
        )
      case 'invalid':
        return (
          <span class="inline-flex items-center gap-1 text-danger">
            <TriangleAlert class="h-4 w-4" aria-hidden="true" />
            {LOCKED_SONG_DISCOVERY_COPY.invalid}
          </span>
        )
      default:
        return (
          <span class="inline-flex items-center gap-1 text-text-subtle">
            <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
            {LOCKED_SONG_DISCOVERY_COPY.empty}
          </span>
        )
    }
  }

  return (
    <li class="rounded-lg border border-border bg-surface p-3 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="truncate font-sans font-semibold text-text">{props.row.label}</h3>
          <p class="font-jost text-xs tabular-nums text-text-muted">
            {LOCKED_SONG_DISCOVERY_COPY.calculated}: OP {formatTruncatedFixed(props.row.current, 2)}{' '}
            / {formatTruncatedFixed(props.row.percent, 2)}%
          </p>
        </div>
        <span class="font-sans text-xs font-medium" aria-live="polite">
          {statusContent()}
        </span>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-3">
        <TextField
          value={props.observation.overPower}
          onChange={(value) => props.onChange('overPower', value)}
          validationState={props.comparison.overPowerError ? 'invalid' : 'valid'}
        >
          <TextField.Label
            for={inputId('overPower')}
            class="mb-1 block font-sans text-sm font-medium text-text-muted"
          >
            {LOCKED_SONG_DISCOVERY_COPY.observedOverPower}
          </TextField.Label>
          <TextField.Input
            id={inputId('overPower')}
            name={inputId('overPower')}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]{0,2}"
            class={INPUT_CLASS}
            aria-describedby={
              props.comparison.overPowerError ? `${inputId('overPower')}-error` : undefined
            }
          />
          <Show when={props.comparison.overPowerError}>
            <TextField.ErrorMessage
              id={`${inputId('overPower')}-error`}
              class="mt-1 block font-sans text-xs text-danger"
            >
              {props.comparison.overPowerError}
            </TextField.ErrorMessage>
          </Show>
        </TextField>

        <TextField
          value={props.observation.percent}
          onChange={(value) => props.onChange('percent', value)}
          validationState={props.comparison.percentError ? 'invalid' : 'valid'}
        >
          <TextField.Label
            for={inputId('percent')}
            class="mb-1 block font-sans text-sm font-medium text-text-muted"
          >
            {LOCKED_SONG_DISCOVERY_COPY.observedPercent}
          </TextField.Label>
          <TextField.Input
            id={inputId('percent')}
            name={inputId('percent')}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]{0,2}"
            class={INPUT_CLASS}
            aria-describedby={
              props.comparison.percentError ? `${inputId('percent')}-error` : undefined
            }
          />
          <Show when={props.comparison.percentError}>
            <TextField.ErrorMessage
              id={`${inputId('percent')}-error`}
              class="mt-1 block font-sans text-xs text-danger"
            >
              {props.comparison.percentError}
            </TextField.ErrorMessage>
          </Show>
        </TextField>
      </div>
    </li>
  )
}

/** 1軸分の照合一覧に必要な値と更新処理。 */
type ComparisonListProps = {
  difficulty: LockedSongDiscoveryDifficulty
  axis: LockedSongDiscoveryAxis
  rows: OverPowerSummaryRow[]
  observations: Readonly<Record<string, LockedSongObservation>>
  onChange: (key: string, field: keyof LockedSongObservation, value: string) => void
}

/**
 * 1軸分の分類別照合フォームを表示する。
 *
 * @param props - 難易度、分類軸、集計行、観測値一覧、入力更新処理。
 * @returns 分類別の照合フォーム一覧。
 */
const ComparisonList: Component<ComparisonListProps> = (props) => (
  <ul class="grid gap-3 lg:grid-cols-2">
    <For each={props.rows}>
      {(row, index) => {
        const key = `${props.difficulty}:${props.axis}:${row.id}`
        const observation = () => props.observations[key] ?? EMPTY_OBSERVATION
        const comparison = () => compareLockedSongObservation(row, observation())
        return (
          <ComparisonRow
            difficulty={props.difficulty}
            axis={props.axis}
            index={index()}
            row={row}
            observation={observation()}
            comparison={comparison()}
            onChange={(field, value) => props.onChange(key, field, value)}
          />
        )
      }}
    </For>
  </ul>
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
            observations()[`${difficulty}:${axis}:${row.id}`] ?? EMPTY_OBSERVATION
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
  const currentMismatches = createMemo(() => mismatches()[selectedDifficulty()])
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
  const axisTabOptions = createMemo(() =>
    LOCKED_SONG_DISCOVERY_AXIS_OPTIONS.map((option) => ({
      ...option,
      hasNotificationDot:
        option.value === 'genre'
          ? currentMismatches().genres.length > 0
          : currentMismatches().versions.length > 0,
    }))
  )
  const difficultyTabOptions = createMemo(() =>
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
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <ScanSearch class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{tool.title}</h1>
          <p class="mt-1 font-sans text-sm text-text-muted">{tool.description}</p>
          <p class="mt-1 font-sans text-sm font-medium text-text">
            {LOCKED_SONG_DISCOVERY_COPY.inputGuide}
          </p>
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
          {(currentSummary) => (
            <>
              <Show when={!recordsComplete()}>
                <p
                  class="rounded-lg border border-danger-border bg-danger-bg p-3 font-sans text-sm text-danger"
                  role="alert"
                >
                  {LOCKED_SONG_DISCOVERY_COPY.recordIncomplete}
                </p>
              </Show>

              <SegmentedTabs
                options={difficultyTabOptions()}
                value={selectedDifficulty()}
                onChange={setSelectedDifficulty}
                listClass="w-full sm:w-auto"
                triggerClass="min-h-11 flex-1 sm:min-w-32"
              >
                <AppTabContent value="MASTER" class="mt-4">
                  <SegmentedTabs
                    options={axisTabOptions()}
                    value={selectedAxis()}
                    onChange={setSelectedAxis}
                    listClass="w-full sm:w-auto"
                    triggerClass="min-h-11 flex-1 sm:min-w-32"
                  >
                    <AppTabContent value="genre" class="mt-4">
                      <ComparisonList
                        difficulty="MASTER"
                        axis="genre"
                        rows={currentSummary().MASTER.genres}
                        observations={observations()}
                        onChange={handleObservationChange}
                      />
                    </AppTabContent>
                    <AppTabContent value="version" class="mt-4">
                      <ComparisonList
                        difficulty="MASTER"
                        axis="version"
                        rows={currentSummary().MASTER.versions}
                        observations={observations()}
                        onChange={handleObservationChange}
                      />
                    </AppTabContent>
                  </SegmentedTabs>
                </AppTabContent>
                <AppTabContent value="ULTIMA" class="mt-4">
                  <SegmentedTabs
                    options={axisTabOptions()}
                    value={selectedAxis()}
                    onChange={setSelectedAxis}
                    listClass="w-full sm:w-auto"
                    triggerClass="min-h-11 flex-1 sm:min-w-32"
                  >
                    <AppTabContent value="genre" class="mt-4">
                      <ComparisonList
                        difficulty="ULTIMA"
                        axis="genre"
                        rows={currentSummary().ULTIMA.genres}
                        observations={observations()}
                        onChange={handleObservationChange}
                      />
                    </AppTabContent>
                    <AppTabContent value="version" class="mt-4">
                      <ComparisonList
                        difficulty="ULTIMA"
                        axis="version"
                        rows={currentSummary().ULTIMA.versions}
                        observations={observations()}
                        onChange={handleObservationChange}
                      />
                    </AppTabContent>
                  </SegmentedTabs>
                </AppTabContent>
              </SegmentedTabs>

              <section class="rounded-lg border border-border bg-surface p-4">
                <h2 class="font-sans text-lg font-semibold" aria-live="polite">
                  {LOCKED_SONG_DISCOVERY_COPY.candidateTitle}
                  <span class="ml-2 text-sm text-text-muted">{selectedDifficulty()}</span>
                  <span class="ml-2 text-sm text-text-muted">
                    {candidateCells().length}
                    {LOCKED_SONG_DISCOVERY_COPY.candidateCountUnit}
                  </span>
                </h2>
                <Show when={currentMismatches().genres.length > 0}>
                  <div class="mt-3">
                    <h3 class="font-sans text-xs font-medium text-text-muted">
                      {LOCKED_SONG_DISCOVERY_COPY.mismatchedGenres}
                    </h3>
                    <ul class="mt-1 flex flex-wrap gap-1.5">
                      <For each={currentMismatches().genres}>
                        {(genre) => (
                          <li class="rounded-full bg-warning-bg px-2 py-1 font-sans text-xs text-warning">
                            {genre}
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </Show>
                <Show when={currentMismatches().versions.length > 0}>
                  <div class="mt-3">
                    <h3 class="font-sans text-xs font-medium text-text-muted">
                      {LOCKED_SONG_DISCOVERY_COPY.mismatchedVersions}
                    </h3>
                    <ul class="mt-1 flex flex-wrap gap-1.5">
                      <For each={currentMismatches().versions}>
                        {(version) => (
                          <li class="rounded-full bg-warning-bg px-2 py-1 font-sans text-xs text-warning">
                            {version}
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </Show>
                <Show
                  when={candidateCells().length > 0}
                  fallback={
                    <p class="mt-2 font-sans text-sm text-text-muted">
                      {currentMismatches().genres.length > 0 ||
                      currentMismatches().versions.length > 0
                        ? LOCKED_SONG_DISCOVERY_COPY.candidateNotFound
                        : LOCKED_SONG_DISCOVERY_COPY.candidateEmpty}
                    </p>
                  }
                >
                  <ul class="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    <For each={candidateCells()}>
                      {(cell) => (
                        <li class="min-w-0">
                          <AppButton
                            variant="surface"
                            size="sm"
                            fullWidth
                            class="justify-between border-warning-border bg-warning-bg font-sans hover:bg-warning-bg"
                            rightIcon={<ArrowRight class="h-4 w-4 shrink-0" aria-hidden="true" />}
                            aria-label={`${cell.difficulty} ${cell.genre} / ${cell.version}の${LOCKED_SONG_DISCOVERY_COPY.openRecords}`}
                            onClick={() => void handleOpenRecords(cell)}
                          >
                            <span class="min-w-0 truncate font-semibold text-warning">
                              {cell.genre} / {cell.version}
                            </span>
                            <span class="shrink-0 text-xs text-text-muted">
                              {cell.songs.length}曲
                            </span>
                          </AppButton>
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>
                <Show when={recordNavigationError()}>
                  <p class="mt-2 font-sans text-sm text-danger" role="alert">
                    {recordNavigationError()}
                  </p>
                </Show>
              </section>
            </>
          )}
        </Show>
      </Show>
    </div>
  )
}

export default LockedSongDiscoveryPage
