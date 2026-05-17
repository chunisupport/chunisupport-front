import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { Check, CircleSlash2, Search } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import Loading from '../../../../components/Loading/Loading'
import type { PlayerLockedSongResponseItem, SongDTO } from '../../../../types/api'
import {
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../../utils/searchUtils'

type Props = {
  open: boolean
  songs: SongDTO[]
  lockedSongs: PlayerLockedSongResponseItem[]
  savingKey: string | null
  onOpenChange: (open: boolean) => void
  onToggleLockedSong: (displayId: string, isUltima: boolean, locked: boolean) => void
}

type LockedSongListItem = {
  song: SongDTO
  isUltima: boolean
}

const createLockedSongKey = (displayId: string, isUltima: boolean): string =>
  `${displayId}:${isUltima ? 'ultima' : 'normal'}`

const hasUltimaChart = (song: SongDTO): boolean => Boolean(song.charts.ULTIMA)

const LockedSongsDialog: Component<Props> = (props) => {
  const [query, setQuery] = createSignal('')
  const [showLockedOnly, setShowLockedOnly] = createSignal(false)
  const [isListReady, setIsListReady] = createSignal(false)
  const lockedSongKeys = createMemo(
    () =>
      new Set(
        props.lockedSongs.map((lockedSong) =>
          createLockedSongKey(lockedSong.display_id, lockedSong.is_ultima)
        )
      )
  )
  const isLocked = (displayId: string, isUltima: boolean): boolean =>
    lockedSongKeys().has(createLockedSongKey(displayId, isUltima))
  const songListItems = createMemo<LockedSongListItem[]>(() =>
    props.songs.flatMap((song) => [
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

    return searchableSongListItems()
      .filter(({ item, searchableText, searchableReading }) => {
        if (shouldShowLockedOnly && !isLocked(item.song.id, item.isUltima)) {
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
  const isSaving = (displayId: string, isUltima: boolean): boolean =>
    props.savingKey === createLockedSongKey(displayId, isUltima)

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
            <Dialog.CloseButton class="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
              閉じる
            </Dialog.CloseButton>
          </div>

          <div class="mb-3 flex items-center gap-2">
            <TextField class="flex-1">
              <div class="flex items-center gap-2 rounded border border-gray-300 px-2 focus-within:border-primary-500">
                <Search class="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                <TextField.Input
                  class="min-w-0 flex-1 py-2 text-sm outline-none"
                  aria-label="未解禁楽曲検索"
                  placeholder="曲名・アーティストで検索..."
                  value={query()}
                  onInput={(event) => setQuery(event.currentTarget.value)}
                />
              </div>
            </TextField>
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
                    <p>該当する曲がありません。</p>
                  </div>
                }
              >
                <ul class="divide-y divide-gray-200">
                  <For each={filteredSongListItems()}>
                    {(item) => (
                      <li class="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div class="min-w-0">
                          <div class="flex min-w-0 items-center gap-2">
                            <p class="truncate font-sans font-medium text-gray-900">
                              {item.song.title}
                            </p>
                            <span
                              class={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                                item.isUltima
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {item.isUltima ? 'ULTIMA' : '通常'}
                            </span>
                          </div>
                          <p class="truncate font-sans text-xs text-gray-500">{item.song.artist}</p>
                        </div>
                        <div class="flex shrink-0 flex-wrap gap-3">
                          <label class="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              class="h-4 w-4"
                              checked={isLocked(item.song.id, item.isUltima)}
                              disabled={isSaving(item.song.id, item.isUltima)}
                              onChange={(event) =>
                                props.onToggleLockedSong(
                                  item.song.id,
                                  item.isUltima,
                                  event.currentTarget.checked
                                )
                              }
                            />
                            未解禁
                          </label>
                        </div>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </Show>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default LockedSongsDialog
