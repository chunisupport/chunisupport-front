import { Button } from '@kobalte/core/button'
import { Select } from '@kobalte/core/select'
import * as Tabs from '@kobalte/core/tabs'
import { useLocation, useNavigate } from '@solidjs/router'
import {
  ArrowLeftRight,
  ChartBarBig,
  Check,
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  Table2,
} from 'lucide-solid'
import type { Component } from 'solid-js'
import {
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  onMount,
  Show,
  Suspense,
} from 'solid-js'
import { fetchMasterData, fetchVersions } from '../../../api/songs.ts'
import { fetchUserLockedSongs, updateMyLockedSongsBatch } from '../../../api/users.ts'
import { LoadError, Loading } from '../../../components/index.ts'
import { authSession } from '../../../stores/authSession.ts'
import { useSongsData } from '../../../stores/songsData.ts'
import type {
  PlayerLockedSongRequest,
  PlayerRecordDTO,
  SongDTO,
  UserRecordDTO,
  VersionSummaryDTO,
} from '../../../types/api.ts'
import { buildLockedSongsBatchPayload } from '../../../usecases/overpower/lockedSongsBatch.ts'
import {
  buildOverPowerLockedSongLookup,
  buildTheoreticalTargetRecordBySongId,
} from '../../../usecases/overpower/overpowerGraph.ts'
import { buildOverPowerSummary } from '../../../usecases/overpower/overpowerSummary.ts'
import type { OverPowerDifficulty } from '../../../usecases/overpower/types.ts'
import { toChartLevelLabel } from '../../../utils/chartLevel.ts'
import { getScoreRank, MAX_SCORE } from '../../../utils/scoreRank.ts'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../utils/versionConverter.ts'
import { buildUserOverPowerPagePath, type OverPowerSubPage } from '../UserPage/profilePageQuery.ts'
import LockedSongsDialog from './components/LockedSongsDialog.tsx'
import { OverPowerAllSummary } from './components/OverPowerAllSummary.tsx'
import {
  type OverPowerComboBand,
  type OverPowerGraphRow,
  type OverPowerScoreBand,
  OverPowerSummaryGraph,
} from './components/OverPowerSummaryGraph.tsx'
import { OverPowerSummaryTable } from './components/OverPowerSummaryTable.tsx'

type Props = {
  record: UserRecordDTO
  selectedSubPage: OverPowerSubPage
  username: string
}

type OverPowerSummaryTab = 'genres' | 'difficulties' | 'levels' | 'versions'
type OverPowerSummaryOption = {
  value: OverPowerSummaryTab
  label: string
}
type OverPowerSummaryViewMode = 'table' | 'graph'
type LockedSongLookup = {
  lockedSongIds: Set<string>
  ultimaLockedSongIds: Set<string>
}
type RecordsBySummaryTab = Record<OverPowerSummaryTab, Map<string, PlayerRecordDTO[]>>
type SongGraphEntry = {
  song: SongDTO
  record: PlayerRecordDTO | null
  versionName: string | null
}
type SongEntriesBySummaryTab = Pick<
  Record<OverPowerSummaryTab, Map<string, SongGraphEntry[]>>,
  'genres' | 'versions'
> & {
  all: Map<string, SongGraphEntry[]>
}

/** OVERPOWERサマリーを開いたときに最初に表示する表示形式。 */
const DEFAULT_OVER_POWER_SUMMARY_VIEW_MODE: OverPowerSummaryViewMode = 'graph'

/** レベル別集計で初期状態では折りたたむ低レベル帯の表示名。 */
const LOW_LEVEL_SUMMARY_LABEL = 'Lv.1-9+'

const OVER_POWER_SUMMARY_OPTIONS: OverPowerSummaryOption[] = [
  { value: 'genres', label: 'ジャンル' },
  { value: 'difficulties', label: '難易度' },
  { value: 'levels', label: 'レベル' },
  { value: 'versions', label: 'バージョン' },
]

const overPowerSummaryTabBySubPage: Record<OverPowerSubPage, OverPowerSummaryTab> = {
  genre: 'genres',
  diff: 'difficulties',
  level: 'levels',
  version: 'versions',
}

const overPowerSubPageBySummaryTab: Record<OverPowerSummaryTab, OverPowerSubPage> = {
  genres: 'genre',
  difficulties: 'diff',
  levels: 'level',
  versions: 'version',
}

