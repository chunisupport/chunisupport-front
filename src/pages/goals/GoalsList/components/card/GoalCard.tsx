import { Button } from '@kobalte/core/button'
import { Collapsible } from '@kobalte/core/collapsible'
import { createSortable } from '@thisbeyond/solid-dnd'
import { ChevronRight, ExternalLink } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, onCleanup, Show } from 'solid-js'
import { getAppIconButtonClass } from '../../../../../components/common/AppButton'
import type { GoalDTO } from '../../../../../types/api'
import type { GoalProgressResult } from '../../../utils/goalProgress'
import { isGoalRecordNavigationEnabled } from '../../../utils/goalRecordFilter'
import { buildGoalDisclosureLabel, buildGoalDragLabel } from '../../constants'
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
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * カード内ボタンのポインター操作が並び替え開始処理へ伝播するのを防ぐ。
 *
 * @param event - カード内ボタンで発生したポインターイベント。
 * @returns なし。
 */
const stopDragActivation = (event: PointerEvent): void => {
  event.stopPropagation()
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

  /**
   * 現在の目標を編集対象として親へ通知する。
   *
   * @returns なし。
   */
  const handleEdit = (): void => {
    props.onEdit(props.goal)
  }

  /**
   * 現在の目標を削除対象として親へ通知する。
   *
   * @returns なし。
   */
  const handleDelete = (): void => {
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
    <Collapsible
      as="article"
      open={props.open}
      onOpenChange={props.onOpenChange}
      disabled={props.isReordering}
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
      class={`cursor-grab select-none rounded-lg border p-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
        props.progress.achieved
          ? 'border-action-primary-border bg-action-primary-muted'
          : 'border-border bg-surface'
      } ${sortable.isActiveDraggable ? 'relative z-10 cursor-grabbing opacity-80 shadow-lg' : ''}`}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-start gap-1">
          <Collapsible.Trigger
            type="button"
            aria-label={buildGoalDisclosureLabel(props.goal.title, props.open)}
            class={getAppIconButtonClass({
              tone: 'ghost',
              size: 'sm',
              class: 'group -ml-1 shrink-0',
            })}
            onPointerDown={stopDragActivation}
          >
            <ChevronRight
              class="transition-transform group-data-expanded:rotate-90"
              size={20}
              aria-hidden="true"
            />
          </Collapsible.Trigger>
          <h2 class="min-w-0 pt-1.5 font-sans text-lg font-bold text-text">
            {isGoalRecordNavigationEnabled(props.goal) && props.onOpenRecords ? (
              <Button
                type="button"
                disabled={props.isReordering}
                class="inline-flex cursor-pointer items-center gap-1.5 rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                onPointerDown={stopDragActivation}
                onClick={handleOpenRecords}
              >
                <span>{props.goal.title}</span>
                <ExternalLink class="shrink-0" size={18} aria-hidden="true" />
              </Button>
            ) : (
              props.goal.title
            )}
          </h2>
        </div>
        <Show when={props.open}>
          <GoalCardActionMenu
            disabled={props.isReordering}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Show>
      </div>

      <Collapsible.Content>
        <GoalCardProgress
          title={props.goal.title}
          achievementType={props.goal.achievement_type}
          invert={props.goal.invert}
          progress={props.progress}
        />
      </Collapsible.Content>
      <Show when={!props.open}>
        <GoalCardProgress
          title={props.goal.title}
          achievementType={props.goal.achievement_type}
          invert={props.goal.invert}
          progress={props.progress}
          showValues={false}
        />
      </Show>
    </Collapsible>
  )
}

export default GoalCard
