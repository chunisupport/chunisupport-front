import { Select } from '@kobalte/core/select'
import * as Tabs from '@kobalte/core/tabs'
import { useLocation, useNavigate } from '@solidjs/router'
import { Check, ChevronDown, LockKeyhole } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, Show, Suspense } from 'solid-js'
import { fetchAllSongs, fetchMasterData, fetchVersions } from '../../../api/songs'
import { addMyLockedSong, deleteMyLockedSong, fetchUserLockedSongs } from '../../../api/users'
import { Loading } from '../../../components'
import { authSession } from '../../../stores/authSession'
import type { UserRecordDTO } from '../../../types/api'
import { buildOverPowerSummary } from '../../../usecases/overpower/overpowerSummary'
import { buildUserOverPowerPagePath, type OverPowerSubPage } from '../UserPage/profilePageQuery'
import LockedSongsDialog from './components/LockedSongsDialog'
import { OverPowerAllSummary } from './components/OverPowerAllSummary'
import { OverPowerSummaryTable } from './components/OverPowerSummaryTable'

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

const UserOverPower: Component<Props> = (props) => {
  const [allSongs] = createResource(fetchAllSongs)
  const [masterData] = createResource(fetchMasterData)
  const [versionData] = createResource(fetchVersions)
  const canManageLockedSongs = createMemo(
    () => authSession.status === 'authenticated' && authSession.user?.username === props.username
  )
  const [lockedSongs, { refetch: refetchLockedSongs }] = createResource(
    () => props.username,
    fetchUserLockedSongs
  )
  const [showLowLevels, setShowLowLevels] = createSignal(false)
  const [lockedSongsDialogOpen, setLockedSongsDialogOpen] = createSignal(false)
  const [savingLockedSongKey, setSavingLockedSongKey] = createSignal<string | null>(null)
  const [lockedSongsError, setLockedSongsError] = createSignal<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const selectedSummaryTab = createMemo<OverPowerSummaryTab>(
    () => overPowerSummaryTabBySubPage[props.selectedSubPage]
  )

  const summary = createMemo(() => {
    const songs = allSongs()
    const md = masterData()
    const versions = versionData()
    const currentLockedSongs = lockedSongs()
    if (!songs || !md || !versions || !currentLockedSongs) return undefined
    return buildOverPowerSummary(
      songs.songs,
      props.record.all,
      versions.versions,
      currentLockedSongs.items,
      md.genres
    )
  })

  const highLevelRows = createMemo(() => summary()?.levels.filter((row) => !row.isLowLevel) ?? [])
  const lowLevelRows = createMemo(() => summary()?.levels.filter((row) => row.isLowLevel) ?? [])
  const iconButtonClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-gray-400'
  const lockedSongsButtonDisabled = createMemo(
    () => !canManageLockedSongs() || !allSongs() || lockedSongs.loading
  )
  const createLockedSongKey = (displayId: string, isUltima: boolean) =>
    `${displayId}:${isUltima ? 'ultima' : 'normal'}`

  const handleSummaryTabChange = (value: string) => {
    if (
      value !== 'genres' &&
      value !== 'difficulties' &&
      value !== 'levels' &&
      value !== 'versions'
    ) {
      return
    }

    const queryParams = new URLSearchParams(location.search)
    queryParams.delete('page')
    const queryString = queryParams.toString()
    const normalizedPath = buildUserOverPowerPagePath(
      props.username,
      overPowerSubPageBySummaryTab[value]
    )

    navigate(`${normalizedPath}${queryString ? `?${queryString}` : ''}${location.hash}`)
  }

  const handleToggleLockedSong = async (displayId: string, isUltima: boolean, locked: boolean) => {
    const key = createLockedSongKey(displayId, isUltima)
    setSavingLockedSongKey(key)
    setLockedSongsError(null)

    try {
      if (locked) {
        await addMyLockedSong({ display_id: displayId, is_ultima: isUltima })
      } else {
        await deleteMyLockedSong({ display_id: displayId, is_ultima: isUltima })
      }
      await refetchLockedSongs()
    } catch (error) {
      setLockedSongsError(
        error instanceof Error ? error.message : '未解禁楽曲設定の更新に失敗しました'
      )
    } finally {
      setSavingLockedSongKey(null)
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={summary()} fallback={<Loading />}>
          {(currentSummary) => (
            <div class="mx-4 flex flex-col gap-4 text-sm">
              <OverPowerAllSummary summary={currentSummary().all} />

              <Tabs.Root value={selectedSummaryTab()}>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <Select<OverPowerSummaryOption>
                    options={OVER_POWER_SUMMARY_OPTIONS}
                    optionValue="value"
                    optionTextValue="label"
                    value={selectedSummaryTab()}
                    onChange={handleSummaryTabChange}
                    placeholder="集計軸を選択"
                    itemComponent={(props) => (
                      <Select.Item
                        item={props.item}
                        class="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50 data-[selected]:bg-green-50"
                      >
                        <div class="flex items-center gap-2">
                          <span class="inline-flex w-4 justify-center text-green-700">
                            <Select.ItemIndicator>
                              <Check size={14} />
                            </Select.ItemIndicator>
                          </span>
                          <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
                        </div>
                      </Select.Item>
                    )}
                  >
                    <Select.Trigger class="grid min-w-52 grid-cols-[1fr_auto] items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700">
                      <Select.Value<OverPowerSummaryOption> class="truncate">
                        {(state) => <span>{state.selectedOption()?.label ?? '集計軸を選択'}</span>}
                      </Select.Value>
                      <span class="justify-self-end text-gray-500" aria-hidden="true">
                        <ChevronDown size={16} />
                      </span>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content class="z-50 mt-1 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-gray-200 bg-white shadow-md">
                        <Select.Listbox />
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                  <button
                    type="button"
                    class={iconButtonClass}
                    aria-label="未解禁楽曲設定"
                    title="未解禁楽曲設定"
                    disabled={lockedSongsButtonDisabled()}
                    onClick={() => setLockedSongsDialogOpen(true)}
                  >
                    <LockKeyhole class="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <Show when={lockedSongsError()}>
                  {(message) => (
                    <p class="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {message()}
                    </p>
                  )}
                </Show>

                <Tabs.Content value="genres" class="mt-4">
                  <OverPowerSummaryTable rows={currentSummary().genres} countLabel="曲数" />
                </Tabs.Content>

                <Tabs.Content value="difficulties" class="mt-4">
                  <OverPowerSummaryTable rows={currentSummary().difficulties} countLabel="譜面数" />
                </Tabs.Content>

                <Tabs.Content value="levels" class="mt-4">
                  <div class="flex flex-col gap-4">
                    <OverPowerSummaryTable rows={highLevelRows()} countLabel="曲数" />
                    <Show when={lowLevelRows().length > 0}>
                      <section>
                        <button
                          type="button"
                          class="mb-2 flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                          aria-expanded={showLowLevels()}
                          onClick={() => setShowLowLevels((value) => !value)}
                        >
                          <span>レベル10未満</span>
                          <ChevronDown
                            class={`h-4 w-4 transition-transform ${
                              showLowLevels() ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                        <Show when={showLowLevels()}>
                          <OverPowerSummaryTable rows={lowLevelRows()} countLabel="曲数" />
                        </Show>
                      </section>
                    </Show>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="versions" class="mt-4">
                  <OverPowerSummaryTable rows={currentSummary().versions} countLabel="曲数" />
                </Tabs.Content>
              </Tabs.Root>

              <Show when={canManageLockedSongs() && allSongs() && lockedSongs()}>
                <LockedSongsDialog
                  open={lockedSongsDialogOpen()}
                  songs={allSongs()?.songs ?? []}
                  lockedSongs={lockedSongs()?.items ?? []}
                  savingKey={savingLockedSongKey()}
                  onOpenChange={setLockedSongsDialogOpen}
                  onToggleLockedSong={handleToggleLockedSong}
                />
              </Show>
            </div>
          )}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default UserOverPower
