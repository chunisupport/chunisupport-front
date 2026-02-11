import { A } from '@solidjs/router'
import { For } from 'solid-js'
import type { SongDTO } from '../../../../types/api'

const chartOrder = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'] as const

type Props = {
  songs: SongDTO[]
}

const SongsTable = (props: Props) => {
  return (
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
          <For each={props.songs}>
            {(song) => (
              <tr class="border-t border-gray-100 align-top">
                <td class="px-3 py-2">
                  <A href={`/songs/${encodeURIComponent(song.id)}`} class="text-blue-600 hover:underline">
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
  )
}

export default SongsTable
