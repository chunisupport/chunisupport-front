import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { CircleSlash2, Funnel, ListChecks, LoaderCircle, Search, Star } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import MultiSelectDropdown from '../../../../components/common/MultiSelectDropdown'
import Loading from '../../../../components/Loading/Loading'
import type {
  MasterItemDTO,
  PlayerFavoriteSongResponseItem,
  SongDTO,
  VersionDTO,
} from '../../../../types/api'
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
import {
  buildDefaultSongSelectionFilter,
  hasSongSelectionFilterChanges,
  type SongSelectionFilter,
  sortSongSelectionCandidates,
} from '../../components/songSelectionDialog'
import { toggleArray } from '../../utils/filterValue'

type Props = {
  open: boolean
  songs: SongDTO[]
  genres: MasterItemDTO[]
  versions: VersionDTO[]
  favoriteSongs: PlayerFavoriteSongResponseItem[]
  onOpenChange: (open: boolean) => void
  onSave: (displayIds: string[]) => Promise<void>
}

const FAVORITE_SONG_LIMIT = 100
const FAVORITE_SONG_DESCRIPTION = `お気に入りは${FAVORITE_SONG_LIMIT}曲まで登録できます。`
const FILTER_SELECT_CONTENT_Z_INDEX_CLASS = 'z-80'
const FILTER_DIALOG_BUTTON_CLASS = {
  secondary:
    'rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover',
  primary:
    'rounded bg-action-primary px-4 py-2 text-sm text-text-inverse hover:bg-action-primary-hover',
} as const

/**
 * お気に入り楽曲を検索・絞り込みして編集するダイアログ。
 *
 * @param props - 楽曲、フィルター選択肢、現在値、保存処理。
 * @returns お気に入り楽曲設定UI。
 */
