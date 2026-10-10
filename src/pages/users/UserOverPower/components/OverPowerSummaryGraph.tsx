import { Button } from '@kobalte/core/button'
import { Funnel } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { DistributionBar as StackedDistributionBar } from '../../../../components/common/record/DistributionBar'
import {
  ALL_JUSTICE_CRITICAL_BG_CLASS,
  COMBO_LAMP_BAR_CLASS,
  SCORE_RANK_BAR_CLASS,
} from '../../../../components/common/record/recordStyleClasses'
import { formatOverPowerPercent, formatOverPowerValue } from '../../../../utils/overPowerFormat'
import { OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES } from '../constants'
import type {
  OverPowerBandCount,
  OverPowerComboBand,
  OverPowerGraphRow,
  OverPowerScoreBand,
} from '../types'

type Props = {
  rows: OverPowerGraphRow[]
  onOpenRecords: (row: OverPowerGraphRow['summary']) => void
}

/** OVERPOWERグラフのOTHER帯に使う、フィルター統計の未プレイと同じ背景色クラス */
const OVER_POWER_OTHER_BAR_CLASS = SCORE_RANK_BAR_CLASS.未プレイ

/** OVERPOWERグラフのスコア帯ごとの背景色クラス */
const scoreBandClass: Record<OverPowerScoreBand, string> = {
  MAX: ALL_JUSTICE_CRITICAL_BG_CLASS,
  'SSS+': SCORE_RANK_BAR_CLASS['SSS+'],
  SSS: SCORE_RANK_BAR_CLASS.SSS,
  'SS+': SCORE_RANK_BAR_CLASS['SS+'],
  SS: SCORE_RANK_BAR_CLASS.SS,
  'S+': SCORE_RANK_BAR_CLASS['S+'],
  S: SCORE_RANK_BAR_CLASS.S,
  OTHER: OVER_POWER_OTHER_BAR_CLASS,
}

/** OVERPOWERグラフのコンボ帯ごとの背景色クラス */
const comboBandClass: Record<OverPowerComboBand, string> = {
  'ALL JUSTICE': COMBO_LAMP_BAR_CLASS['ALL JUSTICE'],
  'FULL COMBO': COMBO_LAMP_BAR_CLASS['FULL COMBO'],
  OTHER: OVER_POWER_OTHER_BAR_CLASS,
}

/** OVERPOWER値をグラフ表示用の固定小数点文字列に整形する */
const formatValue = formatOverPowerValue

/** 達成率をグラフ表示用の固定小数点文字列に整形する */
const formatPercent = (value: number): string =>
  formatOverPowerPercent(value, OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES)

/**
 * 分布バーの横幅として使う割合を算出する。
 *
 * @param count - 対象帯の件数。
 * @param total - 全帯の合計件数。
 * @returns バー全体に占める割合。
 */
const calcBandPercent = (count: number, total: number): number =>
  total > 0 ? (count / total) * 100 : 0

/**
 * 分布ラベルと横積みバーを描画する。
 *
 * @param props 分布帯、色クラス、合計件数、および画像用の固定文字サイズにするか。
 * @returns 幅に応じて折り返す分布ラベルと横積みバー。
 */
const DistributionBar: Component<{
  bands: OverPowerBandCount<string>[]
  colorClassByLabel: Record<string, string>
  imageMode?: boolean
  spaciousLabels?: boolean
  total: number
}> = (props) => {
  const labelListClass = () =>
    props.spaciousLabels ? 'flex flex-wrap gap-x-4' : 'flex flex-wrap gap-x-2'
  // 画像用DOMはビューポート幅に依存させないため、画面幅別の文字サイズを使わない。
  const countClass = () => (props.imageMode ? 'text-lg' : 'text-base sm:text-lg')

  return (
    <div class="space-y-2">
      <div class={labelListClass()}>
        <For each={props.bands}>
          {(band) => (
            <p class="flex min-w-20 items-baseline gap-1.5 whitespace-nowrap text-text">
              <span class="shrink-0 text-xs">{band.label}:</span>
              <span class={`shrink-0 font-bold tabular-nums text-text ${countClass()}`}>
                {band.count}
              </span>
            </p>
          )}
        </For>
      </div>
      <StackedDistributionBar
        heightClass="h-7"
        segments={props.bands.map((band) => ({
          key: band.label,
          percent: calcBandPercent(band.count, props.total),
          colorClass: props.colorClassByLabel[band.label] ?? 'bg-action-secondary-hover',
        }))}
      />
    </div>
  )
}

type CardProps = {
  row: OverPowerGraphRow
  /** レコード遷移ハンドラー。画像用では指定しない */
  onOpenRecords?: (row: OverPowerGraphRow['summary']) => void
  /** 画像用に操作要素を省き、文字サイズを固定するか */
  imageMode?: boolean
}

/**
 * OVER POWERサマリー1行分をカードとして描画する。
 *
 * @param props - 分布付き集計行、レコード遷移ハンドラー、画像用表示にするか。
 * @returns OVER POWERサマリーのカード。
 */
export const OverPowerSummaryCard: Component<CardProps> = (props) => {
  const totalScoreCount = () => props.row.scoreBands.reduce((sum, band) => sum + band.count, 0)
  const totalComboCount = () => props.row.comboBands.reduce((sum, band) => sum + band.count, 0)

  return (
    <article class="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <h3 class="text-center text-base font-bold text-text">
        <Show
          when={!props.imageMode && props.onOpenRecords}
          fallback={<span>{props.row.summary.label}</span>}
        >
          {(onOpenRecords) => (
            <Button
              type="button"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={() => onOpenRecords()(props.row.summary)}
            >
              <span>{props.row.summary.label}</span>
              <Funnel class="h-4 w-4 shrink-0" aria-hidden="true" />
              <span class="sr-only">のレコードを表示</span>
            </Button>
          )}
        </Show>
      </h3>
      <p
        class={`mt-2 text-lg font-bold tabular-nums text-text ${props.imageMode ? 'whitespace-nowrap' : ''}`}
      >
        {formatValue(props.row.summary.current)}
        <span class="text-sm font-normal text-text-muted">
          {' '}
          / {formatValue(props.row.summary.max)} ({formatPercent(props.row.summary.percent)}%)
        </span>
      </p>
      <div class="mt-3 space-y-4">
        <DistributionBar
          bands={props.row.scoreBands}
          colorClassByLabel={scoreBandClass}
          imageMode={props.imageMode}
          total={totalScoreCount()}
        />
        <DistributionBar
          bands={props.row.comboBands}
          colorClassByLabel={comboBandClass}
          imageMode={props.imageMode}
          spaciousLabels
          total={totalComboCount()}
        />
      </div>
    </article>
  )
}

/**
 * OVER POWERサマリーをレコード遷移可能なカードグラフとして描画する。
 *
 * @param props - 分布付き集計行とレコード遷移ハンドラー。
 * @returns OVER POWERサマリーのカードグラフ。
 */
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
        {(row) => <OverPowerSummaryCard row={row} onOpenRecords={props.onOpenRecords} />}
      </For>
    </Show>
  </section>
)
