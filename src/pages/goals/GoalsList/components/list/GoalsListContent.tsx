import { Collapsible } from '@kobalte/core/collapsible'
import { ToggleGroup } from '@kobalte/core/toggle-group'
import {
  type CollisionDetector,
  closestCenter,
  DragDropProvider,
  type DragEvent,
  SortableProvider,
  useDragDropContext,
} from '@thisbeyond/solid-dnd'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsRight,
  GalleryHorizontal,
  LayoutList,
  Settings2,
} from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { AppButton, AppIconButton } from '../../../../../components/common/AppButton'
import { AppDisclosureTrigger } from '../../../../../components/common/AppDisclosureTrigger'
import type { GoalDTO } from '../../../../../types/api'
import {
  ADD_GOAL_LABEL,
  COLLAPSE_ALL_GOALS_LABEL,
  EMPTY_GOALS_MESSAGE,
  EXPAND_ALL_GOALS_LABEL,
  GOAL_DISCLOSURE_CONTROLS_LABEL,
  GOAL_GROUP_COPY,
  GOAL_GROUP_DISPLAY_MODE_COPY,
  GOALS_LIMIT,
  GOALS_LIMIT_REACHED_MESSAGE,
  type GoalGroupDisplayMode,
} from '../../constants'
import type { GoalGroupView } from '../../goalGroupsModel'
import GoalCard from '../card/GoalCard'
import { GoalCopyPlaceholder } from '../card/GoalCopyPlaceholder'
import { GoalsListLongPressSensor } from './GoalsListLongPressSensor'
import { createAutoScroll } from './goalsListAutoScroll'

/** solid-dnd の active draggable に付与するスクロール補正 transformer の ID。 */
const AUTO_SCROLL_TRANSFORMER_ID = 'goals-list-auto-scroll'

interface GoalsListContentProps {
  /** 登録済みの全目標件数。 */
  goalsCount: number
  /** 横切り替えで現在表示するグループ。 */
  groupView: GoalGroupView
  /** 表示順に並んだ全グループ。 */
  groupViews: readonly GoalGroupView[]
  /** 現在選択中のグループ表示形式。 */
  groupDisplayMode: GoalGroupDisplayMode
  /** 一覧操作に紐づくエラーメッセージ。 */
  actionError: string
  /** 目標作成を開始する処理。 */
  onCreate: () => void
  /** グループ管理を開始する処理。 */
  onManageGroups: () => void
  /** 前のグループへ切り替える処理。 */
  onPreviousGroup: () => void
  /** 次のグループへ切り替える処理。 */
  onNextGroup: () => void
  /** 目標編集を開始する処理。 */
  onEdit: (goal: GoalDTO) => void
  /** 目標をコピーする処理。 */
  onCopy: (goal: GoalDTO) => void
  /** 目標削除を開始する処理。 */
  onDelete: (goal: GoalDTO) => void
  /** 未達成レコードを開く処理。 */
  onOpenRecords: (goal: GoalDTO) => void
  /** 目標の並び替え中か。 */
  isReordering: boolean
  /** 目標のコピー中か。 */
  isCopying: boolean
  /** コピー中の目標が属するグループID。 */
  copyingGroupId: number | null | undefined
  /** グループ内で目標を並び替える処理。 */
  onReorder: (groupId: number | null, activeId: number, overId: number) => void
  /** 並び替え結果の読み上げ文言。 */
  reorderAnnouncement: string
  /** グループ表示形式を変更する処理。 */
  onGroupDisplayModeChange: (mode: GoalGroupDisplayMode) => void
}

interface GoalGroupCardsProps {
  /** カードを描画するグループ。 */
  groupView: GoalGroupView
  /** 目標カードの見出しレベル。 */
  headingLevel: 2 | 3
  /** 登録済みの全目標件数。 */
  goalsCount: number
  /** 目標の並び替え中か。 */
  isReordering: boolean
  /** 目標のコピー中か。 */
  isCopying: boolean
  /** コピー中の目標が属するグループID。 */
  copyingGroupId: number | null | undefined
  /** 折りたたまれている目標ID。 */
  collapsedGoalIds: ReadonlySet<number>
  /** 目標カードの開閉状態を変更する処理。 */
  onGoalOpenChange: (goalId: number, open: boolean) => void
  /** 目標編集を開始する処理。 */
  onEdit: (goal: GoalDTO) => void
  /** 目標をコピーする処理。 */
  onCopy: (goal: GoalDTO) => void
  /** 目標削除を開始する処理。 */
  onDelete: (goal: GoalDTO) => void
  /** 未達成レコードを開く処理。 */
  onOpenRecords: (goal: GoalDTO) => void
  /** グループ内で目標を並び替える処理。 */
  onReorder: (groupId: number | null, activeId: number, overId: number) => void
}

