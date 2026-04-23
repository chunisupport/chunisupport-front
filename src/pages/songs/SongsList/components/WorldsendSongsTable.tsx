import { A } from '@solidjs/router'
import { For } from 'solid-js'
import type { WorldsendSongDTO } from '../../../../types/api'

type Props = {
  songs: WorldsendSongDTO[]
}

const StarLevel = (props: { level: number | null | undefined }) => {
  if (props.level == null) {
    return <span>-</span>
  }
  return <span>★{props.level}</span>
}

const WorldsendSongsTable = (props: Props) => {
  return (
    <div class="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table class="w-full max-w-full text-sm">
        <thead class="bg-gray-50 text-left">
          <tr>
            <th class="px-3 py-2 w-1/2 min-w-[15rem]">タイトル</th>
            <th class="px-3 py-2 w-1/2 min-w-[15rem]">アーティスト</th>
            <th class="px-3 py-2 w-px whitespace-nowrap">ジャンル</th>
            <th class="px-3 py-2 w-px whitespace-nowrap">BPM</th>
            <th class="px-3 py-2 w-px whitespace-nowrap">属性</th>
            <th class="px-3 py-2 w-px whitespace-nowrap">レベル</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.songs}>
            {(song) => {
              const chart = song.charts.WORLDSEND
              return (
                <tr class="border-t border-gray-100 align-top">
                  <td class="px-3 py-2 max-w-0">
                    <A
                      href={`/songs/worldsend/${encodeURIComponent(song.id)}`}
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
                  <td class="px-3 py-2 whitespace-nowrap">{song.genre ?? '-'}</td>
                  <td class="px-3 py-2 whitespace-nowrap">{song.bpm ?? '-'}</td>
                  <td class="px-3 py-2 whitespace-nowrap">{chart?.attribute ?? '-'}</td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <StarLevel level={chart?.level_star} />
                  </td>
                </tr>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default WorldsendSongsTable
