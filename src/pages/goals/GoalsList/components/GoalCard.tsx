import { Button } from '@kobalte/core/button'
import { ExternalLink } from 'lucide-solid'
import type { Component } from 'solid-js'
import type { GoalDTO } from '../../../../types/api'
import type { GoalProgressResult } from '../../utils/goalProgress'
import { isGoalRecordNavigationEnabled } from '../../utils/goalRecordFilter'
import { GoalCardActionMenu } from './GoalCardActionMenu'
import { GoalCardProgress } from './GoalCardProgress'

interface GoalCardProps {
  goal: GoalDTO
  progress: GoalProgressResult
  onEdit: (goal: GoalDTO) => void
  onDelete: (goal: GoalDTO) => void
  onOpenRecords?: (goal: GoalDTO) => void
}

/**
 * 目標の現在値、目標値、達成率をカード形式で表示する。
 *
 * @param props - 目標カードの表示内容と操作ハンドラ。
 * @returns 目標カードの JSX 要素。
 */
const GoalCard: Component<GoalCardProps> = (props) => {
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

  return (
    <article
      class={`rounded-lg border p-4 shadow-sm ${
        props.progress.achieved
          ? 'border-action-primary-border bg-action-primary-muted'
          : 'border-border bg-surface'
      }`}
    >
      <div class="flex items-start justify-between gap-3">
        <h2 class="min-w-0 font-sans text-lg font-bold text-text">
          {isGoalRecordNavigationEnabled(props.goal) && props.onOpenRecords ? (
            <Button
              type="button"
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
        <GoalCardActionMenu onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <GoalCardProgress
        title={props.goal.title}
        achievementType={props.goal.achievement_type}
        invert={props.goal.invert}
        progress={props.progress}
      />
    </article>
  )
}

export default GoalCard