const FavoriteSongsDialog: Component<Props> = (props) => {
  const [query, setQuery] = createSignal('')
  const [filterDialogOpen, setFilterDialogOpen] = createSignal(false)
  const [showSelectedOnly, setShowSelectedOnly] = createSignal(false)
  const [isListReady, setIsListReady] = createSignal(false)
  const [filterInitialized, setFilterInitialized] = createSignal(false)
  const [filters, setFilters] = createSignal<SongSelectionFilter>({ genres: [], versions: [] })
  const [draftIds, setDraftIds] = createSignal<Set<string>>(new Set())
  const [isSaving, setIsSaving] = createSignal(false)
  const [saveError, setSaveError] = createSignal<string | null>(null)

  const genreOptions = createMemo(() =>
    sortMasterItemsBySortOrder(props.genres).map((genre) => genre.name)
  )
  const versionOptions = createMemo(() =>
    props.versions.map((version) => getShortVersionName(version.name))
  )
  const defaultFilter = createMemo(() =>
    buildDefaultSongSelectionFilter(genreOptions(), versionOptions())
  )
  const filterChanged = createMemo(() => hasSongSelectionFilterChanges(filters(), defaultFilter()))
  const hasQuery = createMemo(() => query().trim().length > 0)
  const originalIds = createMemo(() => new Set(props.favoriteSongs.map((item) => item.display_id)))
  const selectedCount = createMemo(() => draftIds().size)
  const songVersionById = createMemo(
    () =>
      new Map(
        props.songs.map((song) => [
          song.id,
          getShortVersionName(resolveVersionNameByReleaseDate(song.release, props.versions)),
        ])
      )
  )
  const searchableSongs = createMemo(() =>
    sortSongSelectionCandidates(props.songs).map((song) => ({
      song,
      searchableText: normalizeForSearch(`${song.id} ${song.title} ${song.artist}`),
      searchableReading: normalizeForReadingSearch(
        song.reading?.trim() ? song.reading : song.title
      ),
    }))
  )
  const filteredSongs = createMemo(() => {
    const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(query())
    const currentFilters = filters()

    return searchableSongs()
      .filter(({ song, searchableText, searchableReading }) => {
        if (showSelectedOnly() && !draftIds().has(song.id)) return false
        if (!currentFilters.genres.includes(song.genre)) return false
        if (!currentFilters.versions.includes(songVersionById().get(song.id) ?? '不明'))
          return false
        if (!normalizedQuery) return true
        return (
          searchableText.includes(normalizedQuery) ||
          searchableReading.includes(normalizedReadingQuery)
        )
      })
      .map(({ song }) => song)
  })
  const changed = createMemo(() => {
    const original = originalIds()
    const draft = draftIds()
    if (original.size !== draft.size) return true
    return [...original].some((id) => !draft.has(id))
  })

  createEffect(() => {
    if (filterInitialized() || genreOptions().length === 0 || versionOptions().length === 0) return
    setFilters(defaultFilter())
    setFilterInitialized(true)
  })

  createEffect<boolean>((wasOpen = false) => {
    const open = props.open
    if (open && !wasOpen) {
      setDraftIds(new Set(originalIds()))
      setSaveError(null)
    }
    return open
  })

  createEffect(() => {
    if (!props.open) {
      setIsListReady(false)
      return
    }
    const timerId = window.setTimeout(() => setIsListReady(true), 0)
    onCleanup(() => window.clearTimeout(timerId))
  })

  /**
   * 楽曲の選択状態を切り替える。
   *
   * @param displayId - 対象楽曲ID。
   * @returns なし。
   */
  const toggleFavorite = (displayId: string): void => {
    setDraftIds((current) => {
      const next = new Set(current)
      if (next.has(displayId)) {
        next.delete(displayId)
      } else if (next.size < FAVORITE_SONG_LIMIT) {
        next.add(displayId)
      }
      return next
    })
  }

  /**
   * 編集したお気に入り楽曲を保存する。
   *
   * @returns 保存完了時に解決されるPromise。
   */
  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await props.onSave([...draftIds()])
      props.onOpenChange(false)
    } catch (error) {
      setDraftIds(new Set(originalIds()))
      setSaveError(toUserFriendlyErrorMessage(error, 'お気に入り楽曲設定の保存に失敗しました。'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <div class="mb-4 shrink-0">
            <Dialog.Title class="text-lg font-bold">お気に入り楽曲設定</Dialog.Title>
            <Dialog.Description class="mt-1 text-sm text-text-muted">
              {FAVORITE_SONG_DESCRIPTION}
            </Dialog.Description>
          </div>

          <div class="mb-3 flex min-w-0 shrink-0 items-center">
            <TextField class="min-w-0 flex-1">
              <div
                class={`flex min-w-0 items-center gap-2 rounded-l border px-2 transition-colors ${
                  hasQuery()
                    ? 'border-action-primary bg-success-bg'
                    : 'border-border-strong focus-within:border-focus-ring'
                }`}
              >
                <Search
                  class={`h-4 w-4 shrink-0 ${hasQuery() ? 'text-success' : 'text-text-subtle'}`}
                  aria-hidden="true"
                />
                <TextField.Input
                  type="search"
                  class="min-w-0 flex-1 bg-transparent py-2 font-sans text-sm outline-none"
                  aria-label="お気に入り楽曲検索"
                  placeholder="曲名・アーティストで検索..."
                  value={query()}
                  onInput={(event) => setQuery(event.currentTarget.value)}
                />
              </div>
            </TextField>
            <Button
              type="button"
              class={`-ml-px flex h-9.5 w-9.5 shrink-0 items-center justify-center border focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring ${
                filterChanged()
                  ? 'border-action-primary bg-action-primary text-text-inverse'
                  : 'border-border-strong text-text-muted hover:bg-surface-hover'
              }`}
              aria-label={filterChanged() ? 'フィルター適用中' : 'フィルター'}
              aria-pressed={filterChanged()}
              title={filterChanged() ? 'フィルター適用中' : 'フィルター'}
              onClick={() => setFilterDialogOpen(true)}
            >
              <Funnel size={20} aria-hidden="true" />
            </Button>
            <Button
              type="button"
              class={`-ml-px flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-r border focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring ${
                showSelectedOnly()
                  ? 'border-action-primary bg-action-primary text-text-inverse'
                  : 'border-border-strong text-text-muted hover:bg-surface-hover'
              }`}
              aria-label="選択済み楽曲のみ表示"
              aria-pressed={showSelectedOnly()}
              onClick={() => setShowSelectedOnly((value) => !value)}
            >
              <ListChecks size={24} aria-hidden="true" />
            </Button>
          </div>

          <div class="mb-2 shrink-0 text-xs text-text-subtle" aria-live="polite">
            {selectedCount()} / {FAVORITE_SONG_LIMIT}曲選択中・{filteredSongs().length}曲表示
          </div>

          <div class="min-h-0 flex-1 basis-0 overflow-y-auto rounded border border-border">
            <Show
              when={isListReady()}
              fallback={
                <div
                  class="flex h-full min-h-32 items-center justify-center"
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
                when={filteredSongs().length > 0}
                fallback={
                  <div class="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-8 text-text-subtle">
                    <CircleSlash2 class="h-6 w-6" aria-hidden="true" />
                    <p>該当する曲がありません</p>
                  </div>
                }
              >
                <ul class="divide-y divide-border">
                  <For each={filteredSongs()}>
                    {(song) => {
                      const selected = () => draftIds().has(song.id)
                      const limitReached = () =>
                        !selected() && selectedCount() >= FAVORITE_SONG_LIMIT
                      return (
                        <li>
                          <Button
                            type="button"
                            class={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected()
                                ? 'bg-success text-text-inverse hover:bg-success'
                                : 'bg-surface text-text hover:bg-surface-muted'
                            }`}
                            aria-pressed={selected()}
                            aria-label={`${song.title}のお気に入り設定を切り替え`}
                            title={
                              limitReached()
                                ? `お気に入りは${FAVORITE_SONG_LIMIT}曲までです`
                                : undefined
                            }
                            disabled={isSaving() || limitReached()}
                            onClick={() => toggleFavorite(song.id)}
                          >
                            <div class="min-w-0">
                              <p class="truncate font-sans text-sm font-medium">{song.title}</p>
                              <p
                                class={`truncate font-sans text-xs ${
                                  selected() ? 'text-text-inverse/80' : 'text-text-subtle'
                                }`}
                              >
                                {song.artist}
                              </p>
                            </div>
                            <span
                              class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                selected() ? 'bg-surface/20 opacity-100' : 'opacity-0'
                              }`}
                              aria-hidden="true"
                            >
                              <Star class="h-4 w-4 fill-current" />
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
            {(message) => <p class="mt-3 shrink-0 text-sm text-danger">{message()}</p>}
          </Show>

          <Dialog
            open={filterDialogOpen()}
            onOpenChange={setFilterDialogOpen}
            preventScroll={false}
          >
            <Dialog.Portal>
              <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
              <Dialog.Content class="fixed inset-x-4 top-1/2 z-70 flex max-h-[80dvh] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-md sm:-translate-x-1/2 sm:p-6">
                <div class="mb-4 flex shrink-0 items-center justify-between gap-3">
                  <Dialog.Title class="text-lg font-bold">フィルター</Dialog.Title>
                  <Button
                    type="button"
                    class={FILTER_DIALOG_BUTTON_CLASS.secondary}
                    onClick={() => setFilters(defaultFilter())}
                  >
                    すべて選択
                  </Button>
                </div>
                <div class="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
                  <div>
                    <span class="mb-1 block font-medium">ジャンル</span>
                    <MultiSelectDropdown
                      options={genreOptions()}
                      selected={filters().genres}
                      placeholder="ジャンルを選択"
                      contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
                      onToggle={(genre) =>
                        setFilters((current) => ({
                          ...current,
                          genres: toggleArray(current.genres, genre),
                        }))
                      }
                      onSelectAll={() =>
                        setFilters((current) => ({ ...current, genres: genreOptions() }))
                      }
                      onClear={() => setFilters((current) => ({ ...current, genres: [] }))}
                    />
                  </div>
                  <div>
                    <span class="mb-1 block font-medium">バージョン</span>
                    <MultiSelectDropdown
                      options={versionOptions()}
                      selected={filters().versions}
                      placeholder="バージョンを選択"
                      contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
                      onToggle={(version) =>
                        setFilters((current) => ({
                          ...current,
                          versions: toggleArray(current.versions, version),
                        }))
                      }
                      onSelectAll={() =>
                        setFilters((current) => ({ ...current, versions: versionOptions() }))
                      }
                      onClear={() => setFilters((current) => ({ ...current, versions: [] }))}
                    />
                  </div>
                </div>
                <div class="mt-6 flex justify-end">
                  <Dialog.CloseButton class={FILTER_DIALOG_BUTTON_CLASS.primary}>
                    適用
                  </Dialog.CloseButton>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>

          <div class="mt-4 flex shrink-0 justify-end gap-2">
            <Button
              type="button"
              class="rounded border border-border-strong px-3 py-2 text-sm text-text-muted hover:bg-surface-muted disabled:opacity-60"
              onClick={() => props.onOpenChange(false)}
              disabled={isSaving()}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              class="inline-flex items-center gap-2 rounded bg-action-primary px-3 py-2 text-sm text-text-inverse hover:bg-action-primary-hover disabled:opacity-60"
              onClick={handleSave}
              disabled={!changed() || isSaving()}
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

export default FavoriteSongsDialog
