import { For } from 'solid-js'
import type { SongDTO } from '../../../../types/api'
import SongMetaCardLayout, { type SongMetaInfoItem } from '../../components/SongMetaCardLayout'

const difficultyRowClass: Record<string, string> = {
  BASIC: 'bg-[#00ab84] text-white',
  ADVANCED: 'bg-[#ff7e00] text-white',
  EXPERT: 'bg-[#f12929] text-white',
  MASTER: 'bg-[#8e1be5] text-white',
  ULTIMA: 'bg-[#000000] text-white',
}

const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-gray-800 whitespace-nowrap'

type DifficultyOption = {
  label: string
  value: string
}

type Props = {
  song: SongDTO
  availableDifficulties: DifficultyOption[]
  versionName: string
}

const SongInfoCard = (props: Props) => {
  const getNotesDesignerLabel = (notesDesigner: string | null | undefined) => {
    const trimmed = notesDesigner?.trim()
    return trimmed ? trimmed : '-'
  }

  const songInfoItems = (): SongMetaInfoItem[] => [
    { label: 'GENRE', value: props.song.genre },
    { label: 'BPM', value: props.song.bpm ?? '-' },
    { label: 'RELEASE', value: props.song.release ?? '-' },
    { label: 'VERSION', value: props.versionName },
  ]

  return (
    <SongMetaCardLayout
      title={props.song.title}
      jacket={props.song.jacket}
      infoItems={songInfoItems()}
    >
      <div class="rounded-md border border-gray-200 bg-white p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto text-sm">
            <thead class="bg-gray-50 text-left">
              <tr>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}></th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>譜面定数</th>
                <th class={`px-3 py-2 font-medium text-gray-700 ${fixedColumnClass}`}>ノーツ数</th>
                <th class="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                  NOTES DESIGNER
                </th>
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
                          class={`rounded px-3 py-1 text-center text-xs font-semibold tracking-wide whitespace-nowrap ${difficultyRowClass[difficulty.label] ?? 'bg-gray-200 text-gray-800'}`}
                        >
                          {difficulty.label}
                        </div>
                      </td>
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <span class="block whitespace-nowrap">
                          {chart
                            ? `${chart.const.toFixed(1)}${chart.is_const_unknown ? '?' : ''}`
                            : '-'}
                        </span>
                      </td>
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <span class="block whitespace-nowrap">{chart?.notes ?? '-'}</span>
                      </td>
                      <td class="px-3 py-2 text-gray-800">
                        <span class="block whitespace-nowrap">
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
    </SongMetaCardLayout>
  )
}

export default SongInfoCard
