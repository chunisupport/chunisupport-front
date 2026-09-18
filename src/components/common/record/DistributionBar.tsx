import type { Component } from 'solid-js'
import { createMemo, For } from 'solid-js'

/** 積み上げ分布バーの1区分を表す表示情報 */
export type DistributionBarSegment = {
  /** 区分を一意に識別する値 */
  key: string
  /** バー全体に占める割合 */
  percent: number
  /** 区分へ適用する背景色クラス */
  colorClass: string
  /** ホバー時に表示する補足 */
  title?: string
  /** 色を付けず空き領域として表示するか */
  transparent?: boolean
}

type DistributionBarProps = {
  /** 左から順に描画する分布区分 */
  segments: readonly DistributionBarSegment[]
  /** バーの高さを指定するTailwindクラス */
  heightClass?: string
  /** 外枠へ追加するTailwindクラス */
  class?: string
}

/** 分布区分の境界を視認しやすくする影 */
const DISTRIBUTION_SEGMENT_SHADOW_CLASS = 'shadow-[2px_0_3px_-1px_rgba(0,0,0,0.4)]'

/**
 * 割合に応じた横幅で分布区分を積み上げ表示する。
 *
 * @param props - 分布区分、高さ、外枠の表示設定。
 * @returns スクリーンリーダーから除外した装飾用の積み上げバー。
 */
export const DistributionBar: Component<DistributionBarProps> = (props) => {
  const visibleSegments = createMemo(() => props.segments.filter((segment) => segment.percent > 0))

  return (
    <div class={`overflow-hidden ${props.class ?? ''}`} aria-hidden="true">
      <div class={`flex w-full overflow-visible bg-surface-hover ${props.heightClass ?? 'h-5'}`}>
        <For each={visibleSegments()}>
          {(segment, index) => (
            <div
              class={`${segment.transparent === true ? 'bg-transparent' : segment.colorClass} relative h-full ${
                index() === visibleSegments().length - 1 ? '' : DISTRIBUTION_SEGMENT_SHADOW_CLASS
              }`}
              style={{
                width: `${segment.percent}%`,
                'z-index': visibleSegments().length - index(),
              }}
              title={segment.title}
            />
          )}
        </For>
      </div>
    </div>
  )
}
