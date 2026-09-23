import { A } from '@solidjs/router'
import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, For, Show } from 'solid-js'
import { AppSelect } from '../../components/common/AppSelect'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { RecordLampDots } from '../../components/common/record/RecordDisplayParts'
import { createMediaQuery } from '../../hooks/createMediaQuery'
import type { FriendComparisonDifficulty } from '../../types/api'
import type { FriendVsItem, FriendVsSortKey } from '../../utils/friendVs'
import { getFriendVsChartDisplay, getFriendVsSongPath } from '../../utils/friendVs'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import type { SortDirection } from '../../utils/sortingQuery'
import { getVirtualGridRowCount, getVirtualGridRowSlice } from '../../utils/virtualGrid'
import { FriendVsScore } from './FriendVsScore'
import {
  FRIEND_VS_CARD_COLUMN_GAP_PX,
  FRIEND_VS_CARD_ROW_HEIGHT,
  FRIEND_VS_CARD_WIDE_COLUMN_COUNT,
  FRIEND_VS_CARD_WIDE_MEDIA_QUERY,
  FRIEND_VS_COPY,
  FRIEND_VS_RESULT_LABELS,
  FRIEND_VS_RESULT_TONES,
  FRIEND_VS_SORT_DIRECTIONS,
  FRIEND_VS_SORT_OPTIONS,
} from './friendVs.constants'

/**
 * カード内の片側（自分またはフレンド）のスコアとランプを表示する。
 *
 * @param props - 比較行と表示する側。
 * @returns 中央にそろえた見出し、スコア、ランプのドット。
 */
const FriendVsCardSide = (props: { item: FriendVsItem; side: 'self' | 'friend' }): JSX.Element => (
  <div class="flex min-w-0 flex-col items-center">
    <div class="font-sans text-xs text-text-muted">
      {props.side === 'self' ? FRIEND_VS_COPY.selfScore : FRIEND_VS_COPY.friendScore}
    </div>
    <FriendVsScore item={props.item} side={props.side} size="card" />
    <RecordLampDots record={props.item[props.side]} class="mt-1" />
  </div>
)

/**
 * 楽曲ごとの自分とフレンドのスコアをカードで表示する。
 *
 * @param props - 比較行とリンク先の難易度。
 * @returns 全体が楽曲詳細へのリンクになった、スコア差と勝者の強調を含むカード。
 */
