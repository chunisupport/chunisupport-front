import { createMemo, For, Show } from 'solid-js'
import { CourseRecordLampBadges } from '../../../../components/common/course/CourseRecordParts'
import { DefaultRecordLampBadges } from '../../../../components/common/record/RecordDisplayParts'
import type {
  CourseScoreHistoryEntryDTO,
  ScoreHistoryEntryDTO,
  VersionSummaryDTO,
} from '../../../../types/api'
import {
  buildScoreHistoryTableRows,
  formatScoreHistoryDateTime,
} from '../../../../utils/scoreHistory'
import {
  CURRENT_BEST_LABEL,
  SCORE_HISTORY_LAMP_LABEL,
  SCORE_HISTORY_SCORE_LABEL,
  SCORE_HISTORY_SECTION_LABEL,
  SCORE_HISTORY_UPDATED_AT_LABEL,
} from './constants'

/**
 * ダイアログ内の幅に合わせてスコア履歴を3列で表示し、先頭の現行ベストを強調する。
 *
 * @param props - 表示対象のスコア履歴、バージョン一覧、境界行の表示状態。
 * @returns スコア履歴テーブル。
 */
const ScoreHistoryTable = (props: {
  entries: readonly (ScoreHistoryEntryDTO | CourseScoreHistoryEntryDTO)[]
  versions?: readonly VersionSummaryDTO[]
  showVersions?: boolean
}) => {
  const rows = createMemo(() =>
    props.showVersions && props.versions
      ? buildScoreHistoryTableRows(props.entries, props.versions)
      : props.entries.map((entry) => ({ type: 'score' as const, entry }))
  )

  return (
    <section
      class="@container overflow-x-auto rounded-lg border border-border bg-surface"
      aria-label={SCORE_HISTORY_SECTION_LABEL}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: 横スクロール領域をキーボードでも操作できるようにする。
      tabIndex={0}
    >
      <table class="w-full border-collapse @lg:table-fixed">
        <thead class="bg-surface-muted text-center text-xs text-text-muted">
          <tr>
            <th scope="col" class="px-1 py-2 @lg:px-4">
              {SCORE_HISTORY_UPDATED_AT_LABEL}
            </th>
            <th scope="col" class="px-1 py-2 @lg:w-44 @lg:px-4">
              {SCORE_HISTORY_SCORE_LABEL}
            </th>
            <th scope="col" class="px-1 py-2 @lg:w-36 @lg:px-4">
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
                      class="bg-surface-muted px-1 py-1 text-center font-sans text-xs font-semibold wrap-anywhere text-text-muted @lg:px-4"
                    >
                      {row.type === 'version' ? row.name : ''}
                    </td>
                  </tr>
                }
              >
                {(entry) => (
                  <tr classList={{ 'bg-action-primary-muted': index() === 0 }}>
                    <td class="px-1 py-3 text-xs whitespace-nowrap @lg:px-4 @lg:text-sm">
                      <Show when={index() === 0}>
                        <span class="sr-only">{CURRENT_BEST_LABEL} </span>
                      </Show>
                      {formatScoreHistoryDateTime(entry().updated_at)}
                    </td>
                    <td class="px-1 py-3 text-right font-jost text-base font-semibold whitespace-nowrap tabular-nums @lg:px-4 @lg:text-lg">
                      {entry().score.toLocaleString('ja-JP')}
                    </td>
                    <td class="px-1 py-3 @lg:px-4">
                      {(() => {
                        const record = entry()
                        return 'is_clear' in record ? (
                          <CourseRecordLampBadges record={record} class="justify-center" />
                        ) : (
                          <DefaultRecordLampBadges record={record} class="justify-center" />
                        )
                      })()}
                    </td>
                  </tr>
                )}
              </Show>
            )}
          </For>
        </tbody>
      </table>
    </section>
  )
}

export default ScoreHistoryTable
