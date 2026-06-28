import { Button } from '@kobalte/core/button'
import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import type { GoalDTO } from '../../../../types/api'
import {
  ADD_GOAL_LABEL,
  EMPTY_GOALS_MESSAGE,
  GOALS_LIMIT,
  GOALS_LIMIT_REACHED_MESSAGE,
} from '../constants'
import type { GoalWithProgress } from '../goalsListProgress'
import GoalCard from './GoalCard'

interface GoalsListContentProps {
  goalsCount: number
  goalWithProgress: GoalWithProgress[]
  actionError: string
  onCreate: () => void
  onEdit: (goal: GoalDTO) => void
  onDelete: (goal: GoalDTO) => void
  onOpenRecords: (goal: GoalDTO) => void
}

/**
 * 目標一覧画面のヘッダー、エラー、カード一覧を描画する。
 *
 * @param props - 目標件数、進捗付き目標一覧、各操作ハンドラ。
 * @returns 目標一覧本体の JSX 要素。
 */
export const GoalsListContent: Component<GoalsListContentProps> = (props) => (
  <div class="mx-auto w-full max-w-3xl p-4 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">目標</h1>
        <p class="text-sm text-text-muted">
          {props.goalsCount} / {GOALS_LIMIT}件
        </p>
      </div>
      <Button
        type="button"
        class="rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:opacity-60"
        disabled={props.goalsCount >= GOALS_LIMIT}
        onClick={props.onCreate}
      >
        {ADD_GOAL_LABEL}
      </Button>
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

    <Show
      when={props.goalWithProgress.length > 0}
      fallback={
        <p class="rounded border border-border bg-surface p-4 text-sm text-text-muted">
          {EMPTY_GOALS_MESSAGE}
        </p>
      }
    >
      <div class="grid grid-cols-1 gap-3">
        <For each={props.goalWithProgress}>
          {({ goal, progress }) => (
            <GoalCard
              goal={goal}
              progress={progress}
              onEdit={props.onEdit}
              onDelete={props.onDelete}
              onOpenRecords={props.onOpenRecords}
            />
          )}
        </For>
      </div>
    </Show>
  </div>
)
