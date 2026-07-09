import { For, Show } from 'solid-js'
import type { ScoreHistoryEntryDTO } from '../../../types/api'
import { formatScoreHistoryDateTime } from '../../../utils/scoreHistory'
import {
  CURRENT_BEST_LABEL,
  SCORE_HISTORY_SCORE_LABEL,
  SCORE_HISTORY_UPDATED_AT_LABEL,
} from './constants'

/**
 * 現行ベストを先頭とするスコア履歴を表形式で表示する。
 *
 * @param props - 表示対象のスコア履歴。
 * @returns スコア履歴テーブル。
 */
const ScoreHistoryTable = (props: { entries: readonly ScoreHistoryEntryDTO[] }) => (
  <div class="rounded-lg border border-border bg-surface">
    <table class="w-full table-fixed border-collapse">
      <thead class="bg-surface-muted text-center text-sm text-text-muted">
        <tr>
          <th scope="col" class="px-3 py-3 text-left sm:px-4">
            {SCORE_HISTORY_UPDATED_AT_LABEL}
          </th>
          <th scope="col" class="w-32 px-3 py-3 sm:w-44 sm:px-4">
            {SCORE_HISTORY_SCORE_LABEL}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <For each={props.entries}>
          {(entry, index) => (
            <tr>
              <td class="px-3 py-3 text-sm sm:px-4">
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <span>{formatScoreHistoryDateTime(entry.updated_at)}</span>
                  <Show when={index() === 0}>
                    <span class="rounded-full bg-action-primary-muted px-2 py-0.5 text-xs font-semibold text-action-primary">
                      {CURRENT_BEST_LABEL}
                    </span>
                  </Show>
                </div>
              </td>
              <td class="px-3 py-3 text-center font-jost text-lg font-semibold tabular-nums sm:px-4">
                {entry.score.toLocaleString('ja-JP')}
              </td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  </div>
)

export default ScoreHistoryTable