interface GoalGroupDisplayModeToggleProps {
  /** 現在選択中の表示形式。 */
  value: GoalGroupDisplayMode
  /** 表示形式を変更できない状態か。 */
  disabled: boolean
  /** 表示形式を変更する処理。 */
  onChange: (mode: GoalGroupDisplayMode) => void
}

/**
 * DragDropProvider の子として配置し、自動スクロールと solid-dnd を接続する。
 *
 * スクロール差分を active draggable の transform に加算し、カードがカーソルから
 * 置き去りにならないようにする。あわせて layout 再計算と衝突判定を行う。
 *
 * @param props - 自動スクロール制御オブジェクト。
 * @param props.autoScroll - `createAutoScroll` の戻り値。
 * @returns 描画要素なし（副作用のみ）。
 */
function AutoScrollSetup(props: { autoScroll: ReturnType<typeof createAutoScroll> }) {
  const context = useDragDropContext()
  if (!context) return null

  const [
    state,
    {
      addTransformer,
      removeTransformer,
      recomputeLayouts,
      detectCollisions,
      onDragStart,
      onDragEnd,
    },
  ] = context

  /** ドラッグ開始時からの scrollTop 差分。transformer コールバックから参照する。 */
  let scrollDeltaY = 0

  /**
   * スクロール補正用 transformer を active draggable に設定（または更新）する。
   *
   * @param draggableId - 補正対象の draggable ID。
   * @returns なし。
   */
  const applyScrollCompensationTransformer = (draggableId: string | number): void => {
    addTransformer('draggables', draggableId, {
      id: AUTO_SCROLL_TRANSFORMER_ID,
      order: 50,
      callback: (transform) => ({
        x: transform.x,
        y: transform.y + scrollDeltaY,
      }),
    })
  }

  onDragStart(({ draggable }) => {
    scrollDeltaY = 0
    const clientY = state.active.sensor?.coordinates.current.y
    props.autoScroll.start({ clientY })
    applyScrollCompensationTransformer(draggable.id)
  })

  onDragEnd(({ draggable }) => {
    props.autoScroll.stop()
    removeTransformer('draggables', draggable.id, AUTO_SCROLL_TRANSFORMER_ID)
    scrollDeltaY = 0
  })

  props.autoScroll.setOnScrollDeltaChange((deltaY) => {
    scrollDeltaY = deltaY
    const draggableId = state.active.draggableId
    if (draggableId == null) return

    // layout を先に更新してから transform を差し替え、衝突判定に両方を反映する。
    recomputeLayouts()
    applyScrollCompensationTransformer(draggableId)
    detectCollisions()
  })

  onCleanup(() => {
    props.autoScroll.setOnScrollDeltaChange(null)
    props.autoScroll.stop()
  })

  return null
}

/**
 * 目標グループの表示形式を単一選択するコントロールを描画する。
 *
 * @param props - 現在の表示形式、操作可否、変更ハンドラ。
 * @returns 横切り替えと1画面表示を選べるトグルグループ。
 */
const GoalGroupDisplayModeToggle: Component<GoalGroupDisplayModeToggleProps> = (props) => (
  <ToggleGroup
    value={props.value}
    disabled={props.disabled}
    aria-label={GOAL_GROUP_DISPLAY_MODE_COPY.label}
    class="inline-flex rounded-lg border border-border bg-surface p-1"
    onChange={(value) => {
      if (value === 'horizontal' || value === 'all') props.onChange(value)
    }}
  >
    <ToggleGroup.Item
      value="horizontal"
      aria-label={GOAL_GROUP_DISPLAY_MODE_COPY.horizontal}
      class="inline-flex items-center rounded p-2 text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring data-[pressed]:bg-action-primary data-[pressed]:text-text-inverse"
    >
      <GalleryHorizontal size={16} aria-hidden="true" />
    </ToggleGroup.Item>
    <ToggleGroup.Item
      value="all"
      aria-label={GOAL_GROUP_DISPLAY_MODE_COPY.all}
      class="inline-flex items-center rounded p-2 text-text-muted transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring data-[pressed]:bg-action-primary data-[pressed]:text-text-inverse"
    >
      <LayoutList size={16} aria-hidden="true" />
    </ToggleGroup.Item>
  </ToggleGroup>
)

/**
 * 1グループ分の目標カードとグループ内並び替え操作を描画する。
 *
 * @param props - 対象グループ、カード状態、目標操作ハンドラ。
 * @returns 並び替え可能な目標カード一覧。
 */
