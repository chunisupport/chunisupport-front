import { A, useSearchParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { Swords } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import { AppButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { createWindowVirtualTable } from '../../components/common/createWindowVirtualTable'
import { getSortAriaValue, SortableHeaderButton } from '../../components/common/SortableTableHeader'
import {
  COMPACT_VIRTUAL_TABLE_CELL_CLASS,
  COMPACT_VIRTUAL_TABLE_HEADER_CLASS,
  COMPACT_VIRTUAL_TABLE_ROW_HEIGHT,
} from '../../components/common/virtualTableStyles'
import { Loading } from '../../components/Loading'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { buildSongDetailPath, FRIEND_VS_PATH, FRIENDS_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { friendComparisonQueryOptions } from '../../queries/friendComparisons'
import { friendsQueryOptions } from '../../queries/friends'
import { authSession } from '../../stores/authSession'
import type { FriendScoreComparisonItemDTO, PlayerDataDifficulty } from '../../types/api'
import { formatChartConst } from '../../utils/chartConstFormat'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import type { FriendVsResultFilter, FriendVsSortKey } from '../../utils/friendVs'
import { filterFriendVsItems, sortFriendVsItems } from '../../utils/friendVs'
import { formatInteger } from '../../utils/numberFormat'
import { formatScoreDifference, getScoreDifferenceClass } from '../../utils/scoreDifference'
import { nextSortState, type SortDirection } from '../../utils/sortingQuery'
import { FriendVsSummary } from './FriendVsSummary'
import {
  FRIEND_VS_COPY,
  FRIEND_VS_DEFAULT_DIFFICULTY,
  FRIEND_VS_GRID_COLUMNS,
  FRIEND_VS_RESULT_OPTIONS,
} from './friendVs.constants'

type SelectOption<T extends string> = { value: T; label: string }

/**
 * プレイ状態に応じたスコア表記を返す。
 *
 * @param played - レコードが存在するか。
 * @param score - APIが返したスコア。
 * @returns 未プレイの区別を含む表示文言。
 */
const formatComparisonScore = (played: boolean, score: number): string =>
  played ? formatInteger(score) : FRIEND_VS_COPY.unplayed

/**
 * スコア比較結果を仮想化テーブルで表示する。
 *
 * @param props - 表示する行、難易度、条件変更を識別するキー。
 * @returns 譜面単位のスコア比較表。
 */
const ComparisonTable = (props: {
  items: FriendScoreComparisonItemDTO[]
  difficulty: PlayerDataDifficulty
  resetKey: string
}): JSX.Element => {
  const [sortKey, setSortKey] = createSignal<FriendVsSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const sortedItems = createMemo(() => sortFriendVsItems(props.items, sortKey(), sortDirection()))
  const table = createWindowVirtualTable<
    HTMLDivElement,
    HTMLTableSectionElement,
    HTMLDivElement,
    HTMLTableRowElement
  >({
    rowCount: () => sortedItems().length,
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
    const next = nextSortState(sortKey(), sortDirection(), key)
    setSortKey(next.sortKey)
    setSortDirection(next.sortDirection)
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
      aria-sort={getSortAriaValue(sortKey() === key, sortDirection())}
      class={`${COMPACT_VIRTUAL_TABLE_HEADER_CLASS} text-xs ${align === 'start' ? 'justify-start px-3 text-left' : 'justify-center px-0 text-center'}`}
    >
      <SortableHeaderButton
        label={label}
        active={sortKey() === key}
        direction={sortDirection()}
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
      <table class="block w-full min-w-[43rem] text-sm" aria-rowcount={sortedItems().length + 1}>
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
              const item = createMemo(() => sortedItems()[virtualRow.index])
              return (
                <Show when={item()} keyed>
                  {(current) => (
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
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost tabular-nums`}
                      >
                        {formatChartConst(current.chart.const)}
                        <Show when={current.chart.is_const_unknown}>
                          <span class="ml-1 font-sans text-xs text-text-muted">
                            {FRIEND_VS_COPY.unknownConst}
                          </span>
                        </Show>
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center tabular-nums`}
                      >
                        <span class={current.self.is_played ? 'font-jost' : 'font-sans'}>
                          {formatComparisonScore(current.self.is_played, current.self.score)}
                        </span>
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center tabular-nums`}
                      >
                        <span class={current.friend.is_played ? 'font-jost' : 'font-sans'}>
                          {formatComparisonScore(current.friend.is_played, current.friend.score)}
                        </span>
                      </td>
                      <td
                        class={`${COMPACT_VIRTUAL_TABLE_CELL_CLASS} justify-center px-0 text-center font-jost font-semibold tabular-nums ${getScoreDifferenceClass(current.score_difference)}`}
                      >
                        {formatScoreDifference(current.score_difference)}
                      </td>
                    </tr>
                  )}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}

/**
 * 承認済みフレンドとの難易度別スコア比較画面を表示する。
 *
 * @returns フレンド選択と比較結果のツール画面。
 */
const FriendVsPage = (): JSX.Element => {
  const tool = getToolLink(FRIEND_VS_PATH)
  useDocumentTitle(tool.title)
  const [searchParams, setSearchParams] = useSearchParams<{ friend?: string }>()
  const username = () => authSession.user?.username ?? null
  const friends = useQuery(() => friendsQueryOptions(username()))
  const selectedFriend = createMemo(
    () => friends.data?.find((friend) => friend.username === searchParams.friend) ?? null
  )
  const [difficulty, setDifficulty] = createSignal<PlayerDataDifficulty>(
    FRIEND_VS_DEFAULT_DIFFICULTY
  )
  const [resultFilter, setResultFilter] = createSignal<SelectOption<FriendVsResultFilter>>(
    FRIEND_VS_RESULT_OPTIONS[0]
  )
  const comparison = useQuery(() =>
    friendComparisonQueryOptions(username(), selectedFriend()?.username ?? null, difficulty())
  )
  const items = createMemo(() =>
    filterFriendVsItems(comparison.data?.items ?? [], resultFilter().value)
  )
  const resetKey = createMemo(
    () => `${selectedFriend()?.username ?? ''}|${difficulty()}|${resultFilter().value}`
  )

  return (
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Swords class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{tool.title}</h1>
          <p class="mt-1 font-sans text-sm text-text-muted">{tool.description}</p>
        </div>
      </header>

      <Show
        when={!friends.isLoading}
        fallback={
          <div class="h-24">
            <Loading ariaLabel={FRIEND_VS_COPY.loadingFriends} />
          </div>
        }
      >
        <Show
          when={!friends.isError}
          fallback={
            <div class="rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger">
              {toUserFriendlyErrorMessage(friends.error)}{' '}
              <AppButton size="sm" onClick={() => friends.refetch()}>
                {FRIEND_VS_COPY.reload}
              </AppButton>
            </div>
          }
        >
          <Show
            when={(friends.data?.length ?? 0) > 0}
            fallback={
              <p class="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
                {FRIEND_VS_COPY.noFriends}{' '}
                <A href={FRIENDS_PATH} class="text-link underline">
                  {FRIEND_VS_COPY.openFriends}
                </A>
              </p>
            }
          >
            <div class="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
              <AppSelect
                options={friends.data ?? []}
                optionValue="username"
                optionTextValue="username"
                value={selectedFriend()}
                onChange={(friend) => setSearchParams({ friend: friend?.username })}
                label={FRIEND_VS_COPY.selectFriend}
                formatLabel={(friend) => friend.player_name || `@${friend.username}`}
                placeholder={FRIEND_VS_COPY.selectPrompt}
                rootClass="font-sans"
              />
              <AppSelect<PlayerDataDifficulty>
                options={[...PLAYER_DATA_DIFFICULTIES]}
                value={difficulty()}
                onChange={(value) => value && setDifficulty(value)}
                label={FRIEND_VS_COPY.selectDifficulty}
              />
            </div>

            <Show
              when={selectedFriend()}
              fallback={
                <p class="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
                  {FRIEND_VS_COPY.selectPrompt}
                </p>
              }
            >
              <Show
                when={!comparison.isLoading}
                fallback={
                  <div class="h-40">
                    <Loading ariaLabel={FRIEND_VS_COPY.loadingComparison} />
                  </div>
                }
              >
                <Show
                  when={!comparison.isError}
                  fallback={
                    <div class="rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger">
                      {toUserFriendlyErrorMessage(comparison.error)}{' '}
                      <AppButton size="sm" onClick={() => comparison.refetch()}>
                        {FRIEND_VS_COPY.reload}
                      </AppButton>
                    </div>
                  }
                >
                  <Show when={comparison.data} keyed>
                    {(data) => (
                      <>
                        <FriendVsSummary comparison={data} />
                        <div class="flex flex-wrap items-end justify-between gap-3">
                          <h2 class="text-lg font-semibold">
                            {FRIEND_VS_COPY.scoreTable}{' '}
                            <span class="font-jost text-sm text-text-muted">
                              {formatInteger(items().length)}
                            </span>
                          </h2>
                          <div class="flex flex-wrap gap-2">
                            <AppSelect
                              options={[...FRIEND_VS_RESULT_OPTIONS]}
                              optionValue="value"
                              optionTextValue="label"
                              value={resultFilter()}
                              onChange={(value) => value && setResultFilter(value)}
                              label={FRIEND_VS_COPY.selectResult}
                              rootClass="w-40"
                              formatLabel={(value) => value.label}
                            />
                          </div>
                        </div>
                        <Show
                          when={items().length > 0}
                          fallback={
                            <p class="rounded-lg border border-border bg-surface p-6 text-center text-sm text-text-muted">
                              {FRIEND_VS_COPY.emptyCharts}
                            </p>
                          }
                        >
                          <ComparisonTable
                            items={items()}
                            difficulty={difficulty()}
                            resetKey={resetKey()}
                          />
                        </Show>
                      </>
                    )}
                  </Show>
                </Show>
              </Show>
            </Show>
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default FriendVsPage
