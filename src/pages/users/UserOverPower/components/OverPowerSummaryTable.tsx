import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types'

type Props = {
  rows: OverPowerSummaryRow[]
  countLabel: string
}

const formatValue = (value: number): string => value.toFixed(3)
const formatPercent = (value: number): string => value.toFixed(2)

export const OverPowerSummaryTable: Component<Props> = (props) => (
  <section class="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <Show
      when={props.rows.length > 0}
      fallback={<p class="px-3 py-4 text-sm text-gray-500">表示できるデータがありません。</p>}
    >
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th class="px-3 py-2 text-left font-medium" aria-label="項目"></th>
              <th class="px-3 py-2 text-right font-medium">現在値</th>
              <th class="px-3 py-2 text-right font-medium">理論値</th>
              <th class="px-3 py-2 text-right font-medium">達成率</th>
              <th class="px-3 py-2 text-right font-medium">{props.countLabel}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <For each={props.rows}>
              {(row) => (
                <tr>
                  <th class="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-900">
                    {row.label}
                  </th>
                  <td class="px-3 py-2 text-right tabular-nums">{formatValue(row.current)}</td>
                  <td class="px-3 py-2 text-right tabular-nums text-gray-600">
                    {formatValue(row.max)}
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums text-gray-600">
                    {formatPercent(row.percent)}%
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums text-gray-600">{row.count}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </Show>
  </section>
)
