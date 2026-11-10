import type { Component } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { splitGoalValueDisplay } from '../../utils/goalValueFormat'
import { GOAL_VALUE_UNIT_CLASS } from '../constants'

interface GoalValueWithUnitProps {
  /** 読み上げとコピーに使う、単位を含む表示文字列。 */
  text: string
  /** 数値の後ろに付ける単位。空なら数値だけをそのまま出す。 */
  unit: string
}

/**
 * 目標値を表示する。
 * 単位があるときだけ単位を数値より小さくし、ベースラインを揃える。
 * 要素内のテキストは数値と単位を空白なしで続けたままにする。
 *
 * @param props - 表示文字列と、その末尾に付く単位。
 * @returns 単位を縮小表示した目標値。単位がない場合は文字列だけ。
 */
export const GoalValueWithUnit: Component<GoalValueWithUnitProps> = (props) => {
  const parts = createMemo(() => splitGoalValueDisplay(props.text, props.unit))

  return (
    <Show when={parts().unitText} fallback={parts().numberText}>
      {(unitText) => (
        <span class="inline-flex items-baseline">
          {/* 配列にすると数値と単位の間へ空白のテキストノードが入らない。 */}
          {[parts().numberText, <span class={GOAL_VALUE_UNIT_CLASS}>{unitText()}</span>]}
        </span>
      )}
    </Show>
  )
}
