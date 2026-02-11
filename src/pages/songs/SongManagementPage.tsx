import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import {
  deleteSongByDisplayId,
  deleteWorldsendSongByDisplayId,
  fetchAllSongs,
  fetchMasterData,
  fetchWorldsendSongs,
  restoreSongByDisplayId,
  restoreWorldsendSongByDisplayId,
  updateSongs,
} from '../../api/songs'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { MasterItemDTO, SongDTO, UpdateSongRequestDTO } from '../../types/api'

type SongManagementPageProps = {
  title: string
}

const toUpdateSongRequest = (
  song: SongDTO,
  genres: MasterItemDTO[],
  difficulties: MasterItemDTO[]
): UpdateSongRequestDTO => {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    genre_id: genres.find((genre) => genre.name === song.genre)?.id ?? null,
    bpm: song.bpm ?? null,
    released_at: song.release ?? null,
    jacket: song.jacket ?? null,
    charts: difficulties
      .map((difficulty) => {
        const chart = song.charts[difficulty.name as keyof SongDTO['charts']]
        if (!chart) return null
        return {
          difficulty_id: difficulty.id,
          const: chart.const,
          is_const_unknown: chart.is_const_unknown,
          notes: chart.notes ?? null,
        }
      })
      .filter((chart): chart is NonNullable<typeof chart> => chart !== null),
  }
}

const SongManagementPage = (props: SongManagementPageProps) => {
  useDocumentTitle(props.title)

  const [refreshKey, setRefreshKey] = createSignal(0)
  const [songsResponse] = createResource(
    () => refreshKey(),
    () => fetchAllSongs({ includeDeleted: true })
  )
  const [worldsendResponse] = createResource(
    () => refreshKey(),
    () => fetchWorldsendSongs({ includeDeleted: true })
  )
  const [masterData] = createResource(fetchMasterData)

  const [selectedSongId, setSelectedSongId] = createSignal<string>('')
  const [draft, setDraft] = createSignal<UpdateSongRequestDTO | null>(null)
  const [message, setMessage] = createSignal<string>('')
  const [errorMessage, setErrorMessage] = createSignal<string>('')

  const songs = createMemo(() => songsResponse()?.songs ?? [])
  const worldsendSongs = createMemo(() => worldsendResponse()?.songs ?? [])

  createEffect(() => {
    const list = songs()
    const md = masterData()
    if (!list.length || !md) return

    const selected = selectedSongId()
    const song = list.find((item) => item.id === selected) ?? list[0]
    if (!song) return

    setSelectedSongId(song.id)
    setDraft(toUpdateSongRequest(song, md.genres, md.difficulties))
  })

  const handleSelectSong = (songId: string) => {
    const list = songs()
    const md = masterData()
    if (!md) return

    const song = list.find((item) => item.id === songId)
    if (!song) return

    setSelectedSongId(song.id)
    setDraft(toUpdateSongRequest(song, md.genres, md.difficulties))
  }

  const updateDraftField = <K extends keyof UpdateSongRequestDTO>(
    key: K,
    value: UpdateSongRequestDTO[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
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

  const refresh = () => setRefreshKey((prev) => prev + 1)

  const handleSave = async () => {
    const current = draft()
    if (!current) return
    setMessage('')
    setErrorMessage('')

    try {
      await updateSongs([current])
      setMessage('楽曲を更新しました。')
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
          API仕様準拠: 通常楽曲は既存データの編集・削除・復活に対応します。新規追加はAPI未対応です。
        </p>
        <p class="text-sm text-gray-600">
          WORLD'S ENDは削除・復活のみ対応します（更新APIが未提供）。
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
                          }}
                          onClick={() => handleSelectSong(song.id)}
                        >
                          <p class="font-medium text-gray-900">{song.title}</p>
                          <p class="text-xs text-gray-600">{song.artist}</p>
                          <p class="text-xs text-gray-500">{song.id}</p>
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
                      <span class="mb-1 block text-gray-700">リリース日（ISO8601）</span>
                      <input
                        value={currentDraft().released_at ?? ''}
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
                          <th class="px-3 py-2 text-left">難易度ID</th>
                          <th class="px-3 py-2 text-left">定数</th>
                          <th class="px-3 py-2 text-left">未確定</th>
                          <th class="px-3 py-2 text-left">ノーツ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={currentDraft().charts}>
                          {(chart) => (
                            <tr class="border-t border-gray-100">
                              <td class="px-3 py-2">{chart.difficulty_id}</td>
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
                    <button
                      type="button"
                      class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      onClick={() => handleDeleteSong(currentDraft().id)}
                    >
                      削除する
                    </button>
                    <button
                      type="button"
                      class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      onClick={() => handleRestoreSong(currentDraft().id)}
                    >
                      復活する
                    </button>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </Show>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4">
        <h2 class="text-lg font-semibold">WORLD&apos;S END（削除 / 復活）</h2>
        <p class="mt-1 text-sm text-gray-600">API仕様上、WORLD&apos;S ENDは更新に未対応です。</p>

        <div class="mt-3 overflow-x-auto rounded border border-gray-200">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">ID</th>
                <th class="px-3 py-2 text-left">タイトル</th>
                <th class="px-3 py-2 text-left">アーティスト</th>
                <th class="px-3 py-2 text-left">削除状態</th>
                <th class="px-3 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              <For each={worldsendSongs()}>
                {(song) => (
                  <tr class="border-t border-gray-100">
                    <td class="px-3 py-2 font-mono text-xs">{song.id}</td>
                    <td class="px-3 py-2">{song.title}</td>
                    <td class="px-3 py-2">{song.artist}</td>
                    <td class="px-3 py-2">{song.is_deleted ? '削除済み' : '有効'}</td>
                    <td class="px-3 py-2">
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                          onClick={() => handleDeleteWorldsendSong(song.id)}
                        >
                          削除
                        </button>
                        <button
                          type="button"
                          class="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                          onClick={() => handleRestoreWorldsendSong(song.id)}
                        >
                          復活
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={!worldsendResponse.loading && worldsendSongs().length === 0}>
          <p class="mt-3 text-sm text-gray-500">WORLD&apos;S END楽曲がありません。</p>
        </Show>
      </section>
    </div>
  )
}

export default SongManagementPage
