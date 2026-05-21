import type { Component } from 'solid-js'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'

type Props = {
  summary: OverPowerSummaryRow
}

const formatValue = formatOverPowerValue
const formatPercent = formatOverPowerPercent

export const OverPowerAllSummary: Component<Props> = (props) => (
  <section class="rounded-lg border border-sky-200 bg-sky-50 p-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-sky-900">TOTAL OVER POWER</h2>
        <p class="mt-1 text-3xl font-bold tabular-nums text-sky-950">
          {formatValue(props.summary.current)}
        </p>
      </div>
      <div class="text-right text-sm text-sky-900">
        <p>
          {formatPercent(props.summary.percent)}% / {formatValue(props.summary.max)}
        </p>
        <p>{props.summary.count} 曲</p>
      </div>
    </div>
  </section>
)
