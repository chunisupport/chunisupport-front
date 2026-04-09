import { For } from 'solid-js'
import type { WorldsendSongDTO } from '../../../../types/api'
import SongMetaCardLayout from '../../components/SongMetaCardLayout'
import { getWorldsendChartRows, getWorldsendSongInfoItems } from '../../worldsendDetailModel'

const badgeClass = 'bg-black text-white'
const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-gray-800 whitespace-nowrap'

type Props = {
  song: WorldsendSongDTO
  versionName: string
}

const WorldsendSongInfoCard = (props: Props) => {
  return (
    <SongMetaCardLayout
      title={props.song.title}
      jacket={props.song.jacket}
      infoItems={getWorldsendSongInfoItems(props.song, props.versionName)}
    >
      <div class="rounded-md border border-gray-200 bg-white p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto text-sm">
            <thead class="bg-gray-50 text-left">
              <tr>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}></th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>属性</th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>レベル</th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>ノーツ数</th>
                <th class="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                  NOTES DESIGNER
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={getWorldsendChartRows(props.song)}>
                {(chart) => (
                  <tr class="border-t border-gray-100">
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <div
                        class={`rounded px-3 py-1 text-center text-xs font-semibold tracking-wide whitespace-nowrap ${badgeClass}`}
                      >
                        {chart.label}
                      </div>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class="block whitespace-nowrap">{chart.attribute}</span>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class="block whitespace-nowrap">{chart.level}</span>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class="block whitespace-nowrap">{chart.notes}</span>
                    </td>
                    <td class="px-3 py-2 text-gray-800">
                      <span class="block whitespace-nowrap">{chart.notesDesigner}</span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </SongMetaCardLayout>
  )
}

export default WorldsendSongInfoCard
