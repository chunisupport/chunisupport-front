import { For } from 'solid-js'
import { CHUNITHM_JACKET_BASE_URL } from '../../../../config'
import type { SongDTO } from '../../../../types/api'

const difficultyRowClass: Record<string, string> = {
  BASIC: 'bg-[#00ab84] text-white',
  ADVANCED: 'bg-[#ff7e00] text-white',
  EXPERT: 'bg-[#f12929] text-white',
  MASTER: 'bg-[#8e1be5] text-white',
  ULTIMA: 'bg-[#000000] text-white',
}

const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-gray-800 whitespace-nowrap'
const truncateTextClass = 'block overflow-hidden text-ellipsis whitespace-nowrap'

type DifficultyOption = {
  label: string
  value: string
}

type Props = {
  song: SongDTO
  availableDifficulties: DifficultyOption[]
}

const SongInfoCard = (props: Props) => {
  const getNotesDesignerLabel = (notesDesigner: string | null | undefined) => {
    const trimmed = notesDesigner?.trim()
    return trimmed ? trimmed : '-'
  }

  const songInfoItems = () => [
    { label: 'ジャンル', value: props.song.genre },
    { label: 'BPM', value: props.song.bpm ?? '-' },
    { label: 'リリース日', value: props.song.release ?? '-' },
  ]

  const jacketUrl = () => {
    if (!props.song.jacket) return null
    return `${CHUNITHM_JACKET_BASE_URL}/${props.song.jacket}.webp`
  }

  return (
    <div class="space-y-4 lg:grid lg:grid-cols-[240px_minmax(0,220px)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      <div class="grid grid-cols-[minmax(0,42vw)_minmax(0,1fr)] items-start gap-4 lg:contents">
        <div class="aspect-square w-full overflow-hidden rounded-md border border-gray-200 bg-white">
          {jacketUrl() ? (
            <img
              src={jacketUrl() ?? undefined}
              alt={`${props.song.title}のジャケット`}
              class="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div class="flex h-full w-full items-center justify-center bg-gray-50 p-4 text-sm text-gray-400">
              ジャケットなし
            </div>
          )}
        </div>

        <div class="grid gap-4 rounded-md border border-gray-200 bg-white p-4">
          <For each={songInfoItems()}>
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
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>譜面定数</th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>ノーツ数</th>
                <th class="px-3 py-2 font-medium text-gray-700">NOTES DESIGNER</th>
              </tr>
            </thead>
            <tbody>
              <For each={props.availableDifficulties}>
                {(difficulty) => {
                  const key = difficulty.label as keyof typeof props.song.charts
                  const chart = props.song.charts[key]
                  return (
                    <tr class="border-t border-gray-100">
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <div
                          class={`overflow-hidden rounded px-3 py-1 text-center text-xs font-semibold tracking-wide text-ellipsis whitespace-nowrap ${difficultyRowClass[difficulty.label] ?? 'bg-gray-200 text-gray-800'}`}
                        >
                          {difficulty.label}
                        </div>
                      </td>
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <span class={truncateTextClass}>
                          {chart
                            ? `${chart.const.toFixed(1)}${chart.is_const_unknown ? '?' : ''}`
                            : '-'}
                        </span>
                      </td>
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <span class={truncateTextClass}>{chart?.notes ?? '-'}</span>
                      </td>
                      <td class="px-3 py-2 text-gray-800">
                        <span class={truncateTextClass}>
                          {getNotesDesignerLabel(chart?.notes_designer)}
                        </span>
                      </td>
                    </tr>
                  )
                }}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SongInfoCard
