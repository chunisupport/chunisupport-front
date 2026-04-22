import { A } from '@solidjs/router'
import { For } from 'solid-js'
import type { SongDTO } from '../../../../types/api'
import { difficultyBadgeClass } from '../../../../utils/difficultyUtils'

const chartOrder = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'] as const

type Props = {
  songs: SongDTO[]
}

const SongsTable = (props: Props) => {
  return (
    <div class="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table class="w-full max-w-full text-sm">
        <thead class="bg-gray-50 text-left">
          <tr>
            <th class="px-3 py-2 w-1/2 min-w-[15rem]">タイトル</th>
            <th class="px-3 py-2 w-1/2 min-w-[15rem]">アーティスト</th>
            <th class="px-3 py-2 w-px whitespace-nowrap">ジャンル</th>
            <th class="px-3 py-2 w-px whitespace-nowrap">BPM</th>
            <th class="px-3 py-2 w-px whitespace-nowrap">譜面定数</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.songs}>
            {(song) => (
              <tr class="border-t border-gray-100 align-top">
                <td class="px-3 py-2 max-w-0">
                  <A
                    href={`/songs/${encodeURIComponent(song.id)}`}
                    class="block truncate font-sans text-primary-600 hover:underline"
                    title={song.title}
                  >
                    {song.title}
                  </A>
                </td>
                <td class="font-sans px-3 py-2 max-w-0">
                  <span class="block truncate" title={song.artist}>
                    {song.artist}
                  </span>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">{song.genre}</td>
                <td class="px-3 py-2 whitespace-nowrap">{song.bpm ?? '-'}</td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="flex flex-nowrap gap-1 whitespace-nowrap">
                    <For each={chartOrder}>
                      {(difficulty) => {
                        const chart = song.charts[difficulty]
                        if (!chart) {
                          return null
                        }

                        return (
                          <span
                            class={`inline-flex w-[45px] justify-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${difficultyBadgeClass(difficulty)}`}
                          >
                            {`${chart.const.toFixed(1)}${chart.is_const_unknown ? '?' : ''}`}
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
