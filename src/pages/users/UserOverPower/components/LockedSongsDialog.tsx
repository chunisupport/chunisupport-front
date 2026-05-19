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
  SongDTO,
  VersionDTO,
} from '../../../../types/api'
import { createLockedSongKey } from '../../../../usecases/overpower/lockedSongsBatch'
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

type Props = {
  open: boolean
  songs: SongDTO[]
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

const LockedSongsDialog: Component<Props> = (props) => {
  const [query, setQuery] = createSignal('')
  const [filterDialogOpen, setFilterDialogOpen] = createSignal(false)
  const [filters, setFilters] = createSignal<LockedSongsFilter>({ genres: [], versions: [] })
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
  const songVersionName = (song: SongDTO): string => songVersionNameById().get(song.id) ?? '不明'
  const activeFilterCount = createMemo(() => filters().genres.length + filters().versions.length)
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
      setSaveError(error instanceof Error ? error.message : '未解禁楽曲設定の保存に失敗しました')
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
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col rounded-lg bg-white p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title class="text-lg font-bold">未解禁楽曲設定</Dialog.Title>
              <Dialog.Description class="mt-1 text-sm text-gray-600">
                チェックした曲・譜面はOVER POWER計算対象から除外されます。
              </Dialog.Description>
            </div>
            <Dialog.CloseButton class="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 shrink-0">
              閉じる
            </Dialog.CloseButton>
          </div>

          <div class="mb-3 flex items-center gap-2">
            <TextField class="flex-1">
              <div class="flex items-center gap-2 rounded border border-gray-300 px-2 focus-within:border-primary-500">
                <Search class="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
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
            <button
              type="button"
              class={`flex h-[38px] min-w-[38px] items-center justify-center gap-1.5 rounded border px-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                activeFilterCount() > 0
                  ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700'
                  : 'border-gray-500 text-gray-700 hover:bg-gray-100'
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
            </button>
            <button
              type="button"
              class={`flex h-[38px] w-[38px] items-center justify-center rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                showLockedOnly()
                  ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700'
                  : 'border-gray-500 text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="チェック済み楽曲のみ表示"
              aria-pressed={showLockedOnly()}
              title="チェック済み楽曲のみ表示"
              onClick={() => setShowLockedOnly((value) => !value)}
            >
              <Check size={24} aria-hidden="true" />
            </button>
          </div>

          <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              {props.lockedSongs.length}件設定中 / {filteredSongListItems().length}件表示
            </span>
            <span>通常未解禁は曲単位、ULTIMA未解禁はULTIMA譜面のみ除外</span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto rounded border border-gray-200">
            <Show
              when={isListReady()}
              fallback={
                <div
                  class="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-8 text-sm text-gray-500"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <Loading />
                  <span class="sr-only">読み込み中</span>
                </div>
              }
            >
              <Show
                when={filteredSongListItems().length > 0}
                fallback={
                  <div class="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-8 text-sm text-gray-500">
                    <CircleSlash2 class="h-6 w-6" aria-hidden="true" />
                    <p>該当する曲がありません</p>
                  </div>
                }
              >
                <ul class="divide-y divide-gray-200">
                  <For each={filteredSongListItems()}>
                    {(item) => {
                      const selected = () => isLocked(item.song.id, item.isUltima)

                      return (
                        <li>
                          <button
                            type="button"
                            class={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected()
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-white text-gray-900 hover:bg-gray-50'
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
                                        ? 'bg-white/20 text-white'
                                        : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    ULTIMA
                                  </span>
                                </Show>
                              </div>
                              <p
                                class={`truncate font-sans text-xs ${
                                  selected() ? 'text-white/80' : 'text-gray-500'
                                }`}
                              >
                                {item.song.artist}
                              </p>
                            </div>
                            <span
                              class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                selected() ? 'bg-white/20 opacity-100' : 'opacity-0'
                              }`}
                              aria-hidden="true"
                            >
                              <Check class="h-4 w-4" />
                            </span>
                          </button>
                        </li>
                      )
                    }}
                  </For>
                </ul>
              </Show>
            </Show>
          </div>

          <Show when={saveError()}>
            {(message) => <p class="mt-3 text-sm text-red-600">{message()}</p>}
          </Show>

          <Dialog open={filterDialogOpen()} onOpenChange={setFilterDialogOpen}>
            <Dialog.Portal>
              <Dialog.Overlay class="fixed inset-0 z-60 bg-black/30" />
              <Dialog.Content class="fixed inset-x-4 top-1/2 z-70 flex max-h-[80dvh] -translate-y-1/2 flex-col rounded-lg bg-white p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-md sm:-translate-x-1/2 sm:p-6">
                <div class="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Title class="text-lg font-bold">フィルター</Dialog.Title>
                  </div>
                  <Dialog.CloseButton class="shrink-0 rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                    閉じる
                  </Dialog.CloseButton>
                </div>

                <div class="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
                  <section>
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <h3 class="font-bold">ジャンル</h3>
                      <button
                        type="button"
                        class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        onClick={() => setFilters((prev) => ({ ...prev, genres: [] }))}
                      >
                        解除
                      </button>
                    </div>
                    <div class="grid gap-2">
                      <For each={genreOptions()}>
                        {(genre, index) => {
                          const id = `locked-song-filter-genre-${index()}`
                          return (
                            <Checkbox
                              checked={filters().genres.includes(genre)}
                              onChange={() => handleToggleGenreFilter(genre)}
                              class="flex items-center gap-2"
                            >
                              <Checkbox.Input id={id} />
                              <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-50 data-checked:border-primary-600 data-checked:bg-primary-600 data-checked:text-white">
                                <Checkbox.Indicator>
                                  <Check class="h-4 w-4" />
                                </Checkbox.Indicator>
                              </Checkbox.Control>
                              <Checkbox.Label class="min-w-0 leading-5" for={id}>
                                {genre}
                              </Checkbox.Label>
                            </Checkbox>
                          )
                        }}
                      </For>
                    </div>
                  </section>

                  <section>
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <h3 class="font-bold">バージョン</h3>
                      <button
                        type="button"
                        class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        onClick={() => setFilters((prev) => ({ ...prev, versions: [] }))}
                      >
                        解除
                      </button>
                    </div>
                    <div class="grid gap-2">
                      <For each={versionOptions()}>
                        {(version, index) => {
                          const id = `locked-song-filter-version-${index()}`
                          return (
                            <Checkbox
                              checked={filters().versions.includes(version)}
                              onChange={() => handleToggleVersionFilter(version)}
                              class="flex items-center gap-2"
                            >
                              <Checkbox.Input id={id} />
                              <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-50 data-checked:border-primary-600 data-checked:bg-primary-600 data-checked:text-white">
                                <Checkbox.Indicator>
                                  <Check class="h-4 w-4" />
                                </Checkbox.Indicator>
                              </Checkbox.Control>
                              <Checkbox.Label class="min-w-0 leading-5" for={id}>
                                {version}
                              </Checkbox.Label>
                            </Checkbox>
                          )
                        }}
                      </For>
                    </div>
                  </section>
                </div>

                <div class="mt-4 flex justify-between gap-2">
                  <button
                    type="button"
                    class="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setFilters({ genres: [], versions: [] })}
                  >
                    すべて解除
                  </button>
                  <Dialog.CloseButton class="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700">
                    適用
                  </Dialog.CloseButton>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>

          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => props.onOpenChange(false)}
              disabled={isSaving()}
            >
              キャンセル
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSave}
              disabled={!hasChanges() || isSaving()}
            >
              <Show when={isSaving()}>
                <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
              </Show>
              保存
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default LockedSongsDialog
