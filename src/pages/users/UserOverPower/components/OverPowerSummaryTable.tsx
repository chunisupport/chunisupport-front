import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types.ts'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat.ts'

type Props = {
  rows: OverPowerSummaryRow[]
  countLabel: string
}

const formatValue = formatOverPowerValue
const formatPercent = formatOverPowerPercent

export const OverPowerSummaryTable: Component<Props> = (props) => (
  <section class="overflow-hidden rounded-lg border border-border bg-surface">
    <Show
      when={props.rows.length > 0}
      fallback={<p class="px-3 py-4 text-sm text-text-subtle">表示できるデータがありません。</p>}
    >
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-surface-muted text-xs text-text-muted">
            <tr>
              <th class="w-full px-3 py-2 text-left font-medium" scope="col">
                <span class="sr-only">項目</span>
              </th>
              <th class="whitespace-nowrap px-2 py-2 text-right font-medium" scope="col">
                現在値
              </th>
              <th class="whitespace-nowrap px-2 py-2 text-right font-medium" scope="col">
                理論値
              </th>
              <th class="whitespace-nowrap px-2 py-2 text-right font-medium" scope="col">
                達成率
              </th>
              <th class="whitespace-nowrap px-2 py-2 text-right font-medium" scope="col">
                {props.countLabel}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <For each={props.rows}>
              {(row) => (
                <tr>
                  <th
                    scope="row"
                    class="w-full whitespace-nowrap px-3 py-2 text-left font-medium text-text"
                  >
                    {row.label}
                  </th>
                  <td class="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                    {formatValue(row.current)}
                  </td>
                  <td class="whitespace-nowrap px-2 py-2 text-right tabular-nums text-text-muted">
                    {formatValue(row.max)}
                  </td>
                  <td class="whitespace-nowrap px-2 py-2 text-right tabular-nums text-text-muted">
                    {formatPercent(row.percent)}%
                  </td>
                  <td class="whitespace-nowrap px-2 py-2 text-right tabular-nums text-text-muted">
                    {row.count}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </Show>
  </section>
)
