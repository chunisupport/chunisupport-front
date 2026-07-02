import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { formatOverPowerPercent, formatOverPowerValue } from '../../../../utils/overPowerFormat'
import { COMBO_LAMP_BAR_CLASS, SCORE_RANK_BAR_CLASS } from '../../components/recordStyleClasses'
import { OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES } from '../constants'
import type {
  OverPowerBandCount,
  OverPowerComboBand,
  OverPowerGraphRow,
  OverPowerScoreBand,
} from '../types'

type Props = {
  rows: OverPowerGraphRow[]
}

/** OVERPOWERグラフのOTHER帯に使う、フィルター統計の未プレイと同じ背景色クラス。 */
const OVER_POWER_OTHER_BAR_CLASS = SCORE_RANK_BAR_CLASS.未プレイ

/** OVERPOWERグラフのスコア帯ごとの背景色クラス。 */
const scoreBandClass: Record<OverPowerScoreBand, string> = {
  MAX: 'bg-success',
  'SSS+': SCORE_RANK_BAR_CLASS['SSS+'],
  SSS: SCORE_RANK_BAR_CLASS.SSS,
  'SS+': SCORE_RANK_BAR_CLASS['SS+'],
  SS: SCORE_RANK_BAR_CLASS.SS,
  'S+': SCORE_RANK_BAR_CLASS['S+'],
  S: SCORE_RANK_BAR_CLASS.S,
  OTHER: OVER_POWER_OTHER_BAR_CLASS,
}

/** OVERPOWERグラフのコンボ帯ごとの背景色クラス。 */
const comboBandClass: Record<OverPowerComboBand, string> = {
  'ALL JUSTICE': COMBO_LAMP_BAR_CLASS['ALL JUSTICE'],
  'FULL COMBO': COMBO_LAMP_BAR_CLASS['FULL COMBO'],
  OTHER: OVER_POWER_OTHER_BAR_CLASS,
}

/** OVERPOWER値をグラフ表示用の固定小数点文字列に整形する。 */
const formatValue = formatOverPowerValue

/** 達成率をグラフ表示用の固定小数点文字列に整形する。 */
const formatPercent = (value: number): string =>
  formatOverPowerPercent(value, OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES)

/** 分布バーの横幅として使う割合を算出する。 */
const calcBandPercent = (count: number, total: number): number =>
  total > 0 ? (count / total) * 100 : 0

/**
 * 分布ラベルと横積みバーを描画する。
 *
 * @param props 分布帯、色クラス、および合計件数。
 * @returns 幅に応じて折り返す分布ラベルと横積みバー。
 */
const DistributionBar: Component<{
  bands: OverPowerBandCount<string>[]
  colorClassByLabel: Record<string, string>
  spaciousLabels?: boolean
  total: number
}> = (props) => {
  const labelListClass = () =>
    props.spaciousLabels ? 'flex flex-wrap gap-x-4' : 'flex flex-wrap gap-x-2'

  return (
    <div class="space-y-2">
      <div class={labelListClass()}>
        <For each={props.bands}>
          {(band) => (
            <p class="flex min-w-[80px] items-baseline gap-1.5 whitespace-nowrap text-text">
              <span class="shrink-0 text-xs">{band.label}:</span>
              <span class="shrink-0 text-base font-bold tabular-nums text-text sm:text-lg">
                {band.count}
              </span>
            </p>
          )}
        </For>
      </div>
      <div class="flex h-7 w-full overflow-visible bg-surface-hover" role="presentation">
        <For each={props.bands.filter((band) => band.count > 0)}>
          {(band, index) => {
            const visibleBands = props.bands.filter((b) => b.count > 0)
            const z = () => visibleBands.length - index()
            return (
              <div
                class={`${props.colorClassByLabel[band.label] ?? 'bg-action-secondary-hover'} relative shadow-[2px_0_3px_-1px_rgba(0,0,0,0.4)]`}
                style={{
                  width: `${calcBandPercent(band.count, props.total)}%`,
                  'z-index': z(),
                }}
              />
            )
          }}
        </For>
      </div>
    </div>
  )
}

/** OVERPOWERサマリーをランク・コンボ分布付きのカードグラフとして描画する。 */
export const OverPowerSummaryGraph: Component<Props> = (props) => (
  <section class="space-y-4">
    <Show
      when={props.rows.length > 0}
      fallback={
        <p class="rounded-lg border border-border bg-surface px-3 py-4 text-sm text-text-subtle">
          表示できるデータがありません。
        </p>
      }
    >
      <For each={props.rows}>
        {(row) => {
          const totalScoreCount = () => row.scoreBands.reduce((sum, band) => sum + band.count, 0)
          const totalComboCount = () => row.comboBands.reduce((sum, band) => sum + band.count, 0)

          return (
            <article class="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <h3 class="text-center text-base font-bold text-text">{row.summary.label}</h3>
              <p class="mt-2 text-lg font-bold tabular-nums text-text">
                {formatValue(row.summary.current)}
                <span class="text-sm font-normal text-text-muted">
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
                  spaciousLabels
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
