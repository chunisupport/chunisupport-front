import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import {
  deleteSongByDisplayId,
  deleteWorldsendSongByDisplayId,
  fetchEditorSongs,
  fetchEditorWorldsendSongs,
  fetchMasterData,
  restoreSongByDisplayId,
  restoreWorldsendSongByDisplayId,
  updateSongs,
  updateWorldsendSongs,
} from '../../api/songs'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type {
  EditorSongDTO,
  EditorWorldsendSongDTO,
  MasterItemDTO,
  SongDTO,
  UpdateSongRequestDTO,
  UpdateWorldsendSongRequestDTO,
  WorldsendSongDTO,
} from '../../types/api'

type SongManagementPageProps = {
  title: string
}

type EditableChartDraft = {
  difficulty_id: number
  difficulty_name: string
  const: number
  is_const_unknown: boolean
  notes: number | null
}

type SongDraft = {
  id: string
  title: string
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  charts: EditableChartDraft[]
}

type WorldsendDraft = {
  id: string
  title: string
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  attribute: string | null
  level_star: number | null
  notes: number | null
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

const toDateOnly = (value: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (dateOnlyPattern.test(trimmed)) {
    return trimmed
  }

  const datePrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  if (datePrefixMatch && dateOnlyPattern.test(datePrefixMatch[1])) {
    return datePrefixMatch[1]
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

const toDateInputValue = (value: string | null): string => {
  return toDateOnly(value) ?? ''
}

const toSongDraft = (
  song: SongDTO,
  genres: MasterItemDTO[],
  difficulties: MasterItemDTO[]
): SongDraft => {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    genre_id: genres.find((genre) => genre.name === song.genre)?.id ?? null,
    bpm: song.bpm ?? null,
    released_at: toDateOnly(song.release),
    jacket: song.jacket ?? null,
    charts: difficulties
      .map((difficulty) => {
        const chart = song.charts[difficulty.name as keyof SongDTO['charts']]
        if (!chart) return null
        return {
          difficulty_id: difficulty.id,
          difficulty_name: difficulty.name,
          const: chart.const,
          is_const_unknown: chart.is_const_unknown,
          notes: chart.notes ?? null,
        }
      })
      .filter((chart): chart is NonNullable<typeof chart> => chart !== null),
  }
}

const toWorldsendDraft = (song: WorldsendSongDTO, genres: MasterItemDTO[]): WorldsendDraft => {
  const chart = song.charts.WORLDSEND

  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    genre_id: genres.find((genre) => genre.name === song.genre)?.id ?? null,
    bpm: song.bpm ?? null,
    released_at: toDateOnly(song.release),
    jacket: song.jacket ?? null,
    attribute: chart?.attribute ?? null,
    level_star: chart?.level_star ?? null,
    notes: chart?.notes ?? null,
  }
}

const SongManagementPage = (props: SongManagementPageProps) => {
  useDocumentTitle(props.title)

  const [refreshKey, setRefreshKey] = createSignal(0)
  const [songsResponse] = createResource(() => refreshKey(), fetchEditorSongs)
  const [worldsendResponse] = createResource(() => refreshKey(), fetchEditorWorldsendSongs)
  const [masterData] = createResource(fetchMasterData)

  const [selectedSongId, setSelectedSongId] = createSignal<string>('')
  const [selectedWorldsendSongId, setSelectedWorldsendSongId] = createSignal<string>('')
  const [draft, setDraft] = createSignal<SongDraft | null>(null)
  const [worldsendDraft, setWorldsendDraft] = createSignal<WorldsendDraft | null>(null)
  const [message, setMessage] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')

  const songs = createMemo<EditorSongDTO[]>(() => songsResponse()?.songs ?? [])
  const worldsendSongs = createMemo<EditorWorldsendSongDTO[]>(() => worldsendResponse()?.songs ?? [])
  const selectedSong = createMemo(() => {
    const selected = selectedSongId()
    if (!selected) return null
    return songs().find((item) => item.id === selected) ?? null
  })
  const selectedWorldsendSong = createMemo(() => {
    const selected = selectedWorldsendSongId()
    if (!selected) return null
    return worldsendSongs().find((item) => item.id === selected) ?? null
  })

  createEffect(() => {
    const song = selectedSong()
    const md = masterData()
    if (!song || !md) {
      setDraft(null)
      return
    }

    setDraft(toSongDraft(song, md.genres, md.difficulties))
  })

  createEffect(() => {
    const song = selectedWorldsendSong()
    const md = masterData()
    if (!song || !md) {
      setWorldsendDraft(null)
      return
    }

    setWorldsendDraft(toWorldsendDraft(song, md.genres))
  })

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId)
  }

  const handleSelectWorldsendSong = (songId: string) => {
    setSelectedWorldsendSongId(songId)
  }

  const updateDraftField = <K extends keyof SongDraft>(key: K, value: SongDraft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const updateWorldsendDraftField = <K extends keyof WorldsendDraft>(
    key: K,
    value: WorldsendDraft[K]
  ) => {
    setWorldsendDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const updateDraftChart = (
    difficultyId: number,
    key: 'const' | 'is_const_unknown' | 'notes',
    value: number | boolean | null
  ) => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        charts: prev.charts.map((chart) =>
          chart.difficulty_id === difficultyId ? { ...chart, [key]: value } : chart
        ),
      }
    })
  }

  const updateWorldsendChart = (
    key: 'attribute' | 'level_star' | 'notes',
    value: string | number | null
  ) => {
    setWorldsendDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const refresh = () => setRefreshKey((prev) => prev + 1)

  const handleSave = async () => {
    const current = draft()
    if (!current) return

    setMessage('')
    setErrorMessage('')

    const md = masterData()
    if (!md) {
      setErrorMessage('マスターデータの取得前のため更新できません。再読み込みしてください。')
      return
    }

    const normalizedReleasedAt = toDateOnly(current.released_at)
    if (current.released_at && !normalizedReleasedAt) {
      setErrorMessage('リリース日の形式が不正です。日付を入力し直してください。')
      return
    }

    const request: UpdateSongRequestDTO = {
      id: current.id,
      title: current.title,
      artist: current.artist,
      genre: md.genres.find((genre) => genre.id === current.genre_id)?.name ?? null,
      bpm: current.bpm,
      released_at: normalizedReleasedAt,
      jacket: current.jacket,
      charts: Object.fromEntries(
        current.charts.map((chart) => [
          chart.difficulty_name,
          {
            const: chart.const,
            is_const_unknown: chart.is_const_unknown,
            notes: chart.notes,
          },
        ])
      ),
    }

    try {
      await updateSongs([request])
      setMessage('楽曲を更新しました。')
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '更新に失敗しました。')
    }
  }

  const handleSaveWorldsend = async () => {
    const current = worldsendDraft()
    if (!current) return

    setMessage('')
    setErrorMessage('')

    const md = masterData()
    if (!md) {
      setErrorMessage('マスターデータの取得前のため更新できません。再読み込みしてください。')
      return
    }

    const normalizedReleasedAt = toDateOnly(current.released_at)
    if (current.released_at && !normalizedReleasedAt) {
      setErrorMessage('リリース日の形式が不正です。日付を入力し直してください。')
      return
    }

    const request: UpdateWorldsendSongRequestDTO = {
      id: current.id,
      title: current.title,
      artist: current.artist,
      genre: md.genres.find((genre) => genre.id === current.genre_id)?.name ?? null,
      bpm: current.bpm,
      released_at: normalizedReleasedAt,
      jacket: current.jacket,
      charts: {
        WORLDSEND: {
          attribute: current.attribute?.trim() ? current.attribute.trim() : null,
          level_star: current.level_star,
          notes: current.notes,
        },
      },
    }

    try {
      await updateWorldsendSongs([request])
      setMessage("WORLD'S END楽曲を更新しました。")
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '更新に失敗しました。')
    }
  }

  const handleDeleteSong = async (displayId: string) => {
    if (!window.confirm('この楽曲を削除しますか？')) return
    setMessage('')
    setErrorMessage('')
    try {
      await deleteSongByDisplayId(displayId)
      setMessage('楽曲を削除しました。')
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '削除に失敗しました。')
    }
  }

  const handleRestoreSong = async (displayId: string) => {
    setMessage('')
    setErrorMessage('')
    try {
      await restoreSongByDisplayId(displayId)
      setMessage('楽曲を復活しました。')
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '復活に失敗しました。')
    }
  }

  const handleDeleteWorldsendSong = async (displayId: string) => {
    if (!window.confirm("このWORLD'S END楽曲を削除しますか？")) return
    setMessage('')
    setErrorMessage('')
    try {
      await deleteWorldsendSongByDisplayId(displayId)
      setMessage("WORLD'S END楽曲を削除しました。")
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '削除に失敗しました。')
    }
  }

  const handleRestoreWorldsendSong = async (displayId: string) => {
    setMessage('')
    setErrorMessage('')
    try {
      await restoreWorldsendSongByDisplayId(displayId)
      setMessage("WORLD'S END楽曲を復活しました。")
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '復活に失敗しました。')
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl p-4 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold">{props.title}</h1>
        <p class="mt-2 text-sm text-gray-600">
          API仕様準拠: 通常楽曲・WORLD&apos;S END ともに既存データの編集・削除・復活に対応します。
        </p>
      </div>

      <Show when={message()}>
        <p class="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message()}
        </p>
      </Show>
      <Show when={errorMessage()}>
        <p class="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage()}
        </p>
      </Show>

      <section class="rounded-lg border border-gray-200 bg-white p-4">
        <h2 class="text-lg font-semibold">通常楽曲（編集 / 削除 / 復活）</h2>

        <Show
          when={!songsResponse.loading && !masterData.loading && songs().length > 0}
          fallback={<p class="mt-3 text-sm text-gray-500">楽曲データを読み込み中...</p>}
        >
          <div class="mt-3 grid gap-4 lg:grid-cols-[300px_1fr]">
            <div class="max-h-130 overflow-y-auto rounded border border-gray-200">
              <ul class="divide-y divide-gray-200">
                <For each={songs()}>
                  {(song) => {
                    const isSelected = () => song.id === selectedSongId()
                    return (
                      <li>
                        <button
                          type="button"
                          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          classList={{
                            'bg-blue-50': isSelected(),
                            'bg-red-50': song.is_deleted && !isSelected(),
                          }}
                          onClick={() => handleSelectSong(song.id)}
                        >
                          <p class="font-medium text-gray-900">{song.title}</p>
                          <p class="text-xs text-gray-600">{song.artist}</p>
                        </button>
                      </li>
                    )
                  }}
                </For>
              </ul>
            </div>

            <Show when={draft()}>
              {(currentDraft) => (
                <div class="space-y-4">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">タイトル</span>
                      <input
                        value={currentDraft().title}
                        onInput={(event) => updateDraftField('title', event.currentTarget.value)}
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">アーティスト</span>
                      <input
                        value={currentDraft().artist}
                        onInput={(event) => updateDraftField('artist', event.currentTarget.value)}
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">ジャンル</span>
                      <select
                        value={String(currentDraft().genre_id ?? '')}
                        onChange={(event) =>
                          updateDraftField(
                            'genre_id',
                            event.currentTarget.value === ''
                              ? null
                              : Number(event.currentTarget.value)
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      >
                        <option value="">未設定</option>
                        <For each={masterData()?.genres ?? []}>
                          {(genre) => <option value={genre.id}>{genre.name}</option>}
                        </For>
                      </select>
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">BPM</span>
                      <input
                        type="number"
                        value={currentDraft().bpm ?? ''}
                        onInput={(event) =>
                          updateDraftField(
                            'bpm',
                            event.currentTarget.value === ''
                              ? null
                              : Number(event.currentTarget.value)
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">リリース日</span>
                      <input
                        type="date"
                        value={toDateInputValue(currentDraft().released_at)}
                        onInput={(event) =>
                          updateDraftField(
                            'released_at',
                            event.currentTarget.value.trim() === ''
                              ? null
                              : event.currentTarget.value
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">ジャケット名</span>
                      <input
                        value={currentDraft().jacket ?? ''}
                        onInput={(event) =>
                          updateDraftField(
                            'jacket',
                            event.currentTarget.value.trim() === ''
                              ? null
                              : event.currentTarget.value
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                  </div>

                  <div class="overflow-x-auto rounded border border-gray-200">
                    <table class="min-w-full text-sm">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-3 py-2 text-left">難易度</th>
                          <th class="px-3 py-2 text-left">定数</th>
                          <th class="px-3 py-2 text-left">未確定</th>
                          <th class="px-3 py-2 text-left">ノーツ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={currentDraft().charts}>
                          {(chart) => (
                            <tr class="border-t border-gray-100">
                              <td class="px-3 py-2">{chart.difficulty_name}</td>
                              <td class="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={chart.const}
                                  onInput={(event) =>
                                    updateDraftChart(
                                      chart.difficulty_id,
                                      'const',
                                      Number(event.currentTarget.value)
                                    )
                                  }
                                  class="w-28 rounded border border-gray-300 px-2 py-1"
                                />
                              </td>
                              <td class="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={chart.is_const_unknown}
                                  onChange={(event) =>
                                    updateDraftChart(
                                      chart.difficulty_id,
                                      'is_const_unknown',
                                      event.currentTarget.checked
                                    )
                                  }
                                />
                              </td>
                              <td class="px-3 py-2">
                                <input
                                  type="number"
                                  value={chart.notes ?? ''}
                                  onInput={(event) =>
                                    updateDraftChart(
                                      chart.difficulty_id,
                                      'notes',
                                      event.currentTarget.value === ''
                                        ? null
                                        : Number(event.currentTarget.value)
                                    )
                                  }
                                  class="w-28 rounded border border-gray-300 px-2 py-1"
                                />
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleSave}
                    >
                      更新する
                    </button>
                    <Show
                      when={!selectedSong()?.is_deleted}
                      fallback={
                        <button
                          type="button"
                          class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                          onClick={() => handleRestoreSong(currentDraft().id)}
                        >
                          復活する
                        </button>
                      }
                    >
                      <button
                        type="button"
                        class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        onClick={() => handleDeleteSong(currentDraft().id)}
                      >
                        削除する
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </Show>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4">
        <h2 class="text-lg font-semibold">WORLD&apos;S END（編集 / 削除 / 復活）</h2>

        <Show
          when={!worldsendResponse.loading && !masterData.loading && worldsendSongs().length > 0}
          fallback={<p class="mt-3 text-sm text-gray-500">WORLD&apos;S END楽曲を読み込み中...</p>}
        >
          <div class="mt-3 grid gap-4 lg:grid-cols-[300px_1fr]">
            <div class="max-h-130 overflow-y-auto rounded border border-gray-200">
              <ul class="divide-y divide-gray-200">
                <For each={worldsendSongs()}>
                  {(song) => {
                    const isSelected = () => song.id === selectedWorldsendSongId()
                    return (
                      <li>
                        <button
                          type="button"
                          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          classList={{
                            'bg-blue-50': isSelected(),
                            'bg-red-50': song.is_deleted && !isSelected(),
                          }}
                          onClick={() => handleSelectWorldsendSong(song.id)}
                        >
                          <p class="font-medium text-gray-900">{song.title}</p>
                          <p class="text-xs text-gray-600">{song.artist}</p>
                        </button>
                      </li>
                    )
                  }}
                </For>
              </ul>
            </div>

            <Show when={worldsendDraft()}>
              {(currentDraft) => (
                <div class="space-y-4">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">タイトル</span>
                      <input
                        value={currentDraft().title}
                        onInput={(event) =>
                          updateWorldsendDraftField('title', event.currentTarget.value)
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">アーティスト</span>
                      <input
                        value={currentDraft().artist}
                        onInput={(event) =>
                          updateWorldsendDraftField('artist', event.currentTarget.value)
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">ジャンル</span>
                      <select
                        value={String(currentDraft().genre_id ?? '')}
                        onChange={(event) =>
                          updateWorldsendDraftField(
                            'genre_id',
                            event.currentTarget.value === ''
                              ? null
                              : Number(event.currentTarget.value)
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      >
                        <option value="">未設定</option>
                        <For each={masterData()?.genres ?? []}>
                          {(genre) => <option value={genre.id}>{genre.name}</option>}
                        </For>
                      </select>
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">BPM</span>
                      <input
                        type="number"
                        value={currentDraft().bpm ?? ''}
                        onInput={(event) =>
                          updateWorldsendDraftField(
                            'bpm',
                            event.currentTarget.value === ''
                              ? null
                              : Number(event.currentTarget.value)
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">リリース日</span>
                      <input
                        type="date"
                        value={toDateInputValue(currentDraft().released_at)}
                        onInput={(event) =>
                          updateWorldsendDraftField(
                            'released_at',
                            event.currentTarget.value.trim() === ''
                              ? null
                              : event.currentTarget.value
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">ジャケット名</span>
                      <input
                        value={currentDraft().jacket ?? ''}
                        onInput={(event) =>
                          updateWorldsendDraftField(
                            'jacket',
                            event.currentTarget.value.trim() === ''
                              ? null
                              : event.currentTarget.value
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">属性</span>
                      <input
                        value={currentDraft().attribute ?? ''}
                        onInput={(event) =>
                          updateWorldsendChart(
                            'attribute',
                            event.currentTarget.value.trim() === ''
                              ? null
                              : event.currentTarget.value
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">レベル</span>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={currentDraft().level_star ?? ''}
                        onInput={(event) =>
                          updateWorldsendChart(
                            'level_star',
                            event.currentTarget.value === ''
                              ? null
                              : Number(event.currentTarget.value)
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                    <label class="text-sm">
                      <span class="mb-1 block text-gray-700">ノーツ</span>
                      <input
                        type="number"
                        min="0"
                        value={currentDraft().notes ?? ''}
                        onInput={(event) =>
                          updateWorldsendChart(
                            'notes',
                            event.currentTarget.value === ''
                              ? null
                              : Number(event.currentTarget.value)
                          )
                        }
                        class="w-full rounded border border-gray-300 px-3 py-2"
                      />
                    </label>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleSaveWorldsend}
                    >
                      更新する
                    </button>
                    <Show
                      when={!selectedWorldsendSong()?.is_deleted}
                      fallback={
                        <button
                          type="button"
                          class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                          onClick={() => handleRestoreWorldsendSong(currentDraft().id)}
                        >
                          復活する
                        </button>
                      }
                    >
                      <button
                        type="button"
                        class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        onClick={() => handleDeleteWorldsendSong(currentDraft().id)}
                      >
                        削除する
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </Show>

        <Show when={!worldsendResponse.loading && worldsendSongs().length === 0}>
          <p class="mt-3 text-sm text-gray-500">WORLD&apos;S END楽曲がありません。</p>
        </Show>
      </section>
    </div>
  )
}

export default SongManagementPage
