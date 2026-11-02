import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { getOverPowerColorTierClass } from '../../utils/overPowerColorTier'

type Props = {
  /** 色段階の判定に使う理論値に対する達成率（0〜100） */
  percent: number
  /** 表示する整形済みの数値文字列 */
  text: string
}

/**
 * OVER POWER達成率に応じたグラデーション文字と影で数値を表示する。
 * 白段階は色付けせず、周囲と同じ文字色のまま表示する。
 * 数字の形に沿う影（filter: drop-shadow）とグラデーション文字の background-clip:text を
 * 同じ要素に重ねると Safari や SnapDOM で描画が崩れるため、外側と内側の span に分けて付与する。
 *
 * @param props - 達成率と表示する数値文字列。
 * @returns 色段階付きの数値。
 */
export const OverPowerTierValue: Component<Props> = (props) => (
  <Show when={getOverPowerColorTierClass(props.percent)} fallback={props.text}>
    {(colorClass) => (
      <span class="over-power-tier">
        <span class={colorClass()}>{props.text}</span>
      </span>
    )}
  </Show>
)
