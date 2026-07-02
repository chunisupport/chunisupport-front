import { Button } from '@kobalte/core/button'
import { Select } from '@kobalte/core/select'
import * as Tabs from '@kobalte/core/tabs'
import { ToggleButton } from '@kobalte/core/toggle-button'
import { useLocation, useNavigate } from '@solidjs/router'
import {
  ArrowLeftRight,
  ChartBarBig,
  ChevronDown,
  LockKeyhole,
  LockKeyholeOpen,
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
import { fetchMasterData, fetchVersions } from '../../../api/songs'
import { fetchUserLockedSongs, updateMyLockedSongsBatch } from '../../../api/users'
import { LoadError, Loading } from '../../../components'
import { authSession } from '../../../stores/authSession'
import { useSongsData } from '../../../stores/songsData'
import type { PlayerLockedSongRequest, UserRecordDTO } from '../../../types/api'
import {
  buildOverPowerChartEntries,
  selectOverPowerChartEntries,
} from '../../../usecases/overpower/aggregation'
import { buildLockedSongsBatchPayload } from '../../../usecases/overpower/lockedSongsBatch'
import { buildOverPowerSummary } from '../../../usecases/overpower/overpowerSummary'
import type { OverPowerAggregationTarget } from '../../../usecases/overpower/types'
import { buildUserOverPowerPagePath, type OverPowerSubPage } from '../UserPage/profilePageQuery'
import LockedSongsDialog from './components/LockedSongsDialog'
import LowLevelRowsToggle from './components/LowLevelRowsToggle'
import { OverPowerSummaryGraph } from './components/OverPowerSummaryGraph'
import { OverPowerSummaryTable } from './components/OverPowerSummaryTable'
import {
  DEFAULT_OVER_POWER_SUMMARY_VIEW_MODE,
  OVER_POWER_AGGREGATION_TARGET_OPTIONS,
  OVER_POWER_CONTROL_LABELS,
  OVER_POWER_LOCKED_SONG_EXCLUSION_LABEL,
  OVER_POWER_SUMMARY_OPTIONS,
  overPowerSubPageBySummaryTab,
  overPowerSummaryTabBySubPage,
} from './constants'
import type {
  OverPowerAggregationTargetOption,
  OverPowerGraphRow,
  OverPowerSummaryOption,
  OverPowerSummaryTab,
  OverPowerSummaryViewMode,
} from './types'
import {
  buildChartRecordsBySummaryTab,
  buildGraphRows,
  type RecordsBySummaryTab,
} from './utils/graphRows'

type Props = {
  record: UserRecordDTO
  selectedSubPage: OverPowerSubPage
  username: string
}

/** OVER POWER画面上部のSelectトリガー共通クラス。 */
const SELECT_TRIGGER_CLASS =
  'grid h-10 min-w-0 grid-cols-[1fr_auto] items-center gap-1 rounded border border-border-strong bg-surface px-2 text-left text-sm text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'

/** OVER POWER画面上部のSelect選択肢共通クラス。 */
const SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-text hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg'

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
  const selectedSummaryTab = createMemo<OverPowerSummaryTab>(
    () => overPowerSummaryTabBySubPage[props.selectedSubPage]
  )
  const [aggregationTarget, setAggregationTarget] =
    createSignal<OverPowerAggregationTarget>('OP_TARGET')
  const [excludeLockedSongs, setExcludeLockedSongs] = createSignal(true)
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

  const allChartEntries = createMemo(() => {
    const songs = allSongs()
    const versions = versionData()
    const currentLockedSongs = lockedSongs()
    if (!songs || !versions || !currentLockedSongs) return []
    return buildOverPowerChartEntries(
      songs.songs,
      props.record.standard,
      versions.versions,
      excludeLockedSongs() ? currentLockedSongs.items : []
    )
  })

  const filteredChartEntries = createMemo(() =>
    selectOverPowerChartEntries(allChartEntries(), aggregationTarget())
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
      excludeLockedSongs() ? currentLockedSongs.items : [],
      md.genres,
      aggregationTarget()
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
  const graphRecordsByTab = createMemo<RecordsBySummaryTab | undefined>(() => {
    return buildChartRecordsBySummaryTab(filteredChartEntries())
  })
  const allGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const currentSummary = summary()
    const recordGroups = graphRecordsByTab()
    if (!currentSummary || !recordGroups) return []
    return buildGraphRows([currentSummary.all], recordGroups.all)
  })
  const genreGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const currentSummary = summary()
    const recordGroups = graphRecordsByTab()
    if (!currentSummary || !recordGroups) return []
    return buildGraphRows(currentSummary.genres, recordGroups.genres)
  })
  const levelGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const recordGroups = graphRecordsByTab()
    if (!recordGroups) return []
    return buildGraphRows(displayedLevelRows(), recordGroups.levels)
  })
  const versionGraphRows = createMemo<OverPowerGraphRow[]>(() => {
    const currentSummary = summary()
    const recordGroups = graphRecordsByTab()
    if (!currentSummary || !recordGroups) return []
    return buildGraphRows(currentSummary.versions, recordGroups.versions)
  })
  const selectedSummaryOption = createMemo(
    () =>
      OVER_POWER_SUMMARY_OPTIONS.find((option) => option.value === selectedSummaryTab()) ??
      OVER_POWER_SUMMARY_OPTIONS[0]
  )
  const selectedAggregationTargetOption = createMemo(
    () =>
      OVER_POWER_AGGREGATION_TARGET_OPTIONS.find(
        (option) => option.value === aggregationTarget()
      ) ?? OVER_POWER_AGGREGATION_TARGET_OPTIONS[0]
  )
  const countLabel = createMemo(() =>
    aggregationTarget() === 'OP_TARGET'
      ? OVER_POWER_CONTROL_LABELS.songCount
      : OVER_POWER_CONTROL_LABELS.chartCount
  )
  const iconButtonClass =
    'inline-flex h-10 items-center justify-center gap-1 rounded-full border border-border-strong bg-surface px-3 text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-disabled-text'
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
   * 表示軸を更新し、対応するOVER POWERサブページへ遷移する。
   *
   * @param option - 選択された表示軸。選択解除時はnull。
   * @returns なし。
   */
  const handleSummaryTabChange = (option: OverPowerSummaryOption | null): void => {
    if (!option) return

    const queryParams = new URLSearchParams(location.search)
    queryParams.delete('page')
    const queryString = queryParams.toString()
    const path = buildUserOverPowerPagePath(
      props.username,
      overPowerSubPageBySummaryTab[option.value]
    )
    navigate(`${path}${queryString ? `?${queryString}` : ''}${location.hash}`)
  }

  /**
   * OVER POWERの集計対象を更新する。
   *
   * @param option - 選択された集計対象。選択解除時はnull。
   * @returns なし。
   */
  const handleAggregationTargetChange = (option: OverPowerAggregationTargetOption | null): void => {
    if (option) setAggregationTarget(option.value)
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
                <Tabs.Root value={selectedSummaryTab()}>
                  <div class="flex flex-wrap items-center justify-between gap-x-1.5 gap-y-2">
                    <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
                      <Select<OverPowerSummaryOption>
                        options={OVER_POWER_SUMMARY_OPTIONS}
                        optionValue="value"
                        optionTextValue="label"
                        value={selectedSummaryOption()}
                        onChange={handleSummaryTabChange}
                        gutter={0}
                        itemComponent={(itemProps) => (
                          <Select.Item item={itemProps.item} class={SELECT_ITEM_CLASS}>
                            <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
                          </Select.Item>
                        )}
                      >
                        <Select.Trigger class={`${SELECT_TRIGGER_CLASS} w-full sm:w-28`}>
                          <Select.Value<OverPowerSummaryOption>>
                            {(state) => state.selectedOption()?.label}
                          </Select.Value>
                          <ChevronDown size={16} aria-hidden="true" />
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content class="z-40 max-h-64 w-(--kb-select-content-width) overflow-auto rounded border border-border bg-surface shadow-md">
                            <Select.Listbox />
                          </Select.Content>
                        </Select.Portal>
                      </Select>

                      <Select<OverPowerAggregationTargetOption>
                        options={OVER_POWER_AGGREGATION_TARGET_OPTIONS}
                        optionValue="value"
                        optionTextValue="label"
                        value={selectedAggregationTargetOption()}
                        onChange={handleAggregationTargetChange}
                        gutter={0}
                        itemComponent={(itemProps) => (
                          <Select.Item item={itemProps.item} class={SELECT_ITEM_CLASS}>
                            <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
                          </Select.Item>
                        )}
                      >
                        <Select.Trigger
                          class={`${SELECT_TRIGGER_CLASS} w-full sm:w-40`}
                          aria-label={OVER_POWER_CONTROL_LABELS.aggregationTarget}
                        >
                          <Select.Value<OverPowerAggregationTargetOption>>
                            {(state) => state.selectedOption()?.label}
                          </Select.Value>
                          <ChevronDown size={16} aria-hidden="true" />
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content class="z-40 max-h-64 w-(--kb-select-content-width) overflow-auto rounded border border-border bg-surface shadow-md">
                            <Select.Listbox />
                          </Select.Content>
                        </Select.Portal>
                      </Select>
                    </div>

                    <div class="ml-auto flex w-full items-center justify-between gap-1.5 sm:w-auto sm:justify-start">
                      <Button
                        type="button"
                        class="inline-flex h-10 min-w-14 items-center justify-center gap-1 rounded-full border border-border-strong bg-surface px-2 text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
                        aria-label={`${
                          nextSummaryViewMode() === 'graph'
                            ? OVER_POWER_CONTROL_LABELS.graph
                            : OVER_POWER_CONTROL_LABELS.table
                        }表示に切り替え`}
                        title={`${
                          nextSummaryViewMode() === 'graph'
                            ? OVER_POWER_CONTROL_LABELS.graph
                            : OVER_POWER_CONTROL_LABELS.table
                        }表示に切り替え`}
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

                      <div class="flex shrink-0 items-center gap-1">
                        <ToggleButton
                          pressed={excludeLockedSongs()}
                          onChange={setExcludeLockedSongs}
                          class="inline-flex h-10 items-center justify-center gap-1 rounded-full border border-border-strong bg-surface px-3 text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 data-[pressed]:border-action-primary data-[pressed]:bg-action-primary data-[pressed]:text-text-inverse"
                        >
                          <span>{OVER_POWER_LOCKED_SONG_EXCLUSION_LABEL}</span>
                          <LockKeyholeOpen class="h-5 w-5" aria-hidden="true" />
                        </ToggleButton>
                        <Button
                          type="button"
                          class={`${iconButtonClass} whitespace-nowrap`}
                          aria-label={OVER_POWER_CONTROL_LABELS.lockedSongsSettings}
                          title={OVER_POWER_CONTROL_LABELS.lockedSongsSettings}
                          disabled={lockedSongsButtonDisabled()}
                          onClick={() => setLockedSongsDialogOpen(true)}
                        >
                          <span>{OVER_POWER_CONTROL_LABELS.lockedSongs}</span>
                          <LockKeyhole class="h-5 w-5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <OverPowerSummaryTable
                          rows={[currentSummary().all]}
                          countLabel={countLabel()}
                        />
                      }
                    >
                      <OverPowerSummaryGraph rows={allGraphRows()} />
                    </Show>
                  </div>

                  <Tabs.Content value="genres" class="mt-4">
                    <Show
                      when={summaryViewMode() === 'graph'}
                      fallback={
                        <OverPowerSummaryTable
                          rows={currentSummary().genres}
                          countLabel={countLabel()}
                        />
                      }
                    >
                      <OverPowerSummaryGraph rows={genreGraphRows()} />
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
                          <OverPowerSummaryTable
                            rows={displayedLevelRows()}
                            countLabel={countLabel()}
                          />
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
                        <OverPowerSummaryTable
                          rows={currentSummary().versions}
                          countLabel={countLabel()}
                        />
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
