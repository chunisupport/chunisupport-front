import { A } from '@solidjs/router'
import { createMemo, createResource, ErrorBoundary, For, Show, Suspense } from 'solid-js'
import { fetchAllSongs } from '../../../api/songs'
import { Loading } from '../../../components'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'

const chartOrder = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'] as const

const SongsList = () => {
  const [songsResponse] = createResource(fetchAllSongs)

  const sortedSongs = createMemo(() => {
    const songs = songsResponse()?.songs ?? []
    return [...songs].sort((a, b) => a.title.localeCompare(b.title, 'ja'))
  })

  useDocumentTitle('楽曲一覧')

  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={(err) => <p class="text-red-500">ERROR: {err.message}</p>}>
        <div class="mx-auto w-full max-w-6xl p-4 space-y-4">
          <h1 class="text-2xl font-semibold">楽曲一覧</h1>
          <p class="text-sm text-gray-600">{sortedSongs().length}件</p>

          <div class="overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 text-left">
                <tr>
                  <th class="px-3 py-2">タイトル</th>
                  <th class="px-3 py-2">アーティスト</th>
                  <th class="px-3 py-2">ジャンル</th>
                  <th class="px-3 py-2">BPM</th>
                  <th class="px-3 py-2">譜面定数</th>
                </tr>
              </thead>
              <tbody>
                <For each={sortedSongs()}>
                  {(song) => (
                    <tr class="border-t border-gray-100 align-top">
                      <td class="px-3 py-2">
                        <A href={`/songs/${song.id}`} class="text-blue-600 hover:underline">
                          {song.title}
                        </A>
                      </td>
                      <td class="px-3 py-2">{song.artist}</td>
                      <td class="px-3 py-2">{song.genre}</td>
                      <td class="px-3 py-2">{song.bpm ?? '-'}</td>
                      <td class="px-3 py-2">
                        <div class="flex flex-wrap gap-1">
                          <For each={chartOrder}>
                            {(difficulty) => {
                              const chart = song.charts[difficulty]
                              return (
                                <span class="rounded border border-gray-200 px-2 py-0.5 text-xs">
                                  {difficulty.slice(0, 3)}:{' '}
                                  {chart
                                    ? `${chart.const.toFixed(1)}${chart.is_const_unknown ? '?' : ''}`
                                    : '-'}
                                </span>
                              )
                            }}
                          </For>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <Show when={sortedSongs().length === 0}>
            <p class="text-sm text-gray-500">表示できる楽曲がありません。</p>
          </Show>
        </div>
      </ErrorBoundary>
    </Suspense>
  )
}

export default SongsList
