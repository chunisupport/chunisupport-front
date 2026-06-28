import type { Component } from 'solid-js'
import { GOAL_TITLE_MAX_LENGTH } from './constants'
import { GoalTextField } from './goalFormFields'
import {
  GOAL_STEP_BADGE_CLASS,
  GOAL_STEP_DESCRIPTION_CLASS,
  GOAL_STEP_SECTION_CLASS,
  GOAL_STEP_TITLE_CLASS,
} from './goalFormStyles'

interface GoalTitleSectionProps {
  title: string
  onTitleChange: (title: string) => void
}

/**
 * 目標フォームのタイトル入力セクションを描画する。
 *
 * @param props - タイトル入力値と変更ハンドラ。
 * @returns タイトル入力セクションの JSX 要素。
 */
export const GoalTitleSection: Component<GoalTitleSectionProps> = (props) => (
  <section class={GOAL_STEP_SECTION_CLASS}>
    <div class="mb-3 flex items-center gap-3">
      <span class={GOAL_STEP_BADGE_CLASS}>1</span>
      <div>
        <h2 class={GOAL_STEP_TITLE_CLASS}>タイトル</h2>
        <p class={GOAL_STEP_DESCRIPTION_CLASS}>表示名を設定します。</p>
      </div>
    </div>

    <GoalTextField
      label=""
      ariaLabel="タイトル"
      value={props.title}
      maxLength={GOAL_TITLE_MAX_LENGTH}
      onChange={props.onTitleChange}
    />
  </section>
)