const GoalGroupCards: Component<GoalGroupCardsProps> = (props) => {
  const autoScroll = createAutoScroll()
  let cardsContainer: HTMLDivElement | undefined

  /**
   * ドラッグ中のカード中心が対象グループ内にある場合だけ衝突対象を返す。
   *
   * @param draggable - ドラッグ中の目標カード。
   * @param droppables - 対象グループ内のドロップ候補。
   * @param context - 現在の衝突判定状態。
   * @returns 対象グループ内で最も近い候補。グループ外ならnull。
   */
  const detectGroupCollision: CollisionDetector = (draggable, droppables, context) => {
    if (!cardsContainer) return null

    const bounds = cardsContainer.getBoundingClientRect()
    const center = draggable.transformed.center
    const isWithinGroup =
      center.x >= bounds.left &&
      center.x <= bounds.right &&
      center.y >= bounds.top &&
      center.y <= bounds.bottom

    return isWithinGroup ? closestCenter(draggable, droppables, context) : null
  }

  /**
   * ドロップ位置を対象グループの並び順に反映する。
   *
   * @param event - ドラッグ元とドロップ先を含む終了イベント。
   * @returns なし。
   */
  const handleDragEnd = (event: DragEvent): void => {
    if (props.isReordering || props.isCopying || !event.droppable) return
    props.onReorder(props.groupView.groupId, Number(event.draggable.id), Number(event.droppable.id))
  }

  /**
   * キーボード操作で対象グループ内の目標を1つ上または下へ移動する。
   *
   * @param goalId - 移動する目標ID。
   * @param offset - 移動方向。
   * @returns なし。
   */
  const handleKeyboardMove = (goalId: number, offset: -1 | 1): void => {
    if (props.isCopying) return
    const currentIndex = props.groupView.goals.findIndex(({ goal }) => goal.id === goalId)
    const destination = props.groupView.goals[currentIndex + offset]
    if (destination) {
      props.onReorder(props.groupView.groupId, goalId, destination.goal.id)
    }
  }

  return (
    <div ref={cardsContainer}>
      <Show
        when={props.groupView.goals.length > 0}
        fallback={
          <p class="rounded border border-border bg-surface p-4 text-sm text-text-muted">
            {EMPTY_GOALS_MESSAGE}
          </p>
        }
      >
        <DragDropProvider collisionDetector={detectGroupCollision} onDragEnd={handleDragEnd}>
          <GoalsListLongPressSensor />
          <AutoScrollSetup autoScroll={autoScroll} />
          <SortableProvider ids={props.groupView.goals.map(({ goal }) => goal.id)}>
            <div class="grid grid-cols-1 gap-3">
              <For each={props.groupView.goals}>
                {({ goal, progress }, index) => (
                  <GoalCard
                    goal={goal}
                    progress={progress}
                    headingLevel={props.headingLevel}
                    isReordering={props.isReordering || props.isCopying}
                    position={index() + 1}
                    total={props.groupView.goals.length}
                    onEdit={props.onEdit}
                    onCopy={props.onCopy}
                    onDelete={props.onDelete}
                    onOpenRecords={props.onOpenRecords}
                    onKeyboardMove={handleKeyboardMove}
                    copyDisabled={props.isCopying || props.goalsCount >= GOALS_LIMIT}
                    open={!props.collapsedGoalIds.has(goal.id)}
                    onOpenChange={(open) => props.onGoalOpenChange(goal.id, open)}
                  />
                )}
              </For>
              <Show
                when={
                  props.copyingGroupId !== undefined &&
                  props.copyingGroupId === props.groupView.groupId
                }
              >
                <GoalCopyPlaceholder />
              </Show>
            </div>
          </SortableProvider>
        </DragDropProvider>
      </Show>
    </div>
  )
}

/**
 * 目標一覧画面の固定ヘッダー、エラー、カード一覧を描画する。
 *
 * @param props - 目標件数、進捗付き目標一覧、各操作ハンドラ。
 * @returns 目標一覧本体の JSX 要素。
 */
