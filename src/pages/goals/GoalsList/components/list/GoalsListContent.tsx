import {
  closestCenter,
  DragDropProvider,
  type DragEvent,
  SortableProvider,
  useDragDropContext,
} from '@thisbeyond/solid-dnd'
import { ChevronsDown, ChevronsRight } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, For, onCleanup, Show } from 'solid-js'
import { AppButton } from '../../../../../components/common/AppButton'
import type { GoalDTO } from '../../../../../types/api'
import {
  ADD_GOAL_LABEL,
  COLLAPSE_ALL_GOALS_LABEL,
  EMPTY_GOALS_MESSAGE,
  EXPAND_ALL_GOALS_LABEL,
  GOAL_DISCLOSURE_CONTROLS_LABEL,
  GOALS_LIMIT,
  GOALS_LIMIT_REACHED_MESSAGE,
} from '../../constants'
import type { GoalWithProgress } from '../../goalsListProgress'
import GoalCard from '../card/GoalCard'
import { GoalsListLongPressSensor } from './GoalsListLongPressSensor'
import { createAutoScroll } from './goalsListAutoScroll'

/** solid-dnd の active draggable に付与するスクロール補正 transformer の ID。 */
const AUTO_SCROLL_TRANSFORMER_ID = 'goals-list-auto-scroll'

interface GoalsListContentProps {
  goalsCount: number
  goalWithProgress: GoalWithProgress[]
  actionError: string
  onCreate: () => void
  onEdit: (goal: GoalDTO) => void
  onDelete: (goal: GoalDTO) => void
  onOpenRecords: (goal: GoalDTO) => void
  isReordering: boolean
  onReorder: (activeId: number, overId: number) => void
  reorderAnnouncement: string
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
 * 目標一覧画面のヘッダー、エラー、カード一覧を描画する。
 *
 * @param props - 目標件数、進捗付き目標一覧、各操作ハンドラ。
 * @returns 目標一覧本体の JSX 要素。
 */
export const GoalsListContent: Component<GoalsListContentProps> = (props) => {
  const autoScroll = createAutoScroll()
  const [collapsedGoalIds, setCollapsedGoalIds] = createSignal<ReadonlySet<number>>(
    new Set<number>()
  )

  /**
   * 指定した目標カードが開いているか判定する。
   *
   * @param goalId - 判定する目標ID。
   * @returns カードが開いていればtrue。
   */
  const isGoalOpen = (goalId: number): boolean => !collapsedGoalIds().has(goalId)

  /**
   * 表示中の全目標カードが開いているか判定する。
   *
   * @returns 全カードが開いていればtrue。
   */
  const areAllGoalsOpen = (): boolean =>
    props.goalWithProgress.every(({ goal }) => isGoalOpen(goal.id))

  /**
   * 表示中の全目標カードが閉じているか判定する。
   *
   * @returns 全カードが閉じていればtrue。
   */
  const areAllGoalsClosed = (): boolean =>
    props.goalWithProgress.every(({ goal }) => !isGoalOpen(goal.id))

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
    setCollapsedGoalIds(new Set<number>())
  }

  /**
   * 表示中の全目標カードを閉じる。
   *
   * @returns なし。
   */
  const handleCollapseAll = (): void => {
    setCollapsedGoalIds(new Set(props.goalWithProgress.map(({ goal }) => goal.id)))
  }

  /**
   * ドロップ位置を目標一覧の並び順に反映する。
   *
   * @param event - ドラッグ元とドロップ先を含む終了イベント。
   * @returns なし。
   */
  const handleDragEnd = (event: DragEvent): void => {
    if (props.isReordering || !event.droppable) return
    props.onReorder(Number(event.draggable.id), Number(event.droppable.id))
  }

  /**
   * キーボード操作で目標を1つ上または下へ移動する。
   *
   * @param goalId - 移動する目標ID。
   * @param offset - 移動方向。
   * @returns なし。
   */
  const handleKeyboardMove = (goalId: number, offset: -1 | 1): void => {
    const currentIndex = props.goalWithProgress.findIndex(({ goal }) => goal.id === goalId)
    const destination = props.goalWithProgress[currentIndex + offset]
    if (destination) {
      props.onReorder(goalId, destination.goal.id)
    }
  }

  return (
    <div class="mx-auto w-full max-w-3xl p-4 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">目標</h1>
          <p class="text-sm text-text-muted">
            {props.goalsCount} / {GOALS_LIMIT}件
          </p>
        </div>
        <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Show when={props.goalsCount > 0}>
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
          <AppButton
            variant="primary"
            disabled={props.isReordering || props.goalsCount >= GOALS_LIMIT}
            onClick={props.onCreate}
          >
            {ADD_GOAL_LABEL}
          </AppButton>
        </div>
      </div>

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
        when={props.goalWithProgress.length > 0}
        fallback={
          <p class="rounded border border-border bg-surface p-4 text-sm text-text-muted">
            {EMPTY_GOALS_MESSAGE}
          </p>
        }
      >
        <DragDropProvider collisionDetector={closestCenter} onDragEnd={handleDragEnd}>
          <GoalsListLongPressSensor />
          <AutoScrollSetup autoScroll={autoScroll} />
          <SortableProvider ids={props.goalWithProgress.map(({ goal }) => goal.id)}>
            <div class="grid grid-cols-1 gap-3">
              <For each={props.goalWithProgress}>
                {({ goal, progress }, index) => (
                  <GoalCard
                    goal={goal}
                    progress={progress}
                    isReordering={props.isReordering}
                    position={index() + 1}
                    total={props.goalWithProgress.length}
                    onEdit={props.onEdit}
                    onDelete={props.onDelete}
                    onOpenRecords={props.onOpenRecords}
                    onKeyboardMove={handleKeyboardMove}
                    open={isGoalOpen(goal.id)}
                    onOpenChange={(open) => handleGoalOpenChange(goal.id, open)}
                  />
                )}
              </For>
            </div>
          </SortableProvider>
        </DragDropProvider>
      </Show>
    </div>
  )
}
