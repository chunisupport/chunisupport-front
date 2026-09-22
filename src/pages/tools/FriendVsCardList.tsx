import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, For, Show } from 'solid-js'
import { AppSelect } from '../../components/common/AppSelect'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { buildSongDetailPath } from '../../constants/routes'
import type { FriendScoreComparisonItemDTO, PlayerDataDifficulty } from '../../types/api'
import { getConstDisplay } from '../../utils/constDisplay'
import type { FriendVsSortKey } from '../../utils/friendVs'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import type { SortDirection } from '../../utils/sortingQuery'
import { FriendVsScore } from './FriendVsScore'
import {
  FRIEND_VS_CARD_ROW_HEIGHT,
  FRIEND_VS_COPY,
  FRIEND_VS_RESULT_LABELS,
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
  item: FriendScoreComparisonItemDTO
  difficulty: PlayerDataDifficulty
}): JSX.Element => {
  const chartConst = createMemo(() =>
    getConstDisplay(props.item.chart.const, props.item.chart.is_const_unknown)
  )

  return (
    <article class="flex h-full flex-col rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
      <div class="flex min-w-0 items-start gap-3">
        <A
          href={buildSongDetailPath(props.item.song.id, props.difficulty)}
          class="flex min-w-0 flex-1 flex-col font-sans text-link hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
          title={props.item.song.title}
        >
          <span class="truncate font-semibold">{props.item.song.title}</span>
          <span class="truncate text-xs text-text-muted">{props.item.song.artist}</span>
        </A>
        <span class="shrink-0 rounded bg-surface-muted px-2 py-1 font-sans text-xs">
          {FRIEND_VS_COPY.constant}{' '}
          <span class={`font-jost font-semibold ${chartConst().className}`}>
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
          <FriendVsScore
            record={props.item.self}
            winner={props.item.result === 'SELF_WIN'}
            size="card"
          />
        </div>
        <div class="min-w-0 px-1">
          <Show when={props.item.self.is_played && props.item.friend.is_played}>
            <div class="font-sans text-xs font-semibold text-text-muted">
              {FRIEND_VS_RESULT_LABELS[props.item.result]}
            </div>
          </Show>
          <div class="font-sans text-xs text-text-muted">{FRIEND_VS_COPY.difference}</div>
          <div
            class={`font-jost text-sm tabular-nums ${getScoreDifferenceClass(props.item.score_difference)}`}
          >
            {formatScoreDifference(props.item.score_difference)}
          </div>
        </div>
        <div class="min-w-0">
          <div class="font-sans text-xs text-text-muted">{FRIEND_VS_COPY.friendScore}</div>
          <FriendVsScore
            record={props.item.friend}
            winner={props.item.result === 'FRIEND_WIN'}
            size="card"
          />
        </div>
      </div>
    </article>
  )
}

/**
 * 比較カードを並び替え可能な仮想リストとして表示する。
 *
 * @param props - 並び替え済みの比較行、難易度、並び替え操作、先頭復帰キー。
 * @returns 並び替え欄と仮想化したカード一覧。
 */
export const FriendVsCardList = (props: {
  items: FriendScoreComparisonItemDTO[]
  difficulty: PlayerDataDifficulty
  resetKey: string
  sortKey: FriendVsSortKey | null
  sortDirection: SortDirection | null
  onSortChange: (key: FriendVsSortKey | null, direction: SortDirection | null) => void
}): JSX.Element => {
  const sortOption = () =>
    FRIEND_VS_SORT_OPTIONS.find((option) => option.value === (props.sortKey ?? 'default')) ??
    FRIEND_VS_SORT_OPTIONS[0]
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
          options={[...FRIEND_VS_SORT_OPTIONS]}
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