const OVER_POWER_SCORE_BANDS: OverPowerScoreBand[] = [
  'MAX',
  'SSS+',
  'SSS',
  'SS+',
  'SS',
  'S+',
  'S',
  'OTHER',
]
const OVER_POWER_COMBO_BANDS: OverPowerComboBand[] = ['ALL JUSTICE', 'FULL COMBO', 'OTHER']
const ULTIMA_DIFFICULTY: OverPowerDifficulty = 'ULTIMA'

/** レコードが未解禁設定の対象外で、OVERPOWER集計に含められるかを判定する。 */
const isRecordAvailable = (record: PlayerRecordDTO, lockedLookup: LockedSongLookup): boolean => {
  if (lockedLookup.lockedSongIds.has(record.id)) return false
  return !(
    record.difficulty === ULTIMA_DIFFICULTY && lockedLookup.ultimaLockedSongIds.has(record.id)
  )
}

/** 未解禁設定を反映した曲内の最高譜面定数を取得する。 */
const getHighestAvailableChartConst = (
  song: SongDTO,
  lockedLookup: LockedSongLookup
): number | null => {
  const chartEntries = Object.entries(song.charts) as [
    OverPowerDifficulty,
    SongDTO['charts'][OverPowerDifficulty],
  ][]
  const chartConsts = chartEntries
    .filter(
      ([difficulty]) =>
        !(difficulty === ULTIMA_DIFFICULTY && lockedLookup.ultimaLockedSongIds.has(song.id))
    )
    .map(([, chart]) => chart?.const)
    .filter((chartConst): chartConst is number => typeof chartConst === 'number')
  if (chartConsts.length === 0) return null
  return Math.max(...chartConsts)
}

/** 曲数ベースのグラフ分布を作るため、楽曲を表示タブごとに分類する。 */
const buildSongEntriesBySummaryTab = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  versions: VersionSummaryDTO[],
  lockedLookup: LockedSongLookup
): SongEntriesBySummaryTab => {
  const targetRecordBySongId = buildTheoreticalTargetRecordBySongId(songs, records, lockedLookup)
  const groups: SongEntriesBySummaryTab = {
    all: new Map(),
    genres: new Map(),
    versions: new Map(),
  }

  for (const song of songs) {
    if (lockedLookup.lockedSongIds.has(song.id)) continue
    if (getHighestAvailableChartConst(song, lockedLookup) === null) continue

    const resolvedVersion = resolveVersionNameByReleaseDate(song.release, versions)
    const baseEntry = {
      song,
      versionName: resolvedVersion === '不明' ? null : getShortVersionName(resolvedVersion),
    }
    const allEntry: SongGraphEntry = {
      ...baseEntry,
      record: targetRecordBySongId.get(song.id) ?? null,
    }
    addSongEntryToGroup(groups.all, 'all', allEntry)

    if (song.genre && song.genre !== '不明') {
      addSongEntryToGroup(groups.genres, song.genre, allEntry)
    }

    if (allEntry.versionName) {
      addSongEntryToGroup(groups.versions, allEntry.versionName, allEntry)
    }
  }

  return groups
}

/** グラフのカテゴリ別分布を作るため、レコードを表示タブごとに分類する。 */
const buildRecordsBySummaryTab = (
  records: PlayerRecordDTO[],
  songs: SongDTO[],
  versions: VersionSummaryDTO[]
): RecordsBySummaryTab => {
  const songById = new Map(songs.map((song) => [song.id, song]))
  const groups: RecordsBySummaryTab = {
    genres: new Map(),
    difficulties: new Map(),
    levels: new Map(),
    versions: new Map(),
  }

  for (const record of records) {
    const song = songById.get(record.id)
    const levelLabel = toChartLevelLabel(record.const)
    addRecordToGroup(groups.difficulties, record.difficulty, record)
    addRecordToGroup(groups.levels, levelLabel, record)

    if (song?.genre && song.genre !== '不明') {
      addRecordToGroup(groups.genres, song.genre, record)
    }

    const resolvedVersion = resolveVersionNameByReleaseDate(song?.release ?? null, versions)
    if (resolvedVersion !== '不明') {
      addRecordToGroup(groups.versions, getShortVersionName(resolvedVersion), record)
    }
  }

  return groups
}

