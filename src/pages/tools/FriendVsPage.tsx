import { A, useSearchParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { Swords } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, onCleanup, Show } from 'solid-js'
import { AppButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { CardTableViewToggle } from '../../components/common/CardTableViewToggle'
import { Loading } from '../../components/Loading'
import { FRIEND_VS_PATH, FRIENDS_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { friendComparisonQueryOptions } from '../../queries/friendComparisons'
import { friendsQueryOptions } from '../../queries/friends'
import { authSession } from '../../stores/authSession'
import type { FriendComparisonDifficulty } from '../../types/api'
import {
  getAppMainScrollTop,
  restoreAppMainScrollOffset,
} from '../../utils/appMainScrollRestoration'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import type { FriendVsResultFilter, FriendVsSortKey } from '../../utils/friendVs'
import { filterFriendVsItems, sortFriendVsItems } from '../../utils/friendVs'
import { formatInteger } from '../../utils/numberFormat'
import type { SortDirection } from '../../utils/sortingQuery'
import { FriendVsCardList } from './FriendVsCardList'
import { FriendVsSummary } from './FriendVsSummary'
import { FriendVsTable } from './FriendVsTable'
import {
  FRIEND_VS_COPY,
  FRIEND_VS_DEFAULT_DIFFICULTY,
  FRIEND_VS_DIFFICULTY_OPTIONS,
  FRIEND_VS_RESULT_OPTIONS,
} from './friendVs.constants'

type SelectOption<T extends string> = { value: T; label: string }

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
  const [difficulty, setDifficulty] = createSignal<FriendComparisonDifficulty>(
    FRIEND_VS_DEFAULT_DIFFICULTY
  )
  const [resultFilter, setResultFilter] = createSignal<SelectOption<FriendVsResultFilter>>(
    FRIEND_VS_RESULT_OPTIONS[0]
  )
  const [viewMode, setViewMode] = createSignal<'card' | 'table'>('card')
  const [initialScrollOffset, setInitialScrollOffset] = createSignal(0)
  let restoreFrameId: number | undefined
  let restoreSequence = 0
  const [sortKey, setSortKey] = createSignal<FriendVsSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const comparison = useQuery(() =>
    friendComparisonQueryOptions(username(), selectedFriend()?.username ?? null, difficulty())
  )
  const items = createMemo(() =>
    filterFriendVsItems(comparison.data?.items ?? [], resultFilter().value)
  )
  const sortedItems = createMemo(() => sortFriendVsItems(items(), sortKey(), sortDirection()))
  const resetKey = createMemo(
    () =>
      `${selectedFriend()?.username ?? ''}|${difficulty()}|${resultFilter().value}|${sortKey() ?? ''}|${sortDirection() ?? ''}`
  )

  /**
   * カードと表で共通の並び替え状態を変更する。
   *
   * @param key - 並び替える項目。null は標準順。
   * @param direction - 昇順または降順。null は標準順。
   * @returns なし。
   */
  const handleSortChange = (key: FriendVsSortKey | null, direction: SortDirection | null): void => {
    setSortKey(key)
    setSortDirection(direction)
  }

  /**
   * カードと表の切り替え前後で画面のスクロール位置を保つ。
   *
   * @returns なし。
   */
  const handleViewModeToggle = (): void => {
    restoreSequence += 1
    const currentSequence = restoreSequence
    if (restoreFrameId !== undefined) cancelAnimationFrame(restoreFrameId)
    const scrollTop = getAppMainScrollTop()

    setInitialScrollOffset(scrollTop)
    setViewMode(viewMode() === 'card' ? 'table' : 'card')

    queueMicrotask(() => {
      if (currentSequence !== restoreSequence) return
      restoreAppMainScrollOffset(scrollTop)
      restoreFrameId = requestAnimationFrame(() => {
        if (currentSequence !== restoreSequence) return
        restoreAppMainScrollOffset(scrollTop)
        restoreFrameId = undefined
      })
    })
  }

  onCleanup(() => {
    restoreSequence += 1
    if (restoreFrameId !== undefined) cancelAnimationFrame(restoreFrameId)
  })

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
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger">
              <span class="min-w-0">{toUserFriendlyErrorMessage(friends.error)}</span>
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
              <AppSelect<FriendComparisonDifficulty>
                options={[...FRIEND_VS_DIFFICULTY_OPTIONS]}
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
                    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger">
                      <span class="min-w-0">{toUserFriendlyErrorMessage(comparison.error)}</span>
                      <AppButton size="sm" onClick={() => comparison.refetch()}>
                        {FRIEND_VS_COPY.reload}
                      </AppButton>
                    </div>
                  }
                >
                  <Show when={comparison.data}>
                    {(data) => (
                      <>
                        <FriendVsSummary comparison={data()} />
                        <div class="flex flex-wrap items-end justify-between gap-3">
                          <h2 class="text-lg font-semibold">
                            {FRIEND_VS_COPY.scoreTable}{' '}
                            <span class="font-jost text-sm text-text-muted">
                              {formatInteger(items().length)}
                            </span>
                          </h2>
                          <div class="flex flex-wrap items-end gap-2">
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
                            <CardTableViewToggle
                              viewMode={viewMode()}
                              onClick={handleViewModeToggle}
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
                          <Show
                            when={viewMode() === 'card'}
                            fallback={
                              <FriendVsTable
                                items={sortedItems()}
                                difficulty={difficulty()}
                                resetKey={resetKey()}
                                initialScrollOffset={initialScrollOffset}
                                sortKey={sortKey()}
                                sortDirection={sortDirection()}
                                onSortChange={handleSortChange}
                              />
                            }
                          >
                            <FriendVsCardList
                              items={sortedItems()}
                              difficulty={difficulty()}
                              resetKey={resetKey()}
                              initialScrollOffset={initialScrollOffset}
                              sortKey={sortKey()}
                              sortDirection={sortDirection()}
                              onSortChange={handleSortChange}
                            />
                          </Show>
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