const FriendVsCard = (props: {
  item: FriendVsItem
  difficulty: FriendComparisonDifficulty
}): JSX.Element => {
  const chartConst = createMemo(() => getFriendVsChartDisplay(props.item))

  return (
    <A
      href={getFriendVsSongPath(props.item, props.difficulty)}
      class="group flex h-full flex-col rounded-lg border border-border bg-surface px-4 py-3 text-inherit shadow-sm transition-colors hover:bg-interactive-row-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
    >
      <div class="flex min-w-0 items-start gap-3">
        <span
          class="min-w-0 flex-1 truncate font-sans font-semibold text-link group-hover:text-link-hover"
          title={props.item.song.title}
        >
          {props.item.song.title}
        </span>
        <span
          class={`shrink-0 rounded bg-surface-muted px-2 py-1 text-xs font-semibold ${props.difficulty === "WORLD'S END" ? 'font-sans' : 'font-jost'} ${chartConst().className}`}
        >
          {chartConst().valueText}
          <Show when={chartConst().markerText}>
            {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
          </Show>
        </span>
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 pt-2 text-center">
        <FriendVsCardSide item={props.item} side="self" />
        <div class="min-w-0">
          <Show when={props.item.self.is_played && props.item.friend.is_played}>
            <div
              class={`font-sans text-xs font-bold tracking-wide ${FRIEND_VS_RESULT_TONES[props.item.result].text}`}
            >
              {FRIEND_VS_RESULT_LABELS[props.item.result]}
            </div>
          </Show>
          <div
            class={`font-jost text-sm tabular-nums ${getScoreDifferenceClass(props.item.score_difference)}`}
          >
            {formatScoreDifference(props.item.score_difference)}
          </div>
        </div>
        <FriendVsCardSide item={props.item} side="friend" />
      </div>
    </A>
  )
}

/**
 * 比較カードを並び替え可能な仮想リストとして表示する。
 *
 * @param props - 比較行、難易度、並び替え操作、先頭復帰キー、初期スクロール位置。
 * @returns 並び替え欄と仮想化したカード一覧。
 */
export const FriendVsCardList = (props: {
  items: FriendVsItem[]
  difficulty: FriendComparisonDifficulty
  resetKey: string
  initialScrollOffset: Accessor<number>
  sortKey: FriendVsSortKey | null
  sortDirection: SortDirection | null
  onSortChange: (key: FriendVsSortKey | null, direction: SortDirection | null) => void
}): JSX.Element => {
  /** @returns WORLD'S ENDで星数用の見出しへ切り替えた並び替え候補。 */
  const sortOptions = () =>
    FRIEND_VS_SORT_OPTIONS.map((option) =>
      option.value === 'const' && props.difficulty === "WORLD'S END"
        ? { ...option, label: FRIEND_VS_COPY.worldsendLevel }
        : option
    )
  const sortOption = () =>
    sortOptions().find((option) => option.value === (props.sortKey ?? 'default')) ??
    sortOptions()[0]
  const directionOption = () =>
    FRIEND_VS_SORT_DIRECTIONS.find((option) => option.value === props.sortDirection) ??
    FRIEND_VS_SORT_DIRECTIONS[0]
  const isWide = createMediaQuery(FRIEND_VS_CARD_WIDE_MEDIA_QUERY)
  /** @returns 画面幅に応じた1行あたりのカード枚数。 */
  const columnCount = () => (isWide() ? FRIEND_VS_CARD_WIDE_COLUMN_COUNT : 1)
  const cards = createWindowVirtualTable<
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement,
    HTMLUListElement
  >({
    rowCount: () => getVirtualGridRowCount(props.items.length, columnCount()),
    rowHeight: FRIEND_VS_CARD_ROW_HEIGHT,
    initialOffset: props.initialScrollOffset,
    resetOnRowCountChange: true,
    layoutDeps: () => [props.resetKey, columnCount()],
  })

  createEffect((previous?: string) => {
    const next = props.resetKey
    if (previous !== undefined && previous !== next) cards.resetToTop()
    return next
  })

  return (
    <div ref={cards.setTableContainerRef} class="w-full">
      <div class="mb-3 flex flex-wrap items-end gap-2">
        <AppSelect
          options={sortOptions()}
          optionValue="value"
          optionTextValue="label"
          value={sortOption()}
          onChange={(value) => {
            if (!value) return
            const key = value.value === 'default' ? null : value.value
            props.onSortChange(key, key ? (props.sortDirection ?? 'asc') : null)
          }}
          label={FRIEND_VS_COPY.sortBy}
          rootClass="w-40"
          formatLabel={(value) => value.label}
        />
        <Show when={props.sortKey !== null}>
          <AppSelect
            options={[...FRIEND_VS_SORT_DIRECTIONS]}
            optionValue="value"
            optionTextValue="label"
            value={directionOption()}
            onChange={(value) => value && props.onSortChange(props.sortKey, value.value)}
            label={FRIEND_VS_COPY.sortDirection}
            rootClass="w-28"
            formatLabel={(value) => value.label}
          />
        </Show>
      </div>
      <div
        ref={cards.setTableBodyRef}
        class="relative mx-auto w-full max-w-3xl"
        style={{ height: `${cards.getTotalSize()}px` }}
      >
        <For each={cards.virtualRows()}>
          {(virtualRow) => {
            const rowItems = createMemo(() =>
              getVirtualGridRowSlice(props.items, virtualRow.index, columnCount())
            )
            return (
              <ul
                class="absolute left-0 top-0 grid h-30 w-full"
                style={{
                  'grid-template-columns': `repeat(${columnCount()}, minmax(0, 1fr))`,
                  gap: `${FRIEND_VS_CARD_COLUMN_GAP_PX}px`,
                  transform: `translateY(${virtualRow.start - cards.scrollMargin()}px)`,
                }}
              >
                <For each={rowItems()}>
                  {(item, column) => (
                    <li
                      aria-posinset={virtualRow.index * columnCount() + column() + 1}
                      aria-setsize={props.items.length}
                    >
                      <FriendVsCard item={item} difficulty={props.difficulty} />
                    </li>
                  )}
                </For>
              </ul>
            )
          }}
        </For>
      </div>
    </div>
  )
}
