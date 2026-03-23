import { For } from 'solid-js'
import type { WorldsendSongDTO } from '../../../../types/api'
import { getWorldsendChartRows } from '../../worldsendDetailModel'

const badgeClass = 'bg-black text-white'

type Props = {
  song: WorldsendSongDTO
}

const WorldsendChartCard = (props: Props) => {
  return (
    <div class="rounded-md border border-gray-200 bg-white p-4 space-y-3">
      <h2 class="text-lg font-semibold">WORLD'S END 譜面情報</h2>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-3 py-2 font-medium text-gray-700"></th>
              <th class="px-3 py-2 font-medium text-gray-700">属性</th>
              <th class="px-3 py-2 font-medium text-gray-700">レベル</th>
              <th class="px-3 py-2 font-medium text-gray-700">ノーツ数</th>
            </tr>
          </thead>
          <tbody>
            <For each={getWorldsendChartRows(props.song)}>
              {(chart) => (
                <tr class="border-t border-gray-100">
                  <td class="px-3 py-2">
                    <span
                      class={`inline-flex min-w-[7rem] justify-center rounded px-3 py-1 text-xs font-semibold tracking-wide ${badgeClass}`}
                    >
                      {chart.label}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-gray-800">{chart.attribute}</td>
                  <td class="px-3 py-2 text-gray-800">{chart.level}</td>
                  <td class="px-3 py-2 text-gray-800">{chart.notes}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WorldsendChartCard
