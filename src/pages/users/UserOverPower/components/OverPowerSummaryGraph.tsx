import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types'
import { COMBO_LAMP_BAR_CLASS, SCORE_RANK_BAR_CLASS } from '../../components/recordStyleClasses'

export type OverPowerScoreBand = 'MAX' | 'SSS+' | 'SSS' | 'SS+' | 'SS' | 'S+' | 'S' | 'OTHER'
export type OverPowerComboBand = 'ALL JUSTICE' | 'FULL COMBO' | 'OTHER'

export type OverPowerBandCount<T extends string> = {
  label: T
  count: number
}

export type OverPowerGraphRow = {
  summary: OverPowerSummaryRow
  scoreBands: OverPowerBandCount<OverPowerScoreBand>[]
  comboBands: OverPowerBandCount<OverPowerComboBand>[]
}

type Props = {
  rows: OverPowerGraphRow[]
}

const scoreBandClass: Record<OverPowerScoreBand, string> = {
  MAX: 'bg-emerald-300',
  'SSS+': SCORE_RANK_BAR_CLASS['SSS+'],
  SSS: SCORE_RANK_BAR_CLASS.SSS,
  'SS+': SCORE_RANK_BAR_CLASS['SS+'],
  SS: SCORE_RANK_BAR_CLASS.SS,
  'S+': SCORE_RANK_BAR_CLASS['S+'],
  S: SCORE_RANK_BAR_CLASS.S,
  OTHER: 'bg-zinc-800',
}

const comboBandClass: Record<OverPowerComboBand, string> = {
  'ALL JUSTICE': COMBO_LAMP_BAR_CLASS['ALL JUSTICE'],
  'FULL COMBO': COMBO_LAMP_BAR_CLASS['FULL COMBO'],
  OTHER: 'bg-zinc-800',
}

/** OVERPOWER値をグラフ表示用の固定小数点文字列に整形する。 */
const formatValue = (value: number): string => value.toFixed(3)

/** 達成率をグラフ表示用の固定小数点文字列に整形する。 */
const formatPercent = (value: number): string => value.toFixed(4)

/** 分布バーの横幅として使う割合を算出する。 */
const calcBandPercent = (count: number, total: number): number =>
  total > 0 ? (count / total) * 100 : 0

/** 分布ラベルと横積みバーを描画する。 */
const DistributionBar: Component<{
  bands: OverPowerBandCount<string>[]
  colorClassByLabel: Record<string, string>
  total: number
}> = (props) => (
  <div class="space-y-2">
    <div class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
      <For each={props.bands}>
        {(band) => (
          <p class="flex min-w-0 items-baseline gap-1.5 text-gray-800">
            <span class="truncate text-xs">{band.label}:</span>
            <span class="shrink-0 text-base font-bold tabular-nums text-gray-950 sm:text-lg">
              {band.count}
            </span>
          </p>
        )}
      </For>
    </div>
    <div class="flex h-7 w-full overflow-hidden bg-gray-100" role="presentation">
      <For each={props.bands.filter((band) => band.count > 0)}>
        {(band) => (
          <div
            class={props.colorClassByLabel[band.label] ?? 'bg-gray-300'}
            style={{ width: `${calcBandPercent(band.count, props.total)}%` }}
          />
        )}
      </For>
    </div>
  </div>
)

/** OVERPOWERサマリーをランク・コンボ分布付きのカードグラフとして描画する。 */
export const OverPowerSummaryGraph: Component<Props> = (props) => (
  <section class="space-y-4">
    <Show
      when={props.rows.length > 0}
      fallback={
        <p class="rounded-lg border border-gray-200 bg-white px-3 py-4 text-sm text-gray-500">
          表示できるデータがありません。
        </p>
      }
    >
      <For each={props.rows}>
        {(row) => {
          const totalScoreCount = () => row.scoreBands.reduce((sum, band) => sum + band.count, 0)
          const totalComboCount = () => row.comboBands.reduce((sum, band) => sum + band.count, 0)

          return (
            <article class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 class="text-center text-base font-bold text-gray-950">{row.summary.label}</h3>
              <p class="mt-2 text-lg font-bold tabular-nums text-gray-950">
                {formatValue(row.summary.current)}
                <span class="text-sm font-normal text-gray-700">
                  {' '}
                  / {formatValue(row.summary.max)} ({formatPercent(row.summary.percent)}%)
                </span>
              </p>
              <div class="mt-3 space-y-4">
                <DistributionBar
                  bands={row.scoreBands}
                  colorClassByLabel={scoreBandClass}
                  total={totalScoreCount()}
                />
                <DistributionBar
                  bands={row.comboBands}
                  colorClassByLabel={comboBandClass}
                  total={totalComboCount()}
                />
              </div>
            </article>
          )
        }}
      </For>
    </Show>
  </section>
)
