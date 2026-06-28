import { For } from 'solid-js'
import type { WorldsendSongDTO } from '../../../../types/api.ts'
import SongMetaCardLayout from '../../components/SongMetaCardLayout.tsx'
import { getWorldsendChartRows, getWorldsendSongInfoItems } from '../../worldsendDetailModel.ts'

const badgeClass = '[background:var(--cs-color-worldsend-label-bg)] text-worldsend-label-text'
const fixedColumnClass = 'w-px whitespace-nowrap'
const fixedCellClass = 'px-3 py-2 text-text whitespace-nowrap'

type Props = {
  song: WorldsendSongDTO
  versionName: string
}

/**
 * WORLD'S END楽曲の基本情報と譜面情報を表示する。
 * @param props 表示対象のWORLD'S END楽曲とバージョン名
 * @returns 楽曲情報カードUI
 */
const WorldsendSongInfoCard = (props: Props) => {
  return (
    <SongMetaCardLayout
      title={props.song.title}
      jacket={props.song.jacket}
      infoItems={getWorldsendSongInfoItems(props.song, props.versionName)}
    >
      <div class="rounded-md border border-border bg-surface p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto text-sm">
            <thead class="bg-surface-muted text-left">
              <tr>
                <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}></th>
                <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}></th>
                <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>LEVEL</th>
                <th class={`px-3 py-2 font-medium text-text-muted ${fixedColumnClass}`}>NOTES</th>
                <th class="px-3 py-2 font-medium text-text-muted whitespace-nowrap">
                  NOTES DESIGNER
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={getWorldsendChartRows(props.song)}>
                {(chart) => (
                  <tr class="border-t border-border">
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <div
                        class={`rounded px-3 py-1 text-center text-xs font-semibold tracking-wide whitespace-nowrap ${badgeClass}`}
                      >
                        {chart.label}
                      </div>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class="block whitespace-nowrap font-bold">{chart.attribute}</span>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class="block whitespace-nowrap">{chart.level}</span>
                    </td>
                    <td class={`${fixedCellClass} ${fixedColumnClass}`}>
                      <span class="block whitespace-nowrap">{chart.notes}</span>
                    </td>
                    <td class="px-3 py-2 text-text">
                      <span class="font-sans block whitespace-nowrap">{chart.notesDesigner}</span>
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
