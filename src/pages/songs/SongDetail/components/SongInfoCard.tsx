import { For } from 'solid-js'
import { DifficultyBadge } from '../../../../components/common/DifficultyBadge'
import type { SongDTO } from '../../../../types/api'
import SongMetaCardLayout, { type SongMetaInfoItem } from '../../components/SongMetaCardLayout'

const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-text whitespace-nowrap'

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
      <div class="rounded-md border border-border bg-surface p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto text-sm">
            <thead class="bg-surface-muted text-left">
              <tr>
                <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}></th>
                <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>CONST</th>
                <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>NOTES</th>
                <th class="px-3 py-2 font-medium text-text-muted whitespace-nowrap">
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
                    <tr class="border-t border-border">
                      <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                        <DifficultyBadge
                          difficulty={difficulty.label as keyof typeof props.song.charts}
                        />
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
                      <td class="px-3 py-2 text-text">
                        <span class="font-sans block whitespace-nowrap">
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
