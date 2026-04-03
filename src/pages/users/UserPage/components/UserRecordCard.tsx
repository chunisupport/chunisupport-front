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
      <div class="flex gap-3">
        <div class="flex flex-col">
          <p># {props.index + 1}</p>
          <p class="text-sm">{props.record.rating.toFixed(2)}</p>
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
          <p class="text-sm">
            {props.record.const} / {props.record.score}
          </p>
        </div>
      </div>
    </div>
  )
}
