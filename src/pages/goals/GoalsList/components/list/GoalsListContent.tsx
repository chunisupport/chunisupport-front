import {
  closestCenter,
  DragDropProvider,
  DragDropSensors,
  type DragEvent,
  SortableProvider,
} from '@thisbeyond/solid-dnd'
import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { AppButton } from '../../../../../components/common/AppButton'
import type { GoalDTO } from '../../../../../types/api'
import {
  ADD_GOAL_LABEL,
  EMPTY_GOALS_MESSAGE,
  GOALS_LIMIT,
  GOALS_LIMIT_REACHED_MESSAGE,
} from '../../constants'
import type { GoalWithProgress } from '../../goalsListProgress'
import GoalCard from '../card/GoalCard'

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
 * 目標一覧画面のヘッダー、エラー、カード一覧を描画する。
 *
 * @param props - 目標件数、進捗付き目標一覧、各操作ハンドラ。
 * @returns 目標一覧本体の JSX 要素。
 */
export const GoalsListContent: Component<GoalsListContentProps> = (props) => {
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
      <div class="flex items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">目標</h1>
          <p class="text-sm text-text-muted">
            {props.goalsCount} / {GOALS_LIMIT}件
          </p>
        </div>
        <AppButton
          variant="primary"
          disabled={props.isReordering || props.goalsCount >= GOALS_LIMIT}
          onClick={props.onCreate}
        >
          {ADD_GOAL_LABEL}
        </AppButton>
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
          <DragDropSensors>
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
                    />
                  )}
                </For>
              </div>
            </SortableProvider>
          </DragDropSensors>
        </DragDropProvider>
      </Show>
    </div>
  )
}
