import { useLocation, useNavigate } from '@solidjs/router'
import { ArrowLeftRight, ChartBarBig, LockKeyhole, Table2 } from 'lucide-solid'
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
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import { fetchUserLockedSongs, updateMyLockedSongsBatch } from '../../../api/users'
import { LoadError, Loading } from '../../../components'
import { AppButton } from '../../../components/common/AppButton'
import { AppSelect } from '../../../components/common/AppSelect'
import { authSession } from '../../../stores/authSession'
import { useSongsData } from '../../../stores/songsData'
import type { PlayerLockedSongRequest, UserRecordDTO } from '../../../types/api'
import { buildLockedSongsBatchPayload } from '../../../usecases/overpower/lockedSongsBatch'
import { buildOverPowerLockedSongLookup } from '../../../usecases/overpower/overpowerGraph'
import { buildOverPowerSummary } from '../../../usecases/overpower/overpowerSummary'
import { buildUserOverPowerPagePath, type OverPowerSubPage } from '../../../utils/userProfileRoute'
import LockedSongsDialog from './components/LockedSongsDialog'
import LowLevelRowsToggle from './components/LowLevelRowsToggle'
import { OverPowerAllSummary } from './components/OverPowerAllSummary'
import { OverPowerSummaryGraph } from './components/OverPowerSummaryGraph'
import { OverPowerSummaryTable } from './components/OverPowerSummaryTable'
import {
  DEFAULT_OVER_POWER_SUMMARY_VIEW_MODE,
  OVER_POWER_SUMMARY_OPTIONS,
  overPowerSubPageBySummaryTab,
  overPowerSummaryTabBySubPage,
} from './constants'
import type {
  OverPowerGraphRow,
  OverPowerSummaryOption,
  OverPowerSummaryTab,
  OverPowerSummaryViewMode,
} from './types'
import {
  buildGraphRows,
  buildRecordsBySummaryTab,
  buildSongBasedGraphRows,
  buildSongEntriesBySummaryTab,
  isRecordAvailable,
  type RecordsBySummaryTab,
  type SongEntriesBySummaryTab,
} from './utils/graphRows'

type Props = {
  record: UserRecordDTO
  selectedSubPage: OverPowerSubPage
  username: string
}

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

  /**
   * OVER POWERサマリーの集計軸をURLサブページへ反映する。
   *
   * @param option - 次に表示する集計軸の選択肢。
   * @returns なし。
   */
  const handleSummaryTabChange = (option: OverPowerSummaryOption | null): void => {
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

  /**
   * 未解禁楽曲設定の差分を保存し、保存後に設定を再取得する。
   *
   * @param nextLockedSongs - 次に保存する未解禁楽曲設定一覧。
   * @returns 保存処理の完了を表すPromise。
   */
  const handleSaveLockedSongs = async (
    nextLockedSongs: PlayerLockedSongRequest[]
  ): Promise<void> => {
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
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0 shrink">
                    <AppSelect<OverPowerSummaryOption>
                      options={OVER_POWER_SUMMARY_OPTIONS}
                      optionValue="value"
                      optionTextValue="label"
                      value={selectedSummaryOption()}
                      onChange={handleSummaryTabChange}
                      placeholder="ジャンル"
                      rootClass="w-50 min-w-20 max-w-full"
                      triggerClass="font-medium text-text-muted"
                      contentZIndexClass="z-50"
                      formatLabel={(option) => option.label}
                    />
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <AppButton
                      variant="surface"
                      size="sm"
                      shape="pill"
                      class="h-10 min-w-16 focus-visible:ring-offset-2"
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
                    </AppButton>
                    <AppButton
                      variant="surface"
                      size="sm"
                      shape="pill"
                      class="h-10 whitespace-nowrap focus-visible:ring-offset-2"
                      aria-label="未解禁楽曲設定"
                      title="未解禁楽曲設定"
                      disabled={lockedSongsButtonDisabled()}
                      onClick={() => setLockedSongsDialogOpen(true)}
                      rightIcon={<LockKeyhole class="h-5 w-5" aria-hidden="true" />}
                    >
                      <span>未解禁曲</span>
                    </AppButton>
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

                <Show when={selectedSummaryTab() === 'genres'}>
                  <div class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <OverPowerSummaryTable rows={currentSummary().genres} countLabel="曲数" />
                      }
                    >
                      <OverPowerSummaryGraph rows={genreGraphRows()} />
                    </Show>
                  </div>
                </Show>

                <Show when={selectedSummaryTab() === 'difficulties'}>
                  <div class="mt-4">
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
                  </div>
                </Show>

                <Show when={selectedSummaryTab() === 'levels'}>
                  <div class="mt-4">
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
                  </div>
                </Show>

                <Show when={selectedSummaryTab() === 'versions'}>
                  <div class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <OverPowerSummaryTable rows={currentSummary().versions} countLabel="曲数" />
                      }
                    >
                      <OverPowerSummaryGraph rows={versionGraphRows()} />
                    </Show>
                  </div>
                </Show>

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
