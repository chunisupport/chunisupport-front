import { Button } from '@kobalte/core/button'
import { createSortable } from '@thisbeyond/solid-dnd'
import { ExternalLink } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import type { GoalDTO } from '../../../../../types/api'
import type { GoalProgressResult } from '../../../utils/goalProgress'
import { isGoalRecordNavigationEnabled } from '../../../utils/goalRecordFilter'
import { buildGoalDragLabel } from '../../constants'
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
  let cardElement: HTMLElement | undefined

  createEffect(() => {
    const activators = sortable.dragActivators
    if (!cardElement) return

    const entries = Object.entries(activators).map(([handlerName, listener]) => [
      handlerName.startsWith('on') ? handlerName.slice(2) : handlerName,
      listener as EventListener,
    ]) as Array<[string, EventListener]>

    for (const [eventName, listener] of entries) {
      cardElement.addEventListener(eventName, listener)
    }

    onCleanup(() => {
      for (const [eventName, listener] of entries) {
        cardElement?.removeEventListener(eventName, listener)
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
    if (props.isReordering || event.target !== event.currentTarget) return

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
      ref={(element) => {
        cardElement = element
        sortable.ref(element)
      }}
      style={{
        transform: `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)`,
      }}
      tabIndex={props.isReordering ? -1 : 0}
      aria-label={buildGoalDragLabel(props.goal.title, props.position, props.total)}
      aria-roledescription="並び替え可能な目標"
      onKeyDown={handleKeyDown}
      class={`cursor-grab touch-none select-none rounded-lg border p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
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
              class="inline-flex cursor-pointer items-center gap-1.5 rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onPointerDown={(event) => event.stopPropagation()}
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

      <div>
        <GoalCardProgress
          title={props.goal.title}
          achievementType={props.goal.achievement_type}
          invert={props.goal.invert}
          progress={props.progress}
        />
      </div>
    </article>
  )
}

export default GoalCard
