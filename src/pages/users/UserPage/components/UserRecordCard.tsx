import { Image } from '@kobalte/core/image'
import { A } from '@solidjs/router'
import type { Component } from 'solid-js'
import { createSignal, onMount, Show } from 'solid-js'
import {
  RECORD_CARD_HOVER_CLASS,
  RECORD_CARD_LAMP_BADGE_CLASS,
} from '../../../../components/common/record/RecordDisplayParts'
import { getDefaultRecordLampLabel } from '../../../../components/common/record/recordLampLabel'
import {
  getComboLampBadgeClass,
  SCORE_RANK_TEXT_CLASS,
} from '../../../../components/common/record/recordStyleClasses'
import type { PlayerRecordDTO } from '../../../../types/api'
import { getConstDisplay } from '../../../../utils/constDisplay'
import {
  difficultyCardBorderColor,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import { formatInteger } from '../../../../utils/numberFormat'
import { getRankingPositionClass } from '../../../../utils/rankingPosition'
import { formatRatingFixed2 } from '../../../../utils/ratingFormat'
import { formatScoreDifference } from '../../../../utils/scoreDifference'
import { getScoreRank } from '../../../../utils/scoreRank'

type Props = {
  record: PlayerRecordDTO
  index: number
  showJackets: boolean
  scoreDifference?: number
  useDefaultIndexColor?: boolean
}

/**
 * ユーザーのプレイレコードをカード形式で表示する。
 *
 * @param props - 表示対象のレコード、一覧内の0始まりインデックス、候補枠までのスコア差。
 * @returns 楽曲詳細へ遷移できるレコードカード。
 */
export const UserRecordCard: Component<Props> = (props) => {
  const [shouldAnimate, setShouldAnimate] = createSignal(false)
  let titleRef: HTMLParagraphElement | undefined
  const scoreRank = () => getScoreRank(props.record.score)
  const indexColor = () =>
    getRankingPositionClass(props.useDefaultIndexColor ? 0 : props.index + 1, 'bg-surface-hover')
  const jacketUrl = () => buildChunithmJacketUrl(props.record.img)
  const constDisplay = () => getConstDisplay(props.record.const, props.record.is_const_unknown)
  const unknownValueClass = () => (props.record.is_const_unknown ? 'text-danger' : 'text-text')

  // DOM上の実寸に応じて、カード幅からはみ出す楽曲名だけ横スクロールさせる。
  onMount(() => {
    if (titleRef && titleRef.clientWidth > 0 && titleRef.scrollWidth > titleRef.clientWidth) {
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
          class={`relative isolate select-none overflow-hidden border-y border-r border-border bg-surface p-2 pl-4 ${RECORD_CARD_HOVER_CLASS} before:absolute before:top-0 before:bottom-0 before:left-0 before:z-20 before:w-2 ${difficultyCardBorderColor(props.record.difficulty)}`}
        >
          <Show when={props.showJackets && jacketUrl()}>
            {(url) => (
              <Image
                class="pointer-events-none absolute inset-y-0 right-0 z-0 block w-1/2 overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_33%)]"
                aria-hidden="true"
              >
                <Image.Img
                  src={url()}
                  alt=""
                  class="h-full w-full object-cover object-center opacity-15"
                />
              </Image>
            )}
          </Show>
          <div class="relative z-10 flex items-center gap-3">
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
                <span class={unknownValueClass()}>
                  {constDisplay().valueText}
                  <Show when={constDisplay().markerText}>
                    {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
                  </Show>
                </span>{' '}
                / {formatInteger(props.record.score)}{' '}
                <span class={SCORE_RANK_TEXT_CLASS[scoreRank()]}>{scoreRank()}</span>
                <Show when={props.scoreDifference !== undefined}>
                  <span class="relative -top-px ml-1 font-oswald text-xs font-medium text-rating-candidate-gap">
                    ({formatScoreDifference(props.scoreDifference ?? 0)})
                  </span>
                </Show>
                {/* 意味色はバッジ塗りで保持し、ライトテーマでも読めるようにする。 */}
                <Show when={props.record.combo_lamp}>
                  {(lamp) => (
                    <span
                      class={`ml-1 mb-[3px] ${RECORD_CARD_LAMP_BADGE_CLASS} ${getComboLampBadgeClass(lamp(), props.record.score)}`}
                    >
                      {getDefaultRecordLampLabel(lamp(), props.record.score)}
                    </span>
                  )}
                </Show>
              </p>
            </div>
            <div
              class={`shrink-0 text-right font-oswald text-xl font-bold leading-none ${unknownValueClass()}`}
            >
              {formatRatingFixed2(props.record.rating)}
              <Show when={constDisplay().markerText}>
                {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
              </Show>
            </div>
          </div>
        </div>
      </A>
    </div>
  )
}
