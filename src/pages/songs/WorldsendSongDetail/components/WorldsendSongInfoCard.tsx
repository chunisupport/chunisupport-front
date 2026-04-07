import { For, Show } from 'solid-js'
import { CHUNITHM_JACKET_BASE_URL } from '../../../../config'
import type { WorldsendSongDTO } from '../../../../types/api'
import { getWorldsendChartRows, getWorldsendSongInfoItems } from '../../worldsendDetailModel'

const badgeClass = 'bg-black text-white'
const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-gray-800 whitespace-nowrap'
const truncateTextClass = 'block overflow-hidden text-ellipsis whitespace-nowrap'

type Props = {
  song: WorldsendSongDTO
}

const WorldsendSongInfoCard = (props: Props) => {
  const jacketUrl = () => {
    if (!props.song.jacket) return null
    return `${CHUNITHM_JACKET_BASE_URL}/${props.song.jacket}.webp`
  }

  return (
    <div class="space-y-4 lg:grid lg:grid-cols-[240px_minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      <div class="grid grid-cols-[minmax(0,42vw)_minmax(0,1fr)] items-start gap-4 lg:contents">
        <div class="aspect-square w-full overflow-hidden rounded-md border border-gray-200 bg-white">
          <Show
            when={jacketUrl()}
            fallback={
              <div class="flex h-full w-full items-center justify-center bg-gray-50 p-4 text-sm text-gray-400">
                ジャケットなし
              </div>
            }
          >
            {(url) => (
              <img
                src={url()}
                alt={`${props.song.title}のジャケット`}
                class="h-full w-full object-cover"
                loading="lazy"
              />
            )}
          </Show>
        </div>

        <div class="grid gap-4 rounded-md border border-gray-200 bg-white p-4">
          <For each={getWorldsendSongInfoItems(props.song)}>
            {(item) => (
              <div class="space-y-1">
                <p class="text-xs font-medium text-gray-500">{item.label}</p>
                <p class="text-sm text-gray-900">{item.value}</p>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="rounded-md border border-gray-200 bg-white p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto text-sm">
            <thead class="bg-gray-50 text-left">
              <tr>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}></th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>属性</th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>レベル</th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>ノーツ数</th>
                <th class="px-3 py-2 font-medium text-gray-700">NOTES DESIGNER</th>
              </tr>
            </thead>
            <tbody>
              <For each={getWorldsendChartRows(props.song)}>
                {(chart) => (
                  <tr class="border-t border-gray-100">
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <div
                        class={`overflow-hidden rounded px-3 py-1 text-center text-xs font-semibold tracking-wide text-ellipsis whitespace-nowrap ${badgeClass}`}
                      >
                        {chart.label}
                      </div>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class={truncateTextClass}>{chart.attribute}</span>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class={truncateTextClass}>{chart.level}</span>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class={truncateTextClass}>{chart.notes}</span>
                    </td>
                    <td class="px-3 py-2 text-gray-800">
                      <span class={truncateTextClass}>{chart.notesDesigner}</span>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default WorldsendSongInfoCard
