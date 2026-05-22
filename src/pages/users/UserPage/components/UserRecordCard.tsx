import { A } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createSignal, onMount, Show } from 'solid-js'
import type { PlayerRecordDTO } from '../../../../types/api'

type Props = {
  record: PlayerRecordDTO
  index: number
  showCandidateDivider?: boolean
}

import {
  difficultyCardBorderColor,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'
import { getScoreRank } from '../../../../utils/scoreRank'
import { RECORD_CARD_HOVER_CLASS } from '../../components/SharedRecordTableColumns'

// FIXME: 色使いすぎ？
/**
 * レコード順位の表示色クラスを返す。
 *
 * @param index - 1始まりの順位。
 * @returns 順位に対応する背景色と文字色のTailwindクラス。
 */
const idxColor = (index: number) => {
  switch (index) {
    case 1:
      return 'bg-ranking-gold-bg text-ranking-medal-text'
    case 2:
      return 'bg-ranking-silver-bg text-ranking-medal-text'
    case 3:
      return 'bg-ranking-bronze-bg text-ranking-medal-text'
    default:
      return 'bg-surface-hover'
  }
}

export const UserRecordCard: Component<Props> = (props) => {
  const [shouldAnimate, setShouldAnimate] = createSignal(false)
  let titleRef: HTMLParagraphElement | undefined
  const scoreRank = () => getScoreRank(props.record.score)

  onMount(() => {
    if (titleRef && titleRef.scrollWidth > titleRef.clientWidth) {
      // はみ出している割合を計算
      const overflowPercentage =
        ((titleRef.scrollWidth - titleRef.clientWidth) / titleRef.clientWidth) * 100
      // CSS変数に設定
      titleRef.style.setProperty('--scroll-amount', `-${overflowPercentage}%`)
      setShouldAnimate(true)
    }
  })

  return (
    <div class="flex flex-col gap-2">
      <Show when={props.showCandidateDivider}>
        <div class="mt-4 border-t-2 border-border-strong pt-4" aria-hidden="true" />
      </Show>
      <A
        href={`/songs/${encodeURIComponent(props.record.id)}?diff=${encodeURIComponent(difficultyToQueryValue(props.record.difficulty))}`}
        class="group block text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      >
        <div
          class={`relative select-none border-y border-r border-border bg-surface p-2 pl-4 ${RECORD_CARD_HOVER_CLASS} before:absolute before:top-0 before:bottom-0 before:left-0 before:w-2 ${difficultyCardBorderColor(props.record.difficulty)}`}
        >
          <div class="flex gap-3 items-center">
            <div
              class={`w-8 h-8 flex items-center justify-center rounded-full ${idxColor(props.index + 1)} font-oswald font-bold text-lg`}
            >
              {props.index + 1}
            </div>
            <div class="flex-1 min-w-0 overflow-hidden">
              <p
                ref={titleRef}
                class={`font-sans text-base font-semibold whitespace-nowrap ${shouldAnimate() ? 'animate-marquee' : ''}`}
              >
                {props.record.title}
              </p>
              <p class="text-base font-oswald font-bold">
                {props.record.rating.toFixed(2)} &lt; {props.record.const} /{' '}
                {props.record.score.toLocaleString('ja-JP')} {scoreRank()}
              </p>
            </div>
          </div>
        </div>
      </A>
    </div>
  )
}