export const GoalsListContent: Component<GoalsListContentProps> = (props) => {
  /** 一覧表示のグループ見出しを配置する基準となる固定ヘッダー要素。 */
  let stickyHeaderRef!: HTMLDivElement

  /** レスポンシブな固定ヘッダーの実測高。 */
  const [stickyHeaderHeight, setStickyHeaderHeight] = createSignal(0)
  const [collapsedGoalIds, setCollapsedGoalIds] = createSignal<ReadonlySet<number>>(
    new Set<number>()
  )
  const [collapsedGroupIds, setCollapsedGroupIds] = createSignal<ReadonlySet<number | null>>(
    new Set<number | null>()
  )

  /** 現在の表示形式で画面に含まれる目標一覧。 */
  const displayedGoals = createMemo(() =>
    props.groupDisplayMode === 'all'
      ? props.groupViews.flatMap(({ goals }) => goals)
      : props.groupView.goals
  )

  /**
   * 指定した目標カードが開いているか判定する。
   *
   * @param goalId - 判定する目標ID。
   * @returns カードが開いていればtrue。
   */
  const isGoalOpen = (goalId: number): boolean => !collapsedGoalIds().has(goalId)

  /**
   * 指定した目標グループが開いているか判定する。
   *
   * @param groupId - 判定するグループID。未分類はnull。
   * @returns グループが開いていればtrue。
   */
  const isGroupOpen = (groupId: number | null): boolean => !collapsedGroupIds().has(groupId)

  /**
   * 指定した目標グループの開閉状態を更新する。
   *
   * @param groupId - 更新するグループID。未分類はnull。
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleGroupOpenChange = (groupId: number | null, open: boolean): void => {
    setCollapsedGroupIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (open) {
        nextIds.delete(groupId)
      } else {
        nextIds.add(groupId)
      }
      return nextIds
    })
  }

  /**
   * 表示中の全目標カードが開いているか判定する。
   *
   * @returns 全カードが開いていればtrue。
   */
  const areAllGoalsOpen = (): boolean => displayedGoals().every(({ goal }) => isGoalOpen(goal.id))

  /**
   * 表示中の全目標カードが閉じているか判定する。
   *
   * @returns 全カードが閉じていればtrue。
   */
  const areAllGoalsClosed = (): boolean =>
    displayedGoals().every(({ goal }) => !isGoalOpen(goal.id))

  /**
   * 指定した目標カードの開閉状態を更新する。
   *
   * @param goalId - 更新する目標ID。
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleGoalOpenChange = (goalId: number, open: boolean): void => {
    setCollapsedGoalIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (open) {
        nextIds.delete(goalId)
      } else {
        nextIds.add(goalId)
      }
      return nextIds
    })
  }

  /**
   * 表示中の全目標カードを開く。
   *
   * @returns なし。
   */
  const handleExpandAll = (): void => {
    const displayedGoalIds = new Set(displayedGoals().map(({ goal }) => goal.id))
    setCollapsedGoalIds(
      (currentIds) => new Set([...currentIds].filter((goalId) => !displayedGoalIds.has(goalId)))
    )
  }

  /**
   * 表示中の全目標カードを閉じる。
   *
   * @returns なし。
   */
  const handleCollapseAll = (): void => {
    setCollapsedGoalIds(
      (currentIds) => new Set([...currentIds, ...displayedGoals().map(({ goal }) => goal.id)])
    )
  }

  onMount(() => {
    /**
     * 固定ヘッダーの実測高を一覧表示のグループ見出しへ反映する。
     *
     * @returns なし。
     */
    const updateStickyHeaderHeight = (): void => {
      setStickyHeaderHeight(stickyHeaderRef.offsetHeight)
    }

    const resizeObserver = new ResizeObserver(updateStickyHeaderHeight)
    resizeObserver.observe(stickyHeaderRef)
    updateStickyHeaderHeight()

    onCleanup(() => resizeObserver.disconnect())
  })

  return (
    <div class="mx-auto w-full max-w-3xl px-4 pb-4">
      <div ref={stickyHeaderRef} class="sticky top-0 z-20 space-y-4 bg-bg py-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-semibold">目標</h1>
            <p class="text-sm text-text-muted">
              {props.goalsCount} / {GOALS_LIMIT}件
            </p>
          </div>
          <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Show when={displayedGoals().length > 0}>
              <fieldset class="m-0 flex min-w-0 items-center gap-1 border-0 p-0">
                <legend class="sr-only">{GOAL_DISCLOSURE_CONTROLS_LABEL}</legend>
                <AppButton
                  variant="ghost"
                  size="xs"
                  disabled={props.isReordering || areAllGoalsOpen()}
                  leftIcon={<ChevronsDown size={16} aria-hidden="true" />}
                  onClick={handleExpandAll}
                >
                  {EXPAND_ALL_GOALS_LABEL}
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  disabled={props.isReordering || areAllGoalsClosed()}
                  leftIcon={<ChevronsRight size={16} aria-hidden="true" />}
                  onClick={handleCollapseAll}
                >
                  {COLLAPSE_ALL_GOALS_LABEL}
                </AppButton>
              </fieldset>
            </Show>
            <AppIconButton
              aria-label={GOAL_GROUP_COPY.manageButtonLabel}
              disabled={props.isReordering}
              onClick={props.onManageGroups}
            >
              <Settings2 size={18} aria-hidden="true" />
            </AppIconButton>
            <AppButton
              variant="primary"
              disabled={props.isReordering || props.isCopying || props.goalsCount >= GOALS_LIMIT}
              onClick={props.onCreate}
            >
              {ADD_GOAL_LABEL}
            </AppButton>
          </div>
        </div>

        <div class="flex justify-end">
          <GoalGroupDisplayModeToggle
            value={props.groupDisplayMode}
            disabled={props.isReordering}
            onChange={props.onGroupDisplayModeChange}
          />
        </div>

        <Show when={props.groupDisplayMode === 'horizontal'}>
          <div class="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-lg border border-border bg-surface p-2">
            <AppIconButton
              aria-label={GOAL_GROUP_COPY.previousButtonLabel}
              disabled={props.groupViews.length <= 1 || props.isReordering}
              onClick={props.onPreviousGroup}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </AppIconButton>
            <div class="min-w-0 text-center" role="status" aria-live="polite" aria-atomic="true">
              <h2 class="truncate font-sans text-lg font-semibold">{props.groupView.name}</h2>
              <p class="text-xs text-text-muted">{props.groupView.goals.length}件</p>
            </div>
            <AppIconButton
              aria-label={GOAL_GROUP_COPY.nextButtonLabel}
              disabled={props.groupViews.length <= 1 || props.isReordering}
              onClick={props.onNextGroup}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </AppIconButton>
          </div>
        </Show>
      </div>

      <div class="space-y-4">
        <Show when={props.goalsCount >= GOALS_LIMIT}>
          <p class="rounded border border-warning-border bg-warning-bg px-3 py-2 text-sm text-score-rank-c-text">
            {GOALS_LIMIT_REACHED_MESSAGE}
          </p>
        </Show>

        <Show when={props.actionError}>
          <p class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
            {props.actionError}
          </p>
        </Show>

        <p class="sr-only" role="status" aria-live="polite">
          {props.reorderAnnouncement}
        </p>

        <Show
          when={props.groupDisplayMode === 'horizontal'}
          fallback={
            <div class="space-y-6">
              <For each={props.groupViews}>
                {(groupView) => (
                  <Collapsible
                    open={isGroupOpen(groupView.groupId)}
                    onOpenChange={(open) => handleGroupOpenChange(groupView.groupId, open)}
                  >
                    <section aria-labelledby={`goal-group-${groupView.groupId ?? 'none'}`}>
                      <h2
                        id={`goal-group-${groupView.groupId ?? 'none'}`}
                        class="sticky z-10 bg-bg"
                        style={{ top: `${stickyHeaderHeight()}px` }}
                      >
                        <AppDisclosureTrigger
                          variant="compact"
                          label={groupView.name}
                          summary={`${groupView.goals.length}件`}
                          class="border-b border-border pb-2"
                          labelClass="truncate font-sans text-lg font-semibold"
                        />
                      </h2>
                      <Collapsible.Content class="pt-3">
                        <GoalGroupCards
                          groupView={groupView}
                          headingLevel={3}
                          goalsCount={props.goalsCount}
                          isReordering={props.isReordering}
                          isCopying={props.isCopying}
                          copyingGroupId={props.copyingGroupId}
                          collapsedGoalIds={collapsedGoalIds()}
                          onGoalOpenChange={handleGoalOpenChange}
                          onEdit={props.onEdit}
                          onCopy={props.onCopy}
                          onDelete={props.onDelete}
                          onOpenRecords={props.onOpenRecords}
                          onReorder={props.onReorder}
                        />
                      </Collapsible.Content>
                    </section>
                  </Collapsible>
                )}
              </For>
            </div>
          }
        >
          <GoalGroupCards
            groupView={props.groupView}
            headingLevel={2}
            goalsCount={props.goalsCount}
            isReordering={props.isReordering}
            isCopying={props.isCopying}
            copyingGroupId={props.copyingGroupId}
            collapsedGoalIds={collapsedGoalIds()}
            onGoalOpenChange={handleGoalOpenChange}
            onEdit={props.onEdit}
            onCopy={props.onCopy}
            onDelete={props.onDelete}
            onOpenRecords={props.onOpenRecords}
            onReorder={props.onReorder}
          />
        </Show>
      </div>
    </div>
  )
}
