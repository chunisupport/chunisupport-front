import { Button } from '@kobalte/core/button'
import { Checkbox } from '@kobalte/core/checkbox'
import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { Check, CircleSlash2, Filter, LoaderCircle, Search } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import Loading from '../../../../components/Loading/Loading'
import type {
  MasterItemDTO,
  PlayerLockedSongRequest,
  PlayerLockedSongResponseItem,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../../types/api'
import { createLockedSongKey } from '../../../../usecases/overpower/lockedSongsBatch'
import { toUserFriendlyErrorMessage } from '../../../../utils/errorMessage'
import { sortMasterItemsBySortOrder } from '../../../../utils/masterData'
import {
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../../utils/searchUtils'
import {
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../../utils/versionConverter'
import GenreSection from '../../UserRecord/components/filterDialog/sections/GenreSection'
import VersionSection from '../../UserRecord/components/filterDialog/sections/VersionSection'

type Props = {
  open: boolean
  songs: SongDTO[]
  records: PlayerRecordDTO[]
  genres: MasterItemDTO[]
  versions: VersionDTO[]
  lockedSongs: PlayerLockedSongResponseItem[]
  onOpenChange: (open: boolean) => void
  onSaveLockedSongs: (items: PlayerLockedSongRequest[]) => Promise<void>
}

type LockedSongListItem = {
  song: SongDTO
  isUltima: boolean
}

type LockedSongsFilter = {
  genres: string[]
  versions: string[]
  unplayedOnly: boolean
}

const hasUltimaChart = (song: SongDTO): boolean => Boolean(song.charts.ULTIMA)

const parseOfficialIdx = (officialIdx: string | undefined): number => {
  const parsed = Number(officialIdx)
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
}

const releaseTimestamp = (release: string | null): number => {
  const parsed = Date.parse(release ?? '')
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY
}

const toggleFilterValue = (values: string[], value: string): string[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

/** チェックボックスの見た目を未解禁曲ダイアログ内で統一する Tailwind クラス。 */
const FILTER_CHECKBOX_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse'

/** ネストしたフィルターモーダル上で Select の選択肢を前面に表示する z-index クラス。 */
const NESTED_FILTER_SELECT_CONTENT_Z_INDEX_CLASS = 'z-80'

/**
 * OVER POWER計算から除外する未解禁楽曲を検索・絞り込みしながら編集するダイアログ。
 *
 * @param props - ダイアログの表示状態、楽曲・マスターデータ、未解禁楽曲、保存処理。
 * @returns 未解禁楽曲設定ダイアログのUI。
 */
const LockedSongsDialog: Component<Props> = (props) => {
  const [query, setQuery] = createSignal('')
  const [filterDialogOpen, setFilterDialogOpen] = createSignal(false)
  const [filters, setFilters] = createSignal<LockedSongsFilter>({
    genres: [],
    versions: [],
    unplayedOnly: false,
  })
  const [showLockedOnly, setShowLockedOnly] = createSignal(false)
  const [isListReady, setIsListReady] = createSignal(false)
  const [draftLockedSongKeys, setDraftLockedSongKeys] = createSignal<Set<string>>(new Set())
  const [isSaving, setIsSaving] = createSignal(false)
  const [saveError, setSaveError] = createSignal<string | null>(null)
  const genreOptions = createMemo(() =>
    sortMasterItemsBySortOrder(props.genres).map((genre) => genre.name)
  )
  const versionOptions = createMemo(() =>
    props.versions.map((version) => getShortVersionName(version.name))
  )
  const songVersionNameById = createMemo(
    () =>
      new Map(
        props.songs.map((song) => [
          song.id,
          getShortVersionName(resolveVersionNameByReleaseDate(song.release, props.versions)),
        ])
      )
  )
  const recordBySongAndDifficulty = createMemo(
    () => new Map(props.records.map((record) => [`${record.id}:${record.difficulty}`, record]))
  )
  const recordsBySongId = createMemo(() => {
    const grouped = new Map<string, PlayerRecordDTO[]>()
    for (const record of props.records) {
      const records = grouped.get(record.id) ?? []
      records.push(record)
      grouped.set(record.id, records)
    }
    return grouped
  })
  const songVersionName = (song: SongDTO): string => songVersionNameById().get(song.id) ?? '不明'
  const activeFilterCount = createMemo(
    () => filters().genres.length + filters().versions.length + (filters().unplayedOnly ? 1 : 0)
  )
  const filterButtonLabel = createMemo(() =>
    activeFilterCount() > 0 ? `フィルター ${activeFilterCount()}件` : 'フィルター'
  )
  const lockedSongKeys = createMemo(
    () =>
      new Set(
        props.lockedSongs.map((lockedSong) =>
          createLockedSongKey(lockedSong.display_id, lockedSong.is_ultima)
        )
      )
  )
  const isLocked = (displayId: string, isUltima: boolean): boolean =>
    draftLockedSongKeys().has(createLockedSongKey(displayId, isUltima))
  /**
   * 未プレイのみ表示フィルターに合致する未解禁候補かを判定する。
   *
   * @param item - 未解禁候補の曲・譜面種別。
   * @returns 未プレイ候補として表示できる場合は true。
   */
  const isUnplayedListItem = (item: LockedSongListItem): boolean => {
    if (item.isUltima) {
      return recordBySongAndDifficulty().get(`${item.song.id}:ULTIMA`)?.is_played !== true
    }

    const songRecords = recordsBySongId().get(item.song.id) ?? []
    return songRecords.length === 0 || songRecords.every((record) => !record.is_played)
  }
  const songListItems = createMemo<LockedSongListItem[]>(() =>
    props.songs
      .map((song, index) => ({ song, index }))
      .sort((left, right) => {
        const releaseComparison =
          releaseTimestamp(right.song.release) - releaseTimestamp(left.song.release)
        if (releaseComparison !== 0) return releaseComparison

        const idxComparison =
          parseOfficialIdx(right.song.official_idx) - parseOfficialIdx(left.song.official_idx)
        return idxComparison || left.index - right.index
      })
      .flatMap(({ song }) => [
        { song, isUltima: false },
        ...(hasUltimaChart(song) ? [{ song, isUltima: true }] : []),
      ])
  )
  const searchableSongListItems = createMemo(() =>
    songListItems().map((item) => {
      const chartLabel = item.isUltima ? 'ultima' : '通常 譜面'
      return {
        item,
        searchableText: normalizeForSearch(
          `${item.song.id} ${item.song.title} ${item.song.artist} ${chartLabel}`
        ),
        searchableReading: normalizeForReadingSearch(
          item.song.reading?.trim() ? item.song.reading : item.song.title
        ),
      }
    })
  )

  const filteredSongListItems = createMemo(() => {
    const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(query())
    const shouldShowLockedOnly = showLockedOnly()
    const currentFilters = filters()

    return searchableSongListItems()
      .filter(({ item, searchableText, searchableReading }) => {
        if (shouldShowLockedOnly && !isLocked(item.song.id, item.isUltima)) {
          return false
        }

        if (currentFilters.unplayedOnly && !isUnplayedListItem(item)) {
          return false
        }

        if (currentFilters.genres.length > 0 && !currentFilters.genres.includes(item.song.genre)) {
          return false
        }

        if (
          currentFilters.versions.length > 0 &&
          !currentFilters.versions.includes(songVersionName(item.song))
        ) {
          return false
        }

        if (!normalizedQuery) return true

        return (
          searchableText.includes(normalizedQuery) ||
          searchableReading.includes(normalizedReadingQuery)
        )
      })
      .map(({ item }) => item)
  })

  createEffect(() => {
    if (!props.open) return
    setDraftLockedSongKeys(new Set(lockedSongKeys()))
    setSaveError(null)
  })

  const hasChanges = createMemo(() => {
    const baseKeys = lockedSongKeys()
    const draftKeys = draftLockedSongKeys()
    if (baseKeys.size !== draftKeys.size) return true
    for (const key of baseKeys) {
      if (!draftKeys.has(key)) return true
    }
    return false
  })

  const handleToggleDraft = (displayId: string, isUltima: boolean, locked: boolean) => {
    const key = createLockedSongKey(displayId, isUltima)
    setDraftLockedSongKeys((prev) => {
      const next = new Set(prev)
      if (locked) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  /**
   * ダイアログ上の未解禁楽曲設定を保存する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleSave = async () => {
    const nextLockedSongs = [...draftLockedSongKeys()].map((key) => {
      const [displayId, mode] = key.split(':')
      return {
        display_id: displayId,
        is_ultima: mode === 'ultima',
      }
    })

    setIsSaving(true)
    setSaveError(null)
    try {
      await props.onSaveLockedSongs(nextLockedSongs)
      props.onOpenChange(false)
    } catch (error) {
      setSaveError(toUserFriendlyErrorMessage(error, '未解禁楽曲設定の保存に失敗しました。'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleGenreFilter = (genre: string) => {
    setFilters((prev) => ({ ...prev, genres: toggleFilterValue(prev.genres, genre) }))
  }

  const handleToggleVersionFilter = (version: string) => {
    setFilters((prev) => ({ ...prev, versions: toggleFilterValue(prev.versions, version) }))
  }

  /**
   * 未プレイのみ表示フィルターを切り替える。
   *
   * @param checked - 次のチェック状態。
   * @returns なし。
   */
  const handleUnplayedOnlyFilterChange = (checked: boolean) => {
    setFilters((prev) => ({ ...prev, unplayedOnly: checked }))
  }

  createEffect(() => {
    if (!props.open) {
      setIsListReady(false)
      return
    }

    setIsListReady(false)
    const timerId = window.setTimeout(() => {
      setIsListReady(true)
    }, 0)

    onCleanup(() => {
      window.clearTimeout(timerId)
    })
  })

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <div class="mb-4">
            <Dialog.Title class="text-lg font-bold">未解禁楽曲設定</Dialog.Title>
            <Dialog.Description class="mt-1 text-sm text-text-muted">
              チェックした曲・譜面はOVER POWER計算対象から除外されます。
            </Dialog.Description>
          </div>

          <div class="mb-3 flex min-w-0 items-center gap-2">
            <TextField class="min-w-0 flex-1">
              <div class="flex min-w-0 items-center gap-2 rounded border border-border-strong px-2 focus-within:border-focus-ring">
                <Search class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
                <TextField.Input
                  type="search"
                  class="min-w-0 flex-1 py-2 font-sans text-sm outline-none"
                  aria-label="未解禁楽曲検索"
                  placeholder="曲名・アーティストで検索..."
                  value={query()}
                  onInput={(event) => setQuery(event.currentTarget.value)}
                />
              </div>
            </TextField>
            <Button
              type="button"
              class={`flex h-9.5 min-w-9.5 shrink-0 items-center justify-center gap-1.5 rounded border px-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                activeFilterCount() > 0
                  ? 'border-action-primary bg-action-primary text-text-inverse hover:bg-action-primary-hover'
                  : 'border-border-strong text-text-muted hover:bg-surface-hover'
              }`}
              aria-label={filterButtonLabel()}
              aria-pressed={activeFilterCount() > 0}
              title={filterButtonLabel()}
              onClick={() => setFilterDialogOpen(true)}
            >
              <Filter size={20} aria-hidden="true" />
              <Show when={activeFilterCount() > 0}>
                <span class="text-xs font-medium">{activeFilterCount()}</span>
              </Show>
            </Button>
            <Button
              type="button"
              class={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                showLockedOnly()
                  ? 'border-action-primary bg-action-primary text-text-inverse hover:bg-action-primary-hover'
                  : 'border-border-strong text-text-muted hover:bg-surface-hover'
              }`}
              aria-label="選択済み楽曲のみ表示"
              aria-pressed={showLockedOnly()}
              title="選択済み楽曲のみ表示"
              onClick={() => setShowLockedOnly((value) => !value)}
            >
              <Check size={24} aria-hidden="true" />
            </Button>
          </div>

          <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
            <span>
              {props.lockedSongs.length}件設定中 / {filteredSongListItems().length}件表示
            </span>
            <span>通常未解禁は曲単位、ULTIMA未解禁はULTIMA譜面のみ除外</span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto rounded border border-border">
            <Show
              when={isListReady()}
              fallback={
                <div
                  class="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-8 text-sm text-text-subtle"
                  role="status"
                  aria-label="読み込み中"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <Loading />
                </div>
              }
            >
              <Show
                when={filteredSongListItems().length > 0}
                fallback={
                  <div class="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-8 text-sm text-text-subtle">
                    <CircleSlash2 class="h-6 w-6" aria-hidden="true" />
                    <p>該当する曲がありません</p>
                  </div>
                }
              >
                <ul class="divide-y divide-border">
                  <For each={filteredSongListItems()}>
                    {(item) => {
                      const selected = () => isLocked(item.song.id, item.isUltima)

                      return (
                        <li>
                          <Button
                            type="button"
                            class={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected()
                                ? 'bg-success text-text-inverse hover:bg-success'
                                : 'bg-surface text-text hover:bg-surface-muted'
                            }`}
                            aria-pressed={selected()}
                            aria-label={`${item.song.title} ${item.isUltima ? 'ULTIMA' : '通常'}の未解禁設定を切り替え`}
                            disabled={isSaving()}
                            onClick={() =>
                              handleToggleDraft(item.song.id, item.isUltima, !selected())
                            }
                          >
                            <div class="min-w-0">
                              <div class="flex min-w-0 items-center gap-2">
                                <p class="truncate font-sans text-sm font-medium">
                                  {item.song.title}
                                </p>
                                <Show when={item.isUltima}>
                                  <span
                                    class={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                                      selected()
                                        ? 'bg-surface/20 text-text-inverse'
                                        : 'bg-danger-bg text-danger'
                                    }`}
                                  >
                                    ULTIMA
                                  </span>
                                </Show>
                              </div>
                              <p
                                class={`truncate font-sans text-xs ${
                                  selected() ? 'text-text-inverse/80' : 'text-text-subtle'
                                }`}
                              >
                                {item.song.artist}
                              </p>
                            </div>
                            <span
                              class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                selected() ? 'bg-surface/20 opacity-100' : 'opacity-0'
                              }`}
                              aria-hidden="true"
                            >
                              <Check class="h-4 w-4" />
                            </span>
                          </Button>
                        </li>
                      )
                    }}
                  </For>
                </ul>
              </Show>
            </Show>
          </div>

          <Show when={saveError()}>
            {(message) => <p class="mt-3 text-sm text-danger">{message()}</p>}
          </Show>

          <Dialog open={filterDialogOpen()} onOpenChange={setFilterDialogOpen}>
            <Dialog.Portal>
              <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
              <Dialog.Content class="fixed inset-x-4 top-1/2 z-70 flex max-h-[80dvh] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-md sm:-translate-x-1/2 sm:p-6">
                <div class="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Title class="text-lg font-bold">フィルター</Dialog.Title>
                  </div>
                  <Dialog.CloseButton class="shrink-0 rounded border border-border-strong px-3 py-1 text-sm hover:bg-surface-muted">
                    閉じる
                  </Dialog.CloseButton>
                </div>

                <div class="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
                  <GenreSection
                    genres={genreOptions()}
                    selected={filters().genres}
                    contentZIndexClass={NESTED_FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
                    onToggle={handleToggleGenreFilter}
                    onSelectAll={() => setFilters((prev) => ({ ...prev, genres: genreOptions() }))}
                    onClear={() => setFilters((prev) => ({ ...prev, genres: [] }))}
                  />

                  <VersionSection
                    versions={versionOptions()}
                    selected={filters().versions}
                    contentZIndexClass={NESTED_FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
                    onToggle={handleToggleVersionFilter}
                    onSelectAll={() =>
                      setFilters((prev) => ({ ...prev, versions: versionOptions() }))
                    }
                    onClear={() => setFilters((prev) => ({ ...prev, versions: [] }))}
                  />

                  <section>
                    <Checkbox
                      checked={filters().unplayedOnly}
                      onChange={handleUnplayedOnlyFilterChange}
                      class="relative flex items-center gap-2"
                    >
                      <Checkbox.Input
                        id="locked-song-filter-unplayed-only"
                        style={{ left: '0', top: '0' }}
                      />
                      <Checkbox.Control class={FILTER_CHECKBOX_CONTROL_CLASS}>
                        <Checkbox.Indicator>
                          <Check class="h-4 w-4" />
                        </Checkbox.Indicator>
                      </Checkbox.Control>
                      <Checkbox.Label
                        class="min-w-0 leading-5"
                        for="locked-song-filter-unplayed-only"
                      >
                        未プレイのみ表示
                      </Checkbox.Label>
                    </Checkbox>
                  </section>
                </div>

                <div class="mt-4 flex justify-between gap-2">
                  <Button
                    type="button"
                    class="rounded border border-border-strong px-3 py-2 text-sm text-text-muted hover:bg-surface-muted"
                    onClick={() => setFilters({ genres: [], versions: [], unplayedOnly: false })}
                  >
                    すべて解除
                  </Button>
                  <Dialog.CloseButton class="rounded bg-action-primary px-3 py-2 text-sm text-text-inverse hover:bg-action-primary-hover">
                    適用
                  </Dialog.CloseButton>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>

          <div class="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              class="rounded border border-border-strong px-3 py-2 text-sm text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => props.onOpenChange(false)}
              disabled={isSaving()}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              class="inline-flex items-center gap-2 rounded bg-action-primary px-3 py-2 text-sm text-text-inverse hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSave}
              disabled={!hasChanges() || isSaving()}
            >
              <Show when={isSaving()}>
                <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
              </Show>
              保存
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default LockedSongsDialog
