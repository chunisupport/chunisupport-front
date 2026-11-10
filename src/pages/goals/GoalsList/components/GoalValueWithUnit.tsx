import type { Component, JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { splitGoalNumberText, splitGoalValueDisplay } from '../../utils/goalValueFormat'
import { GOAL_VALUE_FRACTION_CLASS, GOAL_VALUE_UNIT_CLASS } from '../constants'

interface GoalValueWithUnitProps {
  /** 読み上げとコピーに使う、単位を含む表示文字列。 */
  text: string
  /** 数値の後ろに付ける単位。空なら数値だけをそのまま出す。 */
  unit: string
}

/**
 * 目標値を表示する。
 * 小数点以下と単位は整数部より小さくし、ベースラインを揃える。
 * 小数も単位もない値は文字列のまま出す。
 * 要素内のテキストは数値と単位を空白なしで続けたままにする。
 *
 * @param props - 表示文字列と、その末尾に付く単位。
 * @returns 小数部と単位を縮小表示した目標値。
 */
export const GoalValueWithUnit: Component<GoalValueWithUnitProps> = (props) => {
  const parts = createMemo(() => {
    const { numberText, unitText } = splitGoalValueDisplay(props.text, props.unit)
    const { integerText, fractionText } = splitGoalNumberText(numberText)
    return { integerText, fractionText, unitText }
  })

  /**
   * 整数部、小数部、単位を空白なしで並べる。
   *
   * @returns 表示ノード。小数部と単位がない要素は含めない。
   */
  const content = (): JSX.Element[] => {
    const display = parts()
    const nodes: JSX.Element[] = [display.integerText]
    if (display.fractionText) {
      nodes.push(<span class={GOAL_VALUE_FRACTION_CLASS}>{display.fractionText}</span>)
    }
    if (display.unitText) {
      nodes.push(<span class={GOAL_VALUE_UNIT_CLASS}>{display.unitText}</span>)
    }
    return nodes
  }

  return (
    <Show when={parts().fractionText || parts().unitText} fallback={parts().integerText}>
      <span class="inline-flex items-baseline">{content()}</span>
    </Show>
  )
}
