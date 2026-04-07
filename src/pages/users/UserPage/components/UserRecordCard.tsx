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
    <div class="flex flex-col gap-2">
      <Show when={props.showCandidateDivider}>
        <div class="mt-4 border-t-2 border-gray-300 pt-4" aria-hidden="true" />
      </Show>
      <div
        class={`relative border-y border-r border-gray-200 bg-white p-2 pl-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-2 ${difficultyCardBorderColor(props.record.difficulty)}`}
      >
        <div class="flex gap-3 items-center">
          <div
            class={`w-8 h-8 flex items-center justify-center rounded-full ${idxColor(props.index + 1)} font-oswald font-bold text-lg`}
          >
            {props.index + 1}
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <A
              href={`/songs/${encodeURIComponent(props.record.id)}?diff=${encodeURIComponent(difficultyToQueryValue(props.record.difficulty))}`}
              class="text-inherit hover:underline"
            >
              <p
                ref={titleRef}
                class={`text-lg font-semibold whitespace-nowrap ${shouldAnimate() ? 'animate-marquee' : ''}`}
              >
                {props.record.title}
              </p>
            </A>
            <p class="text-base font-oswald font-bold">
              {props.record.rating.toFixed(2)} &lt; {props.record.const} /{' '}
              {props.record.score.toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
