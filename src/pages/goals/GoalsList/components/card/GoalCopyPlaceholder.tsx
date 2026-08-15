import type { Component } from 'solid-js'
import { Loading } from '../../../../../components/Loading'
import { GOAL_COPY_LOADING_LABEL } from '../../constants'

/**
 * コピー先へ目標カードが追加されるまでのローディング表示を描画する。
 *
 * @returns 目標カードと同じ外観を持つプレースホルダー。
 */
export const GoalCopyPlaceholder: Component = () => (
  <article class="flex min-h-36 items-center justify-center rounded-lg border border-border bg-surface p-4 shadow-sm">
    <Loading ariaLabel={GOAL_COPY_LOADING_LABEL} />
  </article>
)
