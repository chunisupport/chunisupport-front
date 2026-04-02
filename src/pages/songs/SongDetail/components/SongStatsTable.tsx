import { For, createMemo } from 'solid-js'
import type { SongStatsBandDTO } from '../../../../types/api'

type Props = {
  ratingBands: string[]
  stats: SongStatsBandDTO[]
}

const SongStatsTable = (props: Props) => {
  const normalizedStats = createMemo<SongStatsBandDTO[]>(() => {
    const statsByBand = new Map(props.stats.map((band) => [band.rating_band, band]))

    return props.ratingBands.map(
      (ratingBand) =>
        statsByBand.get(ratingBand) ?? {
          rating_band: ratingBand,
          rank: {
            sss: 0,
            sssp: 0,
            max: 0,
          },
          combo: {
            none: 0,
            fc: 0,
            aj: 0,
          },
          clear: {
            failed: 0,
            clear: 0,
            hard: 0,
            brave: 0,
            absolute: 0,
            catastrophy: 0,
          },
          average_score: null,
          player_count: 0,
        }
    )
  })

  return (
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left">帯</th>
            <th class="px-2 py-2 text-right">人数</th>
            <th class="px-2 py-2 text-right">平均スコア</th>
            <th class="px-2 py-2 text-right">FC</th>
            <th class="px-2 py-2 text-right">AJ</th>
            <th class="px-2 py-2 text-right">CLEAR</th>
            <th class="px-2 py-2 text-right">HARD</th>
            <th class="px-2 py-2 text-right">BRAVE</th>
            <th class="px-2 py-2 text-right">ABSOLUTE</th>
          </tr>
        </thead>
        <tbody>
          <For each={normalizedStats()}>
            {(band) => (
              <tr class="border-t border-gray-100">
                <td class="px-2 py-2">{band.rating_band}</td>
                <td class="px-2 py-2 text-right">{band.player_count.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">
                  {band.average_score === null
                    ? '-'
                    : band.average_score.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td class="px-2 py-2 text-right">{band.combo.fc.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.combo.aj.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.clear.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.hard.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.brave.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.absolute.toLocaleString()}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default SongStatsTable
