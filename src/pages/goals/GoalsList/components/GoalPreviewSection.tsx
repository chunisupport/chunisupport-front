import type { Component } from 'solid-js'
import type { GoalAchievementType } from '../../../../types/api'
import type { GoalProgressResult } from '../../utils/goalProgress'
import { GoalCardProgress } from './GoalCard'

interface GoalPreviewSectionProps {
  title: string
  achievementType: GoalAchievementType
  invert: boolean
  progress: GoalProgressResult
}

/**
 * 目標フォームのプレビューを描画する。
 *
 * @param props - プレビュー表示に使うタイトル、達成種別、表示形式、進捗。
 * @returns プレビューカードの JSX 要素。
 */
export const GoalPreviewSection: Component<GoalPreviewSectionProps> = (props) => (
  <>
    <p class="mb-1 block text-text-muted text-sm">プレビュー</p>
    <article
      class={`rounded-lg border p-4 shadow-sm ${
        props.progress.achieved
          ? 'border-action-primary-border bg-action-primary-muted'
          : 'border-border bg-surface'
      }`}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate font-sans text-lg font-bold text-text">{props.title}</h2>
        </div>
      </div>
      <GoalCardProgress
        title={props.title}
        achievementType={props.achievementType}
        invert={props.invert}
        progress={props.progress}
      />
    </article>
  </>
)
