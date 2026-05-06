import { For } from 'solid-js'
import type { WorldsendSongDTO } from '../../../../types/api'
import {
  SongListAddedDateCell,
  SongListArtistCell,
  SongListBpmCell,
  SongListGenreCell,
  SongListTitleCell,
} from '../../components/SongListMetaCells'

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
            <th class="px-3 py-2 w-px whitespace-nowrap text-center">ジャンル</th>
            <th class="px-3 py-2 w-px whitespace-nowrap text-center">追加日</th>
            <th class="px-3 py-2 w-px whitespace-nowrap text-center">BPM</th>
            <th class="px-3 py-2 w-px whitespace-nowrap text-center">属性</th>
            <th class="px-3 py-2 w-px whitespace-nowrap text-center">レベル</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.songs}>
            {(song) => {
              const chart = song.charts?.WORLDSEND
              return (
                <tr class="border-t border-gray-100 align-top">
                  <SongListTitleCell
                    href={`/songs/worldsend/${encodeURIComponent(song.id)}`}
                    title={song.title}
                    class="px-3 py-2 max-w-0"
                  />
                  <SongListArtistCell artist={song.artist} class="font-sans px-3 py-2 max-w-0" />
                  <SongListGenreCell
                    genre={song.genre}
                    class="px-3 py-2 whitespace-nowrap text-center"
                  />
                  <SongListAddedDateCell
                    release={song.release}
                    class="px-3 py-2 whitespace-nowrap text-center"
                  />
                  <SongListBpmCell bpm={song.bpm} class="px-3 py-2 whitespace-nowrap text-center" />
                  <td class="px-3 py-2 whitespace-nowrap text-center">{chart?.attribute ?? '-'}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-center">
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
