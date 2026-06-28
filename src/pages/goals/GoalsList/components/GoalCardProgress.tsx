import type { Component } from 'solid-js'
import type { GoalAchievementType } from '../../../../types/api'
import type { GoalProgressResult } from '../../utils/goalProgress'
import { resolveGoalCardDisplayProgress } from './goalCardProgressModel'

interface GoalCardProgressProps {
  title: string
  achievementType: GoalAchievementType
  invert: boolean
  progress: GoalProgressResult
}

/**
 * 反転表示時に現在値へ添える未達量ラベル。
 */
const INVERT_PROGRESS_LABEL = '残り'

/**
 * 目標カード共通の進捗数値とゲージを表示する。
 *
 * @param props - タイトル、目標種別、反転表示、進捗情報。
 * @returns 目標カードの進捗表示 JSX 要素。
 */
export const GoalCardProgress: Component<GoalCardProgressProps> = (props) => {
  const displayProgress = () =>
    resolveGoalCardDisplayProgress(props.progress, props.achievementType, props.invert)

  return (
    <div class="mt-2">
      <div class="flex items-baseline gap-1">
        {props.invert && (
          <span class="text-base font-medium leading-none text-text">{INVERT_PROGRESS_LABEL}</span>
        )}
        <span class="font-oswald text-3xl font-bold leading-none text-text">
          {displayProgress().currentText}
        </span>
      </div>
      <div class="mb-2 mt-1 flex items-end justify-between gap-3">
        <div class="flex min-w-0 w-full items-end gap-3 text-text-subtle">
          <div class="pb-0.5 font-oswald text-lg font-bold leading-none">/</div>
          <div class="goal-card-progress-secondary pb-0.5 font-oswald text-xl font-bold leading-none">
            {displayProgress().targetText}
          </div>
          <div class="goal-card-progress-secondary ml-auto pb-0.5 text-right font-oswald text-lg font-semibold leading-none">
            {displayProgress().percentText}
          </div>
        </div>
      </div>
      <progress
        class="h-2 w-full rounded appearance-none overflow-hidden [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-action-secondary [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-action-primary [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-action-primary"
        value={displayProgress().progressValue}
        max={100}
        aria-label={`${props.title} 進捗 ${displayProgress().percentText}`}
      />
    </div>
  )
}
