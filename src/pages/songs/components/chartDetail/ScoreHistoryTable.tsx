import { createMemo, For, Show } from 'solid-js'
import { DefaultRecordLampBadges } from '../../../../components/common/record/RecordDisplayParts'
import type { ScoreHistoryEntryDTO, VersionSummaryDTO } from '../../../../types/api'
import {
  buildScoreHistoryTableRows,
  formatScoreHistoryDateTime,
} from '../../../../utils/scoreHistory'
import {
  CURRENT_BEST_LABEL,
  SCORE_HISTORY_LAMP_LABEL,
  SCORE_HISTORY_SCORE_LABEL,
  SCORE_HISTORY_TABLE_MIN_WIDTH_CLASS,
  SCORE_HISTORY_UPDATED_AT_LABEL,
} from './constants'

/**
 * 現行ベストを先頭とするスコア履歴を表形式で表示する。
 *
 * @param props - 表示対象のスコア履歴、バージョン一覧、境界行の表示状態。
 * @returns スコア履歴テーブル。
 */
const ScoreHistoryTable = (props: {
  entries: readonly ScoreHistoryEntryDTO[]
  versions: readonly VersionSummaryDTO[]
  showVersions: boolean
}) => {
  const rows = createMemo(() =>
    props.showVersions
      ? buildScoreHistoryTableRows(props.entries, props.versions)
      : props.entries.map((entry) => ({ type: 'score' as const, entry }))
  )

  return (
    <div class="overflow-x-auto rounded-lg border border-border bg-surface">
      <table class={`w-full table-fixed border-collapse ${SCORE_HISTORY_TABLE_MIN_WIDTH_CLASS}`}>
        <thead class="bg-surface-muted text-center text-xs text-text-muted">
          <tr>
            <th scope="col" class="px-3 py-2 text-left sm:px-4">
              {SCORE_HISTORY_UPDATED_AT_LABEL}
            </th>
            <th scope="col" class="w-32 px-3 py-2 text-right sm:w-44 sm:px-4">
              {SCORE_HISTORY_SCORE_LABEL}
            </th>
            <th scope="col" class="w-36 px-3 py-2 sm:px-4">
              {SCORE_HISTORY_LAMP_LABEL}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <For each={rows()}>
            {(row, index) => (
              <Show
                when={row.type === 'score' ? row.entry : undefined}
                fallback={
                  <tr>
                    <td
                      colspan="3"
                      class="bg-surface-muted px-3 py-1 text-center font-sans text-xs font-semibold text-text-muted sm:px-4"
                    >
                      {row.type === 'version' ? row.name : ''}
                    </td>
                  </tr>
                }
              >
                {(entry) => (
                  <tr>
                    <td class="px-3 py-3 text-sm sm:px-4">
                      <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <span>{formatScoreHistoryDateTime(entry().updated_at)}</span>
                        <Show when={index() === 0}>
                          <span class="rounded-full bg-action-primary-muted px-2 py-0.5 text-xs font-semibold text-action-primary">
                            {CURRENT_BEST_LABEL}
                          </span>
                        </Show>
                      </div>
                    </td>
                    <td class="px-3 py-3 text-right font-jost text-lg font-semibold tabular-nums sm:px-4">
                      {entry().score.toLocaleString('ja-JP')}
                    </td>
                    <td class="px-3 py-3 sm:px-4">
                      <DefaultRecordLampBadges record={entry()} class="justify-center" />
                    </td>
                  </tr>
                )}
              </Show>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default ScoreHistoryTable