/** Map内のレコード配列へ対象レコードを追加する。 */
const addRecordToGroup = (
  groups: Map<string, PlayerRecordDTO[]>,
  key: string,
  record: PlayerRecordDTO
) => {
  const group = groups.get(key) ?? []
  group.push(record)
  groups.set(key, group)
}

/** Map内の曲エントリ配列へ対象曲を追加する。 */
const addSongEntryToGroup = (
  groups: Map<string, SongGraphEntry[]>,
  key: string,
  entry: SongGraphEntry
) => {
  const group = groups.get(key) ?? []
  group.push(entry)
  groups.set(key, group)
}

/** スコアからグラフ表示用のランク帯を取得する。 */
const getScoreBand = (record: PlayerRecordDTO): OverPowerScoreBand => {
  if (!record.is_played) return 'OTHER'
  if (record.score >= MAX_SCORE) return 'MAX'

  const rank = getScoreRank(record.score)
  if (
    rank === 'SSS+' ||
    rank === 'SSS' ||
    rank === 'SS+' ||
    rank === 'SS' ||
    rank === 'S+' ||
    rank === 'S'
  ) {
    return rank
  }

  return 'OTHER'
}

/** 曲数ベース集計用に、代表レコードがない曲をOTHER扱いでランク帯へ分類する。 */
const getSongScoreBand = (entry: SongGraphEntry): OverPowerScoreBand =>
  entry.record ? getScoreBand(entry.record) : 'OTHER'

/** コンボランプからグラフ表示用のランプ帯を取得する。 */
const getComboBand = (record: PlayerRecordDTO): OverPowerComboBand => {
  if (record.combo_lamp === 'ALL JUSTICE') return 'ALL JUSTICE'
  if (record.combo_lamp === 'FULL COMBO') return 'FULL COMBO'
  return 'OTHER'
}

/** 曲数ベース集計用に、代表レコードがない曲をOTHER扱いでランプ帯へ分類する。 */
const getSongComboBand = (entry: SongGraphEntry): OverPowerComboBand =>
  entry.record ? getComboBand(entry.record) : 'OTHER'

/** グラフ表示に必要なランク・コンボ分布をサマリー行へ付与する。 */
const buildGraphRows = (
  rows: OverPowerGraphRow['summary'][],
  recordsByLabel: Map<string, PlayerRecordDTO[]>
): OverPowerGraphRow[] =>
  rows.map((summary) => {
    const records = recordsByLabel.get(summary.id) ?? recordsByLabel.get(summary.label) ?? []
    return {
      summary,
      scoreBands: OVER_POWER_SCORE_BANDS.map((label) => ({
        label,
        count: records.filter((record) => getScoreBand(record) === label).length,
      })),
      comboBands: OVER_POWER_COMBO_BANDS.map((label) => ({
        label,
        count: records.filter((record) => getComboBand(record) === label).length,
      })),
    }
  })

/** 曲数ベースのランク・コンボ分布をサマリー行へ付与する。 */
const buildSongBasedGraphRows = (
  rows: OverPowerGraphRow['summary'][],
  entriesByLabel: Map<string, SongGraphEntry[]>
): OverPowerGraphRow[] =>
  rows.map((summary) => {
    const entries = entriesByLabel.get(summary.id) ?? entriesByLabel.get(summary.label) ?? []
    return {
      summary,
      scoreBands: OVER_POWER_SCORE_BANDS.map((label) => ({
        label,
        count: entries.filter((entry) => getSongScoreBand(entry) === label).length,
      })),
      comboBands: OVER_POWER_COMBO_BANDS.map((label) => ({
        label,
        count: entries.filter((entry) => getSongComboBand(entry) === label).length,
      })),
    }
  })

/**
 * レベル別集計の低レベル帯を開閉するボタンを表示する。
 *
 * @param props - 開閉状態、対象譜面数、および開閉ハンドラ。
 * @returns レベル1から9+の表示を切り替えるボタン。
 */
