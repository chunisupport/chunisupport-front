import { Button } from '@kobalte/core/button'
import { createSortable } from '@thisbeyond/solid-dnd'
import { ExternalLink, GripVertical } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import type { GoalDTO } from '../../../../../types/api'
import type { GoalProgressResult } from '../../../utils/goalProgress'
import { isGoalRecordNavigationEnabled } from '../../../utils/goalRecordFilter'
import { buildGoalDragHandleLabel } from '../../constants'
import { GoalCardActionMenu } from './GoalCardActionMenu'
import { GoalCardProgress } from './GoalCardProgress'

interface GoalCardProps {
  goal: GoalDTO
  progress: GoalProgressResult
  onEdit: (goal: GoalDTO) => void
  onDelete: (goal: GoalDTO) => void
  onOpenRecords?: (goal: GoalDTO) => void
  isReordering: boolean
  position: number
  total: number
  onKeyboardMove: (goalId: number, offset: -1 | 1) => void
}

/**
 * 目標の現在値、目標値、達成率をカード形式で表示する。
 *
 * @param props - 目標カードの表示内容と操作ハンドラ。
 * @returns 目標カードの JSX 要素。
 */
const GoalCard: Component<GoalCardProps> = (props) => {
  const sortable = createSortable(props.goal.id)
  let dragHandle: HTMLButtonElement | undefined

  createEffect(() => {
    const activators = sortable.dragActivators
    if (!dragHandle) return

    const entries = Object.entries(activators).map(([handlerName, listener]) => [
      handlerName.startsWith('on') ? handlerName.slice(2) : handlerName,
      listener as EventListener,
    ]) as Array<[string, EventListener]>

    for (const [eventName, listener] of entries) {
      dragHandle.addEventListener(eventName, listener)
    }

    onCleanup(() => {
      for (const [eventName, listener] of entries) {
        dragHandle?.removeEventListener(eventName, listener)
      }
    })
  })

  const handleEdit = () => {
    props.onEdit(props.goal)
  }

  const handleDelete = () => {
    props.onDelete(props.goal)
  }

  /**
   * 現在の目標で未達成の通常レコード画面を開く。
   *
   * @returns なし。
   */
  const handleOpenRecords = (): void => {
    props.onOpenRecords?.(props.goal)
  }

  /**
   * フォーカス中の目標カードを上下矢印キーで移動する。
   *
   * @param event - カードで発生したキーボードイベント。
   * @returns なし。
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (props.isReordering) return

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      props.onKeyboardMove(props.goal.id, -1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      props.onKeyboardMove(props.goal.id, 1)
    }
  }

  return (
    <article
      ref={sortable.ref}
      style={{
        transform: `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)`,
      }}
      class={`rounded-lg border p-4 shadow-sm ${
        props.progress.achieved
          ? 'border-action-primary-border bg-action-primary-muted'
          : 'border-border bg-surface'
      } ${sortable.isActiveDraggable ? 'relative z-10 cursor-grabbing opacity-80 shadow-lg' : ''}`}
    >
      <div class="flex items-start justify-between gap-3">
        <h2 class="min-w-0 font-sans text-lg font-bold text-text">
          {isGoalRecordNavigationEnabled(props.goal) && props.onOpenRecords ? (
            <Button
              type="button"
              disabled={props.isReordering}
              class="inline-flex items-center gap-1.5 rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={handleOpenRecords}
            >
              <span>{props.goal.title}</span>
              <ExternalLink class="shrink-0" size={18} aria-hidden="true" />
            </Button>
          ) : (
            props.goal.title
          )}
        </h2>
        <GoalCardActionMenu
          disabled={props.isReordering}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <div class="relative">
        <Button
          ref={(element) => {
            dragHandle = element
          }}
          type="button"
          disabled={props.isReordering}
          aria-label={buildGoalDragHandleLabel(props.goal.title, props.position, props.total)}
          aria-roledescription="並び替えハンドル"
          class="absolute right-0 top-2 z-1 touch-none cursor-grab rounded text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60"
          onKeyDown={handleKeyDown}
        >
          <GripVertical size={20} aria-hidden="true" />
        </Button>
        <div class="pr-7">
          <GoalCardProgress
            title={props.goal.title}
            achievementType={props.goal.achievement_type}
            invert={props.goal.invert}
            progress={props.progress}
          />
        </div>
      </div>
    </article>
  )
}

export default GoalCard
