import { A, useParams } from '@solidjs/router'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  Show,
  Suspense,
} from 'solid-js'
import { fetchMasterData, fetchSongByDisplayId, fetchSongStats } from '../../../api/songs'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'

const SongDetail = () => {
  const params = useParams<{ displayid: string }>()

  const [song] = createResource(() => params.displayid, fetchSongByDisplayId)
  const [masterData] = createResource(fetchMasterData)
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<string>('')

  const availableDifficulties = createMemo(() => {
    const currentSong = song()
    const md = masterData()
    if (!currentSong || !md) return []

    return md.difficulties
      .map((difficulty) => difficulty.name)
      .filter((difficultyName) => {
        const key = difficultyName as keyof typeof currentSong.charts
        return Boolean(currentSong.charts[key])
      })
      .map((difficultyName) => ({
        label: difficultyName,
        value: difficultyName.toLowerCase(),
      }))
  })

  createEffect(() => {
    const options = availableDifficulties()
    if (options.length === 0) return
    if (!selectedDifficulty() || !options.some((option) => option.value === selectedDifficulty())) {
      setSelectedDifficulty(options[0].value)
    }
  })

  const [stats] = createResource(
    () => {
      const displayId = params.displayid
      const difficulty = selectedDifficulty()
      if (!displayId || !difficulty) return null
      return { displayId, difficulty }
    },
    (source) => fetchSongStats(source.displayId, source.difficulty)
  )

  useDocumentTitle(() => `${song()?.title ?? '楽曲'} - 楽曲詳細`)

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <Show when={song()}>
          {(songData) => {
            const currentSong = songData()
            return (
              <div class="mx-auto w-full max-w-6xl p-4 space-y-4">
                <div class="text-sm">
                  <A href="/songs" class="text-blue-600 hover:underline">
                    ← 楽曲一覧に戻る
                  </A>
                </div>

                <h1 class="text-2xl font-semibold">{currentSong.title}</h1>

                <div class="grid gap-2 rounded-md border border-gray-200 bg-white p-4 text-sm md:grid-cols-2">
                  <p>
                    <span class="text-gray-500">ID:</span> {currentSong.id}
                  </p>
                  <p>
                    <span class="text-gray-500">アーティスト:</span> {currentSong.artist}
                  </p>
                  <p>
                    <span class="text-gray-500">ジャンル:</span> {currentSong.genre}
                  </p>
                  <p>
                    <span class="text-gray-500">BPM:</span> {currentSong.bpm ?? '-'}
                  </p>
                  <p>
                    <span class="text-gray-500">リリース:</span> {currentSong.release ?? '-'}
                  </p>
                </div>

                <div class="rounded-md border border-gray-200 bg-white p-4">
                  <h2 class="mb-2 text-lg font-semibold">譜面情報</h2>
                  <div class="flex flex-wrap gap-2 text-sm">
                    <For each={availableDifficulties()}>
                      {(difficulty) => {
                        const key = difficulty.label as keyof typeof currentSong.charts
                        const chart = currentSong.charts[key]
                        return (
                          <div class="rounded border border-gray-200 px-3 py-2">
                            <p class="font-semibold">{difficulty.label}</p>
                            <p>
                              定数:{' '}
                              {chart
                                ? `${chart.const.toFixed(1)}${chart.is_const_unknown ? '?' : ''}`
                                : '-'}
                            </p>
                            <p>ノーツ: {chart?.notes ?? '-'}</p>
                          </div>
                        )
                      }}
                    </For>
                  </div>
                </div>

                <div class="rounded-md border border-gray-200 bg-white p-4 space-y-3">
                  <h2 class="text-lg font-semibold">難易度別統計</h2>

                  <div class="flex flex-wrap gap-2">
                    <For each={availableDifficulties()}>
                      {(difficulty) => (
                        <button
                          type="button"
                          class={`rounded border px-3 py-1 text-sm ${selectedDifficulty() === difficulty.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'}`}
                          onClick={() => setSelectedDifficulty(difficulty.value)}
                        >
                          {difficulty.label}
                        </button>
                      )}
                    </For>
                  </div>

                  <Show
                    when={stats()}
                    fallback={<p class="text-sm text-gray-500">統計を読み込み中...</p>}
                  >
                    {(statsData) => (
                      <div class="overflow-x-auto">
                        <table class="min-w-full text-sm">
                          <thead class="bg-gray-50">
                            <tr>
                              <th class="px-2 py-2 text-left">帯</th>
                              <th class="px-2 py-2 text-right">人数</th>
                              <th class="px-2 py-2 text-right">平均スコア</th>
                              <th class="px-2 py-2 text-right">FC</th>
                              <th class="px-2 py-2 text-right">AJ</th>
                              <th class="px-2 py-2 text-right">CLEAR</th>
                              <th class="px-2 py-2 text-right">HARD</th>
                              <th class="px-2 py-2 text-right">ABSOLUTE</th>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={statsData().stats}>
                              {(band) => (
                                <tr class="border-t border-gray-100">
                                  <td class="px-2 py-2">{band.rating_band}</td>
                                  <td class="px-2 py-2 text-right">
                                    {band.player_count.toLocaleString()}
                                  </td>
                                  <td class="px-2 py-2 text-right">
                                    {band.average_score === null
                                      ? '-'
                                      : band.average_score.toLocaleString(undefined, {
                                          maximumFractionDigits: 1,
                                        })}
                                  </td>
                                  <td class="px-2 py-2 text-right">
                                    {band.combo.fc.toLocaleString()}
                                  </td>
                                  <td class="px-2 py-2 text-right">
                                    {band.combo.aj.toLocaleString()}
                                  </td>
                                  <td class="px-2 py-2 text-right">
                                    {band.clear.clear.toLocaleString()}
                                  </td>
                                  <td class="px-2 py-2 text-right">
                                    {band.clear.hard.toLocaleString()}
                                  </td>
                                  <td class="px-2 py-2 text-right">
                                    {band.clear.absolute.toLocaleString()}
                                  </td>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Show>
                </div>
              </div>
            )
          }}
        </Show>
      </ErrorBoundary>
    </Suspense>
  )
}

export default SongDetail
