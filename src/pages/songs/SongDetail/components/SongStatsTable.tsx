import { For } from 'solid-js'
import type { SongStatsBandDTO } from '../../../../types/api'

type Props = {
  stats: SongStatsBandDTO[]
}

/** 現在のロケールにおける小数点セパレータを取得する。 */
const getDecimalSeparator = (): string => (1.1).toLocaleString().charAt(1)

/**
 * 平均スコアを整数部と小数部に分割して表示する。
 * @param score 表示するスコア値。
 * @returns 小数部のみフォントサイズを小さくした JSX。
 */
const formatAverageScore = (score: number) => {
  const formatted = score.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
  const sep = getDecimalSeparator()
  const idx = formatted.lastIndexOf(sep)
  if (idx === -1) return formatted
  return (
    <>
      {formatted.slice(0, idx)}
      <span class="text-[0.8em]">{formatted.slice(idx)}</span>
    </>
  )
}

/**
 * 楽曲詳細ページのレーティング帯別統計を表示する。
 * @param props 表示する統計行。
 * @returns 難易度別統計テーブル。
 */
const SongStatsTable = (props: Props) => {
  return (
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-surface-muted">
          <tr>
            <th class="px-2 py-2 text-left whitespace-nowrap">帯</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">人数</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">平均スコア</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">FC</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">AJ</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">CLEAR</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">HARD</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">BRAVE</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">ABSOLUTE</th>
            <th class="px-2 py-2 text-right whitespace-nowrap">CATASTROPHY</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.stats}>
            {(band) => (
              <tr class="border-t border-border">
                <td class="px-2 py-2">{band.rating_band}</td>
                <td class="px-2 py-2 text-right">{band.player_count.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">
                  {band.average_score === null ? '-' : formatAverageScore(band.average_score)}
                </td>
                <td class="px-2 py-2 text-right">{band.combo.fc.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.combo.aj.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.clear.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.hard.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.brave.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.absolute.toLocaleString()}</td>
                <td class="px-2 py-2 text-right">{band.clear.catastrophy.toLocaleString()}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default SongStatsTable
