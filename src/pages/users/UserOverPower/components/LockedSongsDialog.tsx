import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { CircleSlash2, Search } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import type { PlayerLockedSongResponseItem, SongDTO } from '../../../../types/api'

type Props = {
  open: boolean
  songs: SongDTO[]
  lockedSongs: PlayerLockedSongResponseItem[]
  savingKey: string | null
  onOpenChange: (open: boolean) => void
  onToggleLockedSong: (displayId: string, isUltima: boolean, locked: boolean) => void
}

const createLockedSongKey = (displayId: string, isUltima: boolean): string =>
  `${displayId}:${isUltima ? 'ultima' : 'normal'}`

const hasUltimaChart = (song: SongDTO): boolean => Boolean(song.charts.ULTIMA)

const LockedSongsDialog: Component<Props> = (props) => {
  const [query, setQuery] = createSignal('')
  const lockedSongKeys = createMemo(
    () =>
      new Set(
        props.lockedSongs.map((lockedSong) =>
          createLockedSongKey(lockedSong.display_id, lockedSong.is_ultima)
        )
      )
  )
  const filteredSongs = createMemo(() => {
    const normalizedQuery = query().trim().toLowerCase()
    if (!normalizedQuery) return props.songs

    return props.songs.filter((song) => {
      const searchableText = `${song.id} ${song.title} ${song.artist}`.toLowerCase()
      return searchableText.includes(normalizedQuery)
    })
  })
  const isLocked = (displayId: string, isUltima: boolean): boolean =>
    lockedSongKeys().has(createLockedSongKey(displayId, isUltima))
  const isSaving = (displayId: string, isUltima: boolean): boolean =>
    props.savingKey === createLockedSongKey(displayId, isUltima)

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

          <TextField class="mb-3">
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

          <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              {props.lockedSongs.length}件設定中 / {filteredSongs().length}曲表示
            </span>
            <span>通常未解禁は曲単位、ULTIMA未解禁はULTIMA譜面のみ除外</span>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto rounded border border-gray-200">
            <Show
              when={filteredSongs().length > 0}
              fallback={
                <div class="flex flex-col items-center justify-center gap-2 p-8 text-sm text-gray-500">
                  <CircleSlash2 class="h-6 w-6" aria-hidden="true" />
                  <p>該当する曲がありません。</p>
                </div>
              }
            >
              <ul class="divide-y divide-gray-200">
                <For each={filteredSongs()}>
                  {(song) => (
                    <li class="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div class="min-w-0">
                        <p class="truncate font-sans font-medium text-gray-900">{song.title}</p>
                        <p class="truncate font-sans text-xs text-gray-500">
                          {song.artist}
                        </p>
                      </div>
                      <div class="flex shrink-0 flex-wrap gap-3">
                        <label class="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            class="h-4 w-4"
                            checked={isLocked(song.id, false)}
                            disabled={isSaving(song.id, false)}
                            onChange={(event) =>
                              props.onToggleLockedSong(song.id, false, event.currentTarget.checked)
                            }
                          />
                          通常
                        </label>
                        <Show when={hasUltimaChart(song)}>
                          <label class="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              class="h-4 w-4"
                              checked={isLocked(song.id, true)}
                              disabled={isSaving(song.id, true)}
                              onChange={(event) =>
                                props.onToggleLockedSong(song.id, true, event.currentTarget.checked)
                              }
                            />
                            ULTIMA
                          </label>
                        </Show>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default LockedSongsDialog
