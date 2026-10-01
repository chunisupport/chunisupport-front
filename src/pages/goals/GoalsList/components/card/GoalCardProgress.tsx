import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import type { GoalAchievementType } from '../../../../../types/api'
import type { GoalProgressResult } from '../../../utils/goalProgress'
import { GOAL_NO_TARGET_LABEL } from '../../constants'
import { resolveGoalCardDisplayProgress } from './goalCardProgressModel'

/** 目標カードの進捗表示に必要なプロパティ */
interface GoalCardProgressProps {
  /** 進捗ゲージのアクセシブル名に使う目標タイトル */
  title: string
  /** 数値の表示形式を決める目標種別 */
  achievementType: GoalAchievementType
  /** 現在値を達成までの残量として表示するか */
  invertValue: boolean
  /** 達成率を達成までの残り割合として表示するか */
  invertPercentage: boolean
  /** 現在値、目標値、達成率を含む進捗情報 */
  progress: GoalProgressResult
  /** 現在値、目標値、達成率の数値表示を含めるか */
  showValues?: boolean
}

/** 折りたたみ時の割合表示に必要なプロパティ */
type GoalCardProgressPercentageProps = Pick<
  GoalCardProgressProps,
  'achievementType' | 'invertValue' | 'invertPercentage' | 'progress'
>

/**
 * 反転表示時に現在値へ添える未達量ラベル。
 */
const INVERT_PROGRESS_LABEL = '残り'

/**
 * 折りたたんだ目標カードに割合・平均目標の残り点数・対象なしの状態を表示する。
 *
 * @param props - 目標種別、反転設定、進捗情報。
 * @returns 折りたたみ時の進捗要約 JSX 要素。
 */
export const GoalCardProgressPercentage: Component<GoalCardProgressPercentageProps> = (props) => {
  /**
   * 目標の設定を反映した表示用進捗を取得する。
   *
   * @returns 目標種別に応じた進捗要約の表示情報。
   */
  const displayProgress = () =>
    resolveGoalCardDisplayProgress(
      props.progress,
      props.achievementType,
      props.invertValue,
      props.invertPercentage
    )

  return (
    <Show
      when={props.progress.targetCount > 0}
      fallback={<span class="pt-1 font-sans text-sm text-text-muted">{GOAL_NO_TARGET_LABEL}</span>}
    >
      <span class="goal-card-progress-secondary flex shrink-0 items-baseline pt-1 text-right font-oswald font-semibold leading-none">
        <Show when={displayProgress().percentPrefixText}>
          <span class="text-sm">{displayProgress().percentPrefixText}</span>
        </Show>
        <span class="text-lg">{displayProgress().percentText}</span>
        <Show when={displayProgress().percentSuffixText}>
          <span class="text-sm">{displayProgress().percentSuffixText}</span>
        </Show>
      </span>
    </Show>
  )
}

/**
 * 目標カード共通の進捗数値とゲージを表示する。
 *
 * @param props - タイトル、目標種別、実数値・割合の反転表示、進捗情報、数値表示の有無。
 * @returns 目標カードの進捗表示 JSX 要素。
 */
export const GoalCardProgress: Component<GoalCardProgressProps> = (props) => {
  const displayProgress = () =>
    resolveGoalCardDisplayProgress(
      props.progress,
      props.achievementType,
      props.invertValue,
      props.invertPercentage
    )

  return (
    <div class="mt-2">
      <Show
        when={props.progress.targetCount > 0}
        fallback={
          (props.showValues ?? true) ? (
            <p class="font-sans text-sm text-text-muted">{GOAL_NO_TARGET_LABEL}</p>
          ) : undefined
        }
      >
        <Show when={props.showValues ?? true}>
          <div class="flex items-baseline gap-1">
            {props.invertValue && props.achievementType !== 'avg_score' && (
              <span class="text-base font-medium leading-none text-text">
                {INVERT_PROGRESS_LABEL}
              </span>
            )}
            <span class="font-oswald text-3xl font-bold leading-none text-text">
              {displayProgress().currentText}
            </span>
          </div>
          <div class="-mt-1.5 mb-2 flex items-end justify-between gap-3">
            <div class="flex min-w-0 w-full items-end gap-3 text-text-subtle">
              <div class="pb-0.5 font-oswald text-lg font-bold leading-none">/</div>
              <div class="goal-card-progress-secondary pb-0.5 font-oswald text-xl font-bold leading-none">
                {displayProgress().targetText}
              </div>
              {/* 右側の行高を縮めても、負の上余白がある下段と左側の位置を維持する。 */}
              <div class="goal-card-progress-secondary ml-auto flex min-h-7.5 items-end pb-0.5 text-right font-oswald font-semibold leading-none">
                <Show when={displayProgress().percentPrefixText}>
                  <span class="text-sm leading-none">{displayProgress().percentPrefixText}</span>
                </Show>
                <span class="text-lg leading-none">{displayProgress().percentText}</span>
                <Show when={displayProgress().percentSuffixText}>
                  <span class="text-sm leading-none">{displayProgress().percentSuffixText}</span>
                </Show>
              </div>
            </div>
          </div>
        </Show>
        <progress
          class="h-2 w-full rounded appearance-none overflow-hidden [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-action-secondary [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-action-primary [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-action-primary"
          value={displayProgress().progressValue}
          max={100}
          aria-label={`${props.title} 進捗`}
          aria-valuetext={displayProgress().ariaValueText}
        />
      </Show>
    </div>
  )
}
