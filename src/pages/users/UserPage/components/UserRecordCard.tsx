import { A } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createSignal, onMount } from 'solid-js'
import type { PlayerRecordDTO } from '../../../../types/api'

type Props = {
  record: PlayerRecordDTO
  index: number
}

import {
  difficultyCardBorderColor,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'

// FIXME: 色使いすぎ？
const idxColor = (index: number) => {
  switch (index) {
    case 1:
      return 'bg-yellow-300'
    case 2:
      return 'bg-gray-300'
    case 3:
      return 'bg-orange-300'
    default:
      return 'bg-gray-100'
  }
}

export const UserRecordCard: Component<Props> = (props) => {
  const [shouldAnimate, setShouldAnimate] = createSignal(false)
  let titleRef: HTMLParagraphElement | undefined

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
    <div
      class={`relative pl-4 p-2 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-2 shadow-md ${difficultyCardBorderColor(props.record.difficulty)}`}
    >
      <div class="flex gap-3 items-center">
        <div class={`w-8 h-8 flex items-center justify-center rounded-full ${idxColor(props.index + 1)} font-oswald font-bold text-lg`}>
          {props.index + 1}
        </div>
        <div class="flex-1 min-w-0 overflow-hidden">
          <A
            href={`/songs/${encodeURIComponent(props.record.id)}?diff=${encodeURIComponent(difficultyToQueryValue(props.record.difficulty))}`}
            class="text-inherit hover:underline"
          >
            <p
              ref={titleRef}
              class={`font-semibold whitespace-nowrap ${shouldAnimate() ? 'animate-marquee' : ''}`}
            >
              {props.record.title}
            </p>
          </A>
          <p class="text-sm font-oswald font-bold">
            {props.record.rating.toFixed(2)} &lt; {props.record.const} / {props.record.score}
          </p>
        </div>
      </div>
    </div>
  )
}
