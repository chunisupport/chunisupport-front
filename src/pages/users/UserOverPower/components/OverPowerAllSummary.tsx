import type { Component } from 'solid-js'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'

type Props = {
  summary: OverPowerSummaryRow
}

const formatValue = formatOverPowerValue
const formatPercent = formatOverPowerPercent

/**
 * OVER POWER の現在値を、小数点以下だけ小さく表示します。
 * @param value 表示対象の OVER POWER 値。
 * @returns 整数部と小数点以下で文字サイズを分けた JSX。
 */
const formatCurrentValue = (value: number) => {
  const [integerPart, decimalPart] = formatValue(value).split('.')

  return (
    <>
      {integerPart}
      {decimalPart !== undefined && <span class="text-xl">.{decimalPart}</span>}
    </>
  )
}

export const OverPowerAllSummary: Component<Props> = (props) => (
  <section class="rounded-lg border border-info-border bg-info-bg p-4">
    <div class="flex flex-wrap items-end justify-between">
      <div>
        <h2 class="text-sm font-semibold text-info">TOTAL OVER POWER</h2>
        <p class="mt-1 text-xs tabular-nums text-info">
          <span class="text-3xl font-bold">{formatCurrentValue(props.summary.current)}</span> /{' '}
          {formatValue(props.summary.max)}
        </p>
      </div>
      <div class="w-full flex flex-wrap items-end justify-between text-right mt-1 text-sm tabular-nums text-info">
        <p class="font-semibold">{formatPercent(props.summary.percent)}%</p>
        <p>{props.summary.count} 曲</p>
      </div>
    </div>
  </section>
)
