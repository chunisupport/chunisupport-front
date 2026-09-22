import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, For, Show } from 'solid-js'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { getSortAriaValue, SortableHeaderButton } from '../../components/common/SortableTableHeader'
import {
  COMPACT_VIRTUAL_TABLE_CELL_CLASS,
  COMPACT_VIRTUAL_TABLE_HEADER_CLASS,
  COMPACT_VIRTUAL_TABLE_ROW_HEIGHT,
} from '../../components/common/virtualTableStyles'
import { buildSongDetailPath } from '../../constants/routes'
import type { FriendScoreComparisonItemDTO, PlayerDataDifficulty } from '../../types/api'
import { getConstDisplay } from '../../utils/constDisplay'
import type { FriendVsSortKey } from '../../utils/friendVs'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import { nextSortState, type SortDirection } from '../../utils/sortingQuery'
import { FriendVsScore } from './FriendVsScore'
import { FRIEND_VS_COPY, FRIEND_VS_GRID_COLUMNS } from './friendVs.constants'
/**
 * スコア比較結果を仮想化テーブルで表示する。
 *
 * @param props - 並び替え済みの行、難易度、並び替え操作、先頭復帰キー。
 * @returns 譜面単位のスコア比較表。
 */
export const FriendVsTable = (props: {
  items: FriendScoreComparisonItemDTO[]
  difficulty: PlayerDataDifficulty
  resetKey: string
  sortKey: FriendVsSortKey | null
  sortDirection: SortDirection | null
  onSortChange: (key: FriendVsSortKey | null, direction: SortDirection | null) => void
}): JSX.Element => {
  const table = createWindowVirtualTable<
    HTMLDivElement,
    HTMLTableSectionElement,
    HTMLDivElement,
    HTMLTableRowElement
  >({
    rowCount: () => props.items.length,
    rowHeight: COMPACT_VIRTUAL_TABLE_ROW_HEIGHT,
    resetOnRowCountChange: true,
    layoutDeps: () => props.resetKey,
  })
  createEffect((previous?: string) => {
    const next = props.resetKey
    if (previous !== undefined && previous !== next) table.resetToTop()
    return next
  })

  /**
   * 選択列の昇順・降順・解除を切り替え、先頭行へ戻す。
   *
   * @param key - 操作された列。
   * @returns なし。
   */
  const handleSortChange = (key: FriendVsSortKey): void => {
    const next = nextSortState(props.sortKey, props.sortDirection, key)
    props.onSortChange(next.sortKey, next.sortDirection)
    table.resetToTop()
  }

  /**
   * 列のソート状態を含むヘッダーセルを表示する。
   *
   * @param label - 列の表示名。
   * @param key - 並び替えに使う列。
   * @param align - 見出しの配置。
   * @returns キーボードでも操作できるヘッダーセル。
   */
  const header = (
    label: string,
    key: FriendVsSortKey,
    align: 'start' | 'center' = 'center'
  ): JSX.Element => (
    <th
      scope="col"
      aria-sort={getSortAriaValue(props.sortKey === key, props.sortDirection)}
      class={`${COMPACT_VIRTUAL_TABLE_HEADER_CLASS} text-xs ${align === 'start' ? 'justify-start px-3 text-left' : 'justify-center px-0 text-center'}`}
    >
      <SortableHeaderButton
        label={label}
        active={props.sortKey === key}
        direction={props.sortDirection}
        align={align}
        class={align === 'start' ? 'min-h-8! justify-start' : 'min-h-8! justify-center'}
        onClick={() => handleSortChange(key)}
      />
    </th>
  )

  return (
    <div
      ref={table.setTableContainerRef}
      class="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-surface"
    >
      <table class="block w-full min-w-[43rem] text-sm" aria-rowcount={props.items.length + 1}>
        <caption class="sr-only">{FRIEND_VS_COPY.scoreTableCaption}</caption>
        <thead class="block">
          <tr class="grid" style={{ 'grid-template-columns': FRIEND_VS_GRID_COLUMNS }}>
            {header(FRIEND_VS_COPY.song, 'title', 'start')}
            {header(FRIEND_VS_COPY.constant, 'const')}
            {header(FRIEND_VS_COPY.selfScore, 'selfScore')}
            {header(FRIEND_VS_COPY.friendScore, 'friendScore')}
            {header(FRIEND_VS_COPY.difference, 'difference')}
          </tr>
        </thead>
        <tbody
          ref={table.setTableBodyRef}
          class="relative block min-w-full"
          style={{ height: `${table.getTotalSize()}px` }}
        >
          <For each={table.virtualRows()}>
            {(virtualRow) => {
              const item = createMemo(() => props.items[virtualRow.index])
              return (
                <Show when={item()} keyed>
                  {(current) => {
                    const constDisplay = getConstDisplay(
                      current.chart.const,
                      current.chart.is_const_unknown
                    )
                    return (
                      <tr
                        class="absolute left-0 top-0 grid min-w-full border-t border-border hover:bg-surface-muted"
                        style={{
                          'grid-template-columns': FRIEND_VS_GRID_COLUMNS,
                          transform: `translateY(${virtualRow.start - table.scrollMargin()}px)`,
                        }}
                        aria-rowindex={virtualRow.index + 2}
                      >
                        <th
                          scope="row"
                          class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} min-w-0 p-0 text-left font-medium`}
                        >
                          <A
                            href={buildSongDetailPath(current.song.id, props.difficulty)}
                            class="flex h-full w-full min-w-0 items-center px-3 font-sans text-link hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                            title={current.song.title}
                          >
                            <span class="truncate">{current.song.title}</span>
                          </A>
                        </th>
                        <td
                          class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center overflow-hidden whitespace-nowrap px-1 text-center font-jost tabular-nums`}
                        >
                          <span class={`leading-none ${constDisplay.className}`}>
                            {constDisplay.valueText}
                            <Show when={constDisplay.markerText}>
                              {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
                            </Show>
                          </span>
                        </td>
                        <td
                          class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center tabular-nums`}
                        >
                          <FriendVsScore
                            record={current.self}
                            winner={current.result === 'SELF_WIN'}
                            size="table"
                          />
                        </td>
                        <td
                          class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center tabular-nums`}
                        >
                          <FriendVsScore
                            record={current.friend}
                            winner={current.result === 'FRIEND_WIN'}
                            size="table"
                          />
                        </td>
                        <td
                          class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost font-semibold tabular-nums ${getScoreDifferenceClass(current.score_difference)}`}
                        >
                          {formatScoreDifference(current.score_difference)}
                        </td>
                      </tr>
                    )
                  }}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}
