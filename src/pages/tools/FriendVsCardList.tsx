import { A } from '@solidjs/router'
import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, For, Show } from 'solid-js'
import { AppSelect } from '../../components/common/AppSelect'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import type { FriendComparisonDifficulty } from '../../types/api'
import type { FriendVsItem, FriendVsSortKey } from '../../utils/friendVs'
import { getFriendVsChartDisplay, getFriendVsSongPath } from '../../utils/friendVs'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import type { SortDirection } from '../../utils/sortingQuery'
import { FriendVsScore } from './FriendVsScore'
import {
  FRIEND_VS_CARD_ROW_HEIGHT,
  FRIEND_VS_COPY,
  FRIEND_VS_RESULT_LABELS,
  FRIEND_VS_RESULT_TONES,
  FRIEND_VS_SORT_DIRECTIONS,
  FRIEND_VS_SORT_OPTIONS,
} from './friendVs.constants'

/**
 * 楽曲ごとの自分とフレンドのスコアをカードで表示する。
 *
 * @param props - 比較行とリンク先の難易度。
 * @returns スコア差と勝者の強調を含むカード。
 */
const FriendVsCard = (props: {
  item: FriendVsItem
  difficulty: FriendComparisonDifficulty
}): JSX.Element => {
  const chartConst = createMemo(() => getFriendVsChartDisplay(props.item))

  return (
    <article class="flex h-full flex-col rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
      <div class="flex min-w-0 items-start gap-3">
        <A
          href={getFriendVsSongPath(props.item, props.difficulty)}
          class="flex min-w-0 flex-1 flex-col font-sans text-link hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
          title={props.item.song.title}
        >
          <span class="truncate font-semibold">{props.item.song.title}</span>
          <span class="truncate text-xs text-text-muted">{props.item.song.artist}</span>
        </A>
        <span class="shrink-0 rounded bg-surface-muted px-2 py-1 font-sans text-xs">
          {props.difficulty === "WORLD'S END"
            ? FRIEND_VS_COPY.worldsendLevel
            : FRIEND_VS_COPY.constant}{' '}
          <span
            class={`${props.difficulty === "WORLD'S END" ? 'font-sans' : 'font-oswald'} font-semibold ${chartConst().className}`}
          >
            {chartConst().valueText}
            <Show when={chartConst().markerText}>
              {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
            </Show>
          </span>
        </span>
      </div>

      <div class="mt-auto grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 pt-3 text-center">
        <div class="min-w-0">
          <div class="font-sans text-xs text-text-muted">{FRIEND_VS_COPY.selfScore}</div>
          <FriendVsScore item={props.item} side="self" size="card" />
        </div>
        <div class="min-w-0 px-1">
          <Show when={props.item.self.is_played && props.item.friend.is_played}>
            <div
              class={`font-sans text-xs font-bold tracking-wide ${FRIEND_VS_RESULT_TONES[props.item.result].text}`}
            >
              {FRIEND_VS_RESULT_LABELS[props.item.result]}
            </div>
          </Show>
          <div class="font-sans text-xs text-text-muted">{FRIEND_VS_COPY.difference}</div>
          <div
            class={`font-oswald text-sm tabular-nums ${getScoreDifferenceClass(props.item.score_difference)}`}
          >
            {formatScoreDifference(props.item.score_difference)}
          </div>
        </div>
        <div class="min-w-0">
          <div class="font-sans text-xs text-text-muted">{FRIEND_VS_COPY.friendScore}</div>
          <FriendVsScore item={props.item} side="friend" size="card" />
        </div>
      </div>
    </article>
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
  const cards = createWindowVirtualTable<
    HTMLDivElement,
    HTMLUListElement,
    HTMLDivElement,
    HTMLLIElement
  >({
    rowCount: () => props.items.length,
    rowHeight: FRIEND_VS_CARD_ROW_HEIGHT,
    initialOffset: props.initialScrollOffset,
    resetOnRowCountChange: true,
    layoutDeps: () => props.resetKey,
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
      <ul
        ref={cards.setTableBodyRef}
        class="relative mx-auto w-full max-w-3xl"
        style={{ height: `${cards.getTotalSize()}px` }}
      >
        <For each={cards.virtualRows()}>
          {(virtualRow) => {
            const item = createMemo(() => props.items[virtualRow.index])
            return (
              <Show when={item()} keyed>
                {(current) => (
                  <li
                    class="absolute left-0 top-0 h-36 w-full"
                    style={{
                      transform: `translateY(${virtualRow.start - cards.scrollMargin()}px)`,
                    }}
                    aria-posinset={virtualRow.index + 1}
                    aria-setsize={props.items.length}
                  >
                    <FriendVsCard item={current} difficulty={props.difficulty} />
                  </li>
                )}
              </Show>
            )
          }}
        </For>
      </ul>
    </div>
  )
}