const LowLevelRowsToggle: Component<{
  expanded: boolean
  chartCount: number
  onClick: () => void
}> = (props) => (
  <Button
    type="button"
    class="group inline-flex min-h-9 items-center gap-2 rounded-full border border-border-strong bg-surface px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
    aria-expanded={props.expanded}
    aria-controls="over-power-low-level-summary"
    title={`${LOW_LEVEL_SUMMARY_LABEL}を${props.expanded ? '折りたたむ' : '展開'}`}
    onClick={props.onClick}
  >
    <ChevronRight
      class="h-4 w-4 transition-transform group-aria-expanded:rotate-90"
      aria-hidden="true"
    />
    <span>{LOW_LEVEL_SUMMARY_LABEL}</span>
    <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums text-text-subtle">
      {props.chartCount}
    </span>
  </Button>
)

/**
 * ユーザーのOVERPOWERサマリーと分布グラフを表示する。
 *
 * @param props - レコード、選択中サブページ、表示対象ユーザー名。
 * @returns OVER POWER タブの表示要素。
 */
const UserOverPower: Component<Props> = (props) => {
  const { songsResponse: allSongs, ensureSongsLoaded } = useSongsData()
  const [masterData] = createResource(fetchMasterData)
  const [versionData] = createResource(fetchVersions)
  const [summaryViewMode, setSummaryViewMode] = createSignal<OverPowerSummaryViewMode>(
    DEFAULT_OVER_POWER_SUMMARY_VIEW_MODE
  )
  const [lowLevelRowsExpanded, setLowLevelRowsExpanded] = createSignal(false)
  const canManageLockedSongs = createMemo(
    () => authSession.status === 'authenticated' && authSession.user?.username === props.username
  )
  const [lockedSongs, { refetch: refetchLockedSongs }] = createResource(
    () => props.username,
    fetchUserLockedSongs
  )
  const [lockedSongsDialogOpen, setLockedSongsDialogOpen] = createSignal(false)
  const navigate = useNavigate()
  const location = useLocation()

  onMount(() => {
    ensureSongsLoaded()
  })

  const selectedSummaryTab = createMemo<OverPowerSummaryTab>(
    () => overPowerSummaryTabBySubPage[props.selectedSubPage]
  )
  const selectedSummaryOption = createMemo(
    () =>
      OVER_POWER_SUMMARY_OPTIONS.find((option) => option.value === selectedSummaryTab()) ??
      OVER_POWER_SUMMARY_OPTIONS[0]
  )

  const summary = createMemo(() => {
    const songs = allSongs()
    const md = masterData()
    const versions = versionData()
    const currentLockedSongs = lockedSongs()
    if (!songs || !md || !versions || !currentLockedSongs) return undefined
    return buildOverPowerSummary(
      songs.songs,
      props.record.standard,
      versions.versions,
      currentLockedSongs.items,
      md.genres
    )
  })

  const highLevelRows = createMemo(() => summary()?.levels.filter((row) => !row.isLowLevel) ?? [])
  const lowLevelRows = createMemo(() => summary()?.levels.filter((row) => row.isLowLevel) ?? [])
  const displayedLevelRows = createMemo(() =>
    lowLevelRowsExpanded() ? (summary()?.levels ?? []) : highLevelRows()
  )
  const lowLevelChartCount = createMemo(() =>
    lowLevelRows().reduce((sum, row) => sum + row.count, 0)
  )
  const availableRecords = createMemo(() => {
    const currentLockedSongs = lockedSongs()
    if (!currentLockedSongs) return []

    const lockedLookup = buildOverPowerLockedSongLookup(currentLockedSongs.items)
    return props.record.standard.filter((record) => isRecordAvailable(record, lockedLookup))
  })
  const graphRecordsByTab = createMemo<RecordsBySummaryTab | undefined>(() => {
    const songs = allSongs()
    const versions = versionData()
    if (!songs || !versions) return undefined
    return buildRecordsBySummaryTab(availableRecords(), songs.songs, versions.versions)
  })
  const graphSongEntriesByTab = createMemo<SongEntriesBySummaryTab | undefined>(() => {
    const songs = allSongs()
    const versions = versionData()
    const currentLockedSongs = lockedSongs()
    if (!songs || !versions || !currentLockedSongs) return undefined

    const lockedLookup = buildOverPowerLockedSongLookup(currentLockedSongs.items)
    return buildSongEntriesBySummaryTab(
      songs.songs,
      availableRecords(),
      versions.versions,
      lockedLookup
    )
  })
  const allGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const currentSummary = summary()
    const songGroups = graphSongEntriesByTab()
    if (!currentSummary || !songGroups) return []
    return buildSongBasedGraphRows([currentSummary.all], songGroups.all)
  })
  const genreGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const currentSummary = summary()
    const songGroups = graphSongEntriesByTab()
    if (!currentSummary || !songGroups) return []
    return buildSongBasedGraphRows(currentSummary.genres, songGroups.genres)
  })
  const difficultyGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const currentSummary = summary()
    const recordGroups = graphRecordsByTab()
    if (!currentSummary || !recordGroups) return []
    return buildGraphRows(currentSummary.difficulties, recordGroups.difficulties)
  })
  const levelGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const recordGroups = graphRecordsByTab()
    if (!recordGroups) return []
    return buildGraphRows(displayedLevelRows(), recordGroups.levels)
  })
  const versionGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const currentSummary = summary()
    const songGroups = graphSongEntriesByTab()
    if (!currentSummary || !songGroups) return []
    return buildSongBasedGraphRows(currentSummary.versions, songGroups.versions)
  })
  const iconButtonClass =
    'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-disabled-text'
  const lockedSongsButtonDisabled = createMemo(
    () => !canManageLockedSongs() || !allSongs() || lockedSongs.loading
  )
  const nextSummaryViewMode = createMemo<OverPowerSummaryViewMode>(() =>
    summaryViewMode() === 'table' ? 'graph' : 'table'
  )

  /** OVERPOWERサマリーの表示形式をテーブルとグラフの間で切り替える。 */
  const handleToggleSummaryViewMode = () => {
    setSummaryViewMode(nextSummaryViewMode())
  }

  /** レベル別集計の低レベル帯表示を切り替える。 */
  const handleToggleLowLevelRows = () => {
    setLowLevelRowsExpanded((expanded) => !expanded)
  }

  const handleSummaryTabChange = (option: OverPowerSummaryOption | null) => {
    if (!option) return

    const queryParams = new URLSearchParams(location.search)
    queryParams.delete('page')
    const queryString = queryParams.toString()
    const normalizedPath = buildUserOverPowerPagePath(
      props.username,
      overPowerSubPageBySummaryTab[option.value]
    )

    navigate(`${normalizedPath}${queryString ? `?${queryString}` : ''}${location.hash}`)
  }

  const handleSaveLockedSongs = async (nextLockedSongs: PlayerLockedSongRequest[]) => {
    const currentLockedSongs = lockedSongs()?.items
    if (!currentLockedSongs) return

    const payload = buildLockedSongsBatchPayload(currentLockedSongs, nextLockedSongs)
    if (!payload.add && !payload.delete) return

    await updateMyLockedSongsBatch(payload)
    await refetchLockedSongs()
  }

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
        <Show
          when={!allSongs.error && !masterData.error && !versionData.error && !lockedSongs.error}
          fallback={
            <LoadError
              error={allSongs.error ?? masterData.error ?? versionData.error ?? lockedSongs.error}
            />
          }
        >
          <Show when={summary()} fallback={<Loading />}>
            {(currentSummary) => (
              <div class="mx-4 flex flex-col gap-4 text-sm">
                <Tabs.Root value={selectedSummaryTab()}>
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0 shrink">
                      <Select<OverPowerSummaryOption>
                        options={OVER_POWER_SUMMARY_OPTIONS}
                        optionValue="value"
                        optionTextValue="label"
                        value={selectedSummaryOption()}
                        onChange={handleSummaryTabChange}
                        placeholder="ジャンル"
                        gutter={0}
                        itemComponent={(itemProps) => (
                          <Select.Item
                            item={itemProps.item}
                            class="cursor-pointer px-3 py-2 text-text hover:bg-success-bg-hover data-[highlighted]:bg-success-bg-hover data-[selected]:bg-success-bg data-[selected]:hover:bg-success-bg-hover data-[selected]:data-[highlighted]:bg-success-bg-hover"
                          >
                            <div class="flex items-center gap-2">
                              <span class="inline-flex w-4 justify-center text-success">
                                <Select.ItemIndicator>
                                  <Check size={14} />
                                </Select.ItemIndicator>
                              </span>
                              <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
                            </div>
                          </Select.Item>
                        )}
                      >
                        <Select.Trigger class="grid w-[200px] min-w-20 max-w-full grid-cols-[1fr_auto] items-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm font-medium text-text-muted">
                          <Select.Value<OverPowerSummaryOption> class="truncate">
                            {(state) => <span>{state.selectedOption()?.label ?? 'ジャンル'}</span>}
                          </Select.Value>
                          <span class="justify-self-end text-text-subtle" aria-hidden="true">
                            <ChevronDown size={16} />
                          </span>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content class="z-50 max-h-64 w-(--kb-select-content-width) overflow-auto rounded border border-border bg-surface shadow-md">
                            <Select.Listbox />
                          </Select.Content>
                        </Select.Portal>
                      </Select>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        class="inline-flex h-10 min-w-16 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-3 text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
                        aria-label={`${nextSummaryViewMode() === 'graph' ? 'グラフ' : 'テーブル'}表示に切り替え`}
                        title={`${nextSummaryViewMode() === 'graph' ? 'グラフ' : 'テーブル'}表示に切り替え`}
                        onClick={handleToggleSummaryViewMode}
                      >
                        <ArrowLeftRight class="h-4 w-4" aria-hidden="true" />
                        <Show
                          when={nextSummaryViewMode() === 'graph'}
                          fallback={<Table2 class="h-4 w-4" aria-hidden="true" />}
                        >
                          <ChartBarBig class="h-4 w-4" aria-hidden="true" />
                        </Show>
                      </Button>
                      <Button
                        type="button"
                        class={`${iconButtonClass} whitespace-nowrap`}
                        aria-label="未解禁楽曲設定"
                        title="未解禁楽曲設定"
                        disabled={lockedSongsButtonDisabled()}
                        onClick={() => setLockedSongsDialogOpen(true)}
                      >
                        <span>未解禁曲</span>
                        <LockKeyhole class="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  <div class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={<OverPowerAllSummary summary={currentSummary().all} />}
                    >
                      <OverPowerSummaryGraph rows={allGraphRows()} />
                    </Show>
                  </div>

                  <Tabs.Content value="genres" class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <OverPowerSummaryTable rows={currentSummary().genres} countLabel="曲数" />
                      }
                    >
                      <OverPowerSummaryGraph rows={genreGraphRows()} />
                    </Show>
                  </Tabs.Content>

                  <Tabs.Content value="difficulties" class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <OverPowerSummaryTable
                          rows={currentSummary().difficulties}
                          countLabel="譜面数"
                        />
                      }
                    >
                      <OverPowerSummaryGraph rows={difficultyGraphRows()} />
                    </Show>
                  </Tabs.Content>

                  <Tabs.Content value="levels" class="mt-4">
                    <Show when={lowLevelRows().length > 0}>
                      <div class="mb-3">
                        <LowLevelRowsToggle
                          expanded={lowLevelRowsExpanded()}
                          chartCount={lowLevelChartCount()}
                          onClick={handleToggleLowLevelRows}
                        />
                      </div>
                    </Show>
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <div id="over-power-low-level-summary">
                          <OverPowerSummaryTable rows={displayedLevelRows()} countLabel="譜面数" />
                        </div>
                      }
                    >
                      <div id="over-power-low-level-summary">
                        <OverPowerSummaryGraph rows={levelGraphRows()} />
                      </div>
                    </Show>
                  </Tabs.Content>

                  <Tabs.Content value="versions" class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <OverPowerSummaryTable rows={currentSummary().versions} countLabel="曲数" />
                      }
                    >
                      <OverPowerSummaryGraph rows={versionGraphRows()} />
                    </Show>
                  </Tabs.Content>
                </Tabs.Root>

                <Show when={canManageLockedSongs() && allSongs() && lockedSongs()}>
                  <LockedSongsDialog
                    open={lockedSongsDialogOpen()}
                    songs={allSongs()?.songs ?? []}
                    records={props.record.standard}
                    genres={masterData()?.genres ?? []}
                    versions={versionData()?.versions ?? []}
                    lockedSongs={lockedSongs()?.items ?? []}
                    onOpenChange={setLockedSongsDialogOpen}
                    onSaveLockedSongs={handleSaveLockedSongs}
                  />
                </Show>
              </div>
            )}
          </Show>
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserOverPower
