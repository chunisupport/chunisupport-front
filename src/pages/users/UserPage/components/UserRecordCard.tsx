import { A } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createSignal, onMount } from 'solid-js'
import type { PlayerRecordDTO } from '../../../../types/api'

type Props = {
  record: PlayerRecordDTO
  index: number
  useDefaultIndexColor?: boolean
}

import {
  difficultyCardBorderColor,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'
import { getScoreRank } from '../../../../utils/scoreRank'
import { SCORE_RANK_TEXT_CLASS } from '../../components/recordStyleClasses'
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

/**
 * ユーザーのプレイレコードをカード形式で表示する。
 *
 * @param props - 表示対象のレコードと一覧内の0始まりインデックス。
 * @returns 楽曲詳細へ遷移できるレコードカード。
 */
export const UserRecordCard: Component<Props> = (props) => {
  const [shouldAnimate, setShouldAnimate] = createSignal(false)
  let titleRef: HTMLParagraphElement | undefined
  const scoreRank = () => getScoreRank(props.record.score)
  const indexColor = () => (props.useDefaultIndexColor ? idxColor(0) : idxColor(props.index + 1))

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
      <A
        href={`/songs/${encodeURIComponent(props.record.id)}?diff=${encodeURIComponent(difficultyToQueryValue(props.record.difficulty))}`}
        class="group block text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      >
        <div
          class={`relative select-none border-y border-r border-border bg-surface p-2 pl-4 ${RECORD_CARD_HOVER_CLASS} before:absolute before:top-0 before:bottom-0 before:left-0 before:w-2 ${difficultyCardBorderColor(props.record.difficulty)}`}
        >
          <div class="flex items-center gap-3">
            <div
              class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${indexColor()} font-oswald text-lg font-bold`}
            >
              {props.index + 1}
            </div>
            <div class="min-w-0 flex-1 overflow-hidden">
              <p
                ref={titleRef}
                class={`whitespace-nowrap font-sans text-base font-semibold ${shouldAnimate() ? 'animate-marquee' : ''}`}
              >
                {props.record.title}
              </p>
              <p class="text-base font-oswald font-bold">
                {props.record.const.toFixed(1)} / {props.record.score.toLocaleString('ja-JP')}{' '}
                <span class={SCORE_RANK_TEXT_CLASS[scoreRank()]}>{scoreRank()}</span>
              </p>
            </div>
            <div class="shrink-0 text-right font-oswald text-lg font-bold leading-none">
              {props.record.rating.toFixed(2)}
            </div>
          </div>
        </div>
      </A>
    </div>
  )
}
