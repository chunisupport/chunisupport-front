import type { Component } from 'solid-js'
import { createMemo, For } from 'solid-js'
import type { PlayerMetricHistoryEntryDTO } from '../../../types/api'
import { formatFixed } from '../../../utils/numberFormat'
import {
  formatPlayerMetricHistoryDateTime,
  sortPlayerMetricHistoryEntries,
} from '../../../utils/playerMetricHistory'
import {
  PLAYER_METRIC_HISTORY_COPY,
  PLAYER_METRIC_HISTORY_DECIMAL_PLACES,
  PLAYER_METRIC_HISTORY_TABLE_MIN_WIDTH_CLASS,
} from './constants'

type Props = {
  /** APIが返した公式指標履歴。 */
  entries: readonly PlayerMetricHistoryEntryDTO[]
}

/**
 * 公式RATINGと公式OVER POWERの履歴を新しい順の表で表示する。
 *
 * @param props - APIが返した公式指標履歴。
 * @returns グラフと同じデータを確認できるセマンティックな履歴表。
 */
export const RatingOpHistoryTable: Component<Props> = (props) => {
  const entries = createMemo(() => sortPlayerMetricHistoryEntries(props.entries, 'descending'))

  return (
    <section class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <h2 class="border-b border-border px-4 py-3 text-lg font-semibold text-text">
        {PLAYER_METRIC_HISTORY_COPY.tableTitle}
      </h2>
      <div class="overflow-x-auto">
        <table class={`w-full ${PLAYER_METRIC_HISTORY_TABLE_MIN_WIDTH_CLASS}`}>
          <caption class="sr-only">{PLAYER_METRIC_HISTORY_COPY.tableCaption}</caption>
          <thead class="bg-surface-muted text-xs text-text-muted">
            <tr>
              <th scope="col" class="px-4 py-2 text-left font-medium">
                {PLAYER_METRIC_HISTORY_COPY.collectedAt}
              </th>
              <th scope="col" class="px-4 py-2 text-right font-medium">
                {PLAYER_METRIC_HISTORY_COPY.rating}
              </th>
              <th scope="col" class="px-4 py-2 text-right font-medium">
                {PLAYER_METRIC_HISTORY_COPY.overPower}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <For each={entries()}>
              {(entry) => (
                <tr>
                  <td class="whitespace-nowrap px-4 py-3 font-jost text-sm tabular-nums text-text-muted">
                    <time dateTime={entry.data_collected_at}>
                      {formatPlayerMetricHistoryDateTime(entry.data_collected_at)}
                    </time>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right font-jost text-base font-semibold tabular-nums text-text">
                    {formatFixed(entry.rating, PLAYER_METRIC_HISTORY_DECIMAL_PLACES)}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right font-jost text-base font-semibold tabular-nums text-text">
                    {formatFixed(entry.overpower, PLAYER_METRIC_HISTORY_DECIMAL_PLACES)}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </section>
  )
}
