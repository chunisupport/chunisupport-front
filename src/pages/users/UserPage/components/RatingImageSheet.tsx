import { Image } from '@kobalte/core/image'
import type { Component } from 'solid-js'
import { For, Show } from 'solid-js'
import { SCORE_RANK_TEXT_CLASS } from '../../../../components/common/record/recordStyleClasses'
import { getHonorTypeClassName } from '../../../../constants/honors'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO, UserRatingDTO } from '../../../../types/api'
import { getConstDisplay } from '../../../../utils/constDisplay'
import { difficultyCardBorderColor } from '../../../../utils/difficultyUtils'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import { formatInteger } from '../../../../utils/numberFormat'
import { formatOverPowerPercent, formatOverPowerValue } from '../../../../utils/overPowerFormat'
import { getRankingPositionClass } from '../../../../utils/rankingPosition'
import { formatNullablePlayerRating, formatRatingFixed2 } from '../../../../utils/ratingFormat'
import { getScoreRank } from '../../../../utils/scoreRank'
import {
  RATING_IMAGE_COPY,
  RATING_IMAGE_WIDTH_PX,
  RATING_SLOT_COUNT,
} from '../UserProfileView.constants'
import { UserRecordPlaceholderCard } from './UserRecordPlaceholderCard'

type RatingImageSheetProps = {
  /** 画像上部へ表示するプレイヤー情報。 */
  playerInfo: PlayerDTO
  /** 画像上部へ表示する称号。 */
  honors: HonorDTO[]
  /** ベスト枠・新曲枠と集計値。 */
  rating: UserRatingDTO
  /** カード背景へジャケット画像を表示するかどうか。 */
  showJackets: boolean
  /** 画像化対象のルート要素を受け取るコールバック。 */
  captureRef: (element: HTMLDivElement) => void
}

type RatingImageRecordCardProps = {
  /** 表示対象のレコード。 */
  record: PlayerRecordDTO
  /** 一覧内の0始まりインデックス。 */
  index: number
  /** カード背景へジャケット画像を表示するかどうか。 */
  showJackets: boolean
}

type RatingImageColumnProps = {
  /** 枠見出し。 */
  heading: string
  /** 枠の平均レーティング。 */
  average: number | null
  /** 枠へ採用されたレコード。 */
  records: PlayerRecordDTO[]
  /** 枠の規定件数。 */
  slotCount: number
  /** カード背景へジャケット画像を表示するかどうか。 */
  showJackets: boolean
}

/**
 * プロフィール画像へ表示する代表称号を取得する。
 *
 * @param honors - APIから取得した称号一覧。
 * @returns 1枠目を優先した代表称号。称号がない場合はundefined。
 */
const getPrimaryHonor = (honors: HonorDTO[]): HonorDTO | undefined =>
  honors.find((honor) => honor.slot === 1) ?? honors[0]

/**
 * レーティング枠画像用の静的レコードカードを表示する。
 *
 * @param props - レコード、順位、ジャケット表示設定。
 * @returns 画像化時にリンクやアニメーションを含まないレコードカード。
 */
const RatingImageRecordCard: Component<RatingImageRecordCardProps> = (props) => {
  const scoreRank = () => getScoreRank(props.record.score)
  const indexColor = () => getRankingPositionClass(props.index + 1, 'bg-surface-hover')
  const jacketUrl = () => buildChunithmJacketUrl(props.record.img)
  const constDisplay = () => getConstDisplay(props.record.const, props.record.is_const_unknown)
  const unknownValueClass = () => (props.record.is_const_unknown ? 'text-danger' : 'text-text')

  return (
    <div
      class={`relative isolate h-16 select-none overflow-hidden border-y border-r border-border bg-surface p-2 pl-4 before:absolute before:inset-y-0 before:left-0 before:z-20 before:w-2 ${difficultyCardBorderColor(
        props.record.difficulty
      )}`}
    >
      <Show when={props.showJackets && jacketUrl()}>
        {(url) => (
          <Image
            class="pointer-events-none absolute inset-y-0 right-0 z-0 block w-1/2 overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_33%)]"
            aria-hidden="true"
          >
            <Image.Img
              crossOrigin="anonymous"
              src={url()}
              alt=""
              class="h-full w-full object-cover object-center opacity-15"
            />
          </Image>
        )}
      </Show>
      <div class="relative z-10 flex h-full items-center gap-3">
        <div
          class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${indexColor()} font-oswald text-lg font-bold`}
        >
          {props.index + 1}
        </div>
        <div class="min-w-0 flex-1 overflow-hidden">
          <p class="min-w-0 truncate whitespace-nowrap font-sans text-base font-semibold">
            {props.record.title}
          </p>
          <p class="whitespace-nowrap font-oswald text-base font-bold">
            <span class={unknownValueClass()}>
              {constDisplay().valueText}
              <Show when={constDisplay().markerText}>
                {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
              </Show>
            </span>{' '}
            / {formatInteger(props.record.score)}{' '}
            <span class={SCORE_RANK_TEXT_CLASS[scoreRank()]}>{scoreRank()}</span>
          </p>
        </div>
        <div
          class={`shrink-0 whitespace-nowrap text-right font-oswald text-xl font-bold leading-none ${unknownValueClass()}`}
        >
          {formatRatingFixed2(props.record.rating)}
          <Show when={constDisplay().markerText}>
            {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
          </Show>
        </div>
      </div>
    </div>
  )
}

/**
 * レーティング画像へ1種類の採用枠と空き枠を縦に表示する。
 *
 * @param props - 見出し、平均値、採用レコード、規定件数、ジャケット表示設定。
 * @returns ベスト枠または新曲枠の列。
 */
const RatingImageColumn: Component<RatingImageColumnProps> = (props) => {
  /**
   * 規定件数へ足りない空き枠のインデックスを返す。
   *
   * @returns 実レコードの末尾から始まる0始まりインデックス。
   */
  const emptySlotIndexes = (): number[] =>
    Array.from(
      { length: Math.max(props.slotCount - props.records.length, 0) },
      (_, index) => props.records.length + index
    )

  return (
    <section class="min-w-0">
      <div class="mb-3 flex items-baseline justify-between gap-3 border-b-2 border-border-strong pb-2">
        <h2 class="whitespace-nowrap text-xl font-bold text-text">{props.heading}</h2>
        <p class="whitespace-nowrap font-jost text-base font-medium text-text-muted">
          {RATING_IMAGE_COPY.averageLabel}{' '}
          <strong class="text-lg text-text">{formatNullablePlayerRating(props.average)}</strong>
        </p>
      </div>
      <ol class="flex list-none flex-col gap-2">
        <For each={props.records.slice(0, props.slotCount)}>
          {(record, index) => (
            <li>
              <RatingImageRecordCard
                record={record}
                index={index()}
                showJackets={props.showJackets}
              />
            </li>
          )}
        </For>
        <For each={emptySlotIndexes()}>
          {(index) => (
            <li>
              <UserRecordPlaceholderCard index={index} />
            </li>
          )}
        </For>
      </ol>
    </section>
  )
}

/**
 * プレビューとPNG出力で共有するベスト枠・新曲枠画像本体を表示する。
 *
 * @param props - プレイヤー情報、称号、レーティング枠、ジャケット表示設定、参照コールバック。
 * @returns 固定論理幅の縦長画像レイアウト。
 */
export const RatingImageSheet: Component<RatingImageSheetProps> = (props) => {
  const primaryHonor = () => getPrimaryHonor(props.honors)
  const overPowerValue = () =>
    props.playerInfo.overpower_value === null
      ? '-'
      : formatOverPowerValue(props.playerInfo.overpower_value)
  const overPowerPercent = () =>
    props.playerInfo.overpower_percent === null
      ? '-'
      : formatOverPowerPercent(props.playerInfo.overpower_percent)

  return (
    <div
      ref={props.captureRef}
      class="box-border bg-bg px-6 py-5 font-sans text-text"
      style={{ width: `${RATING_IMAGE_WIDTH_PX}px` }}
    >
      <header class="mx-auto w-full max-w-xl rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
        <Show when={primaryHonor()}>
          {(honor) => (
            <div
              class={`rating-image-honor-title user-honor-title mx-auto mb-3 ${getHonorTypeClassName(honor().type_name)}`}
            >
              <span class="user-honor-title__text truncate">{honor().name}</span>
            </div>
          )}
        </Show>
        <div class="flex items-baseline justify-center gap-4">
          <p class="whitespace-nowrap font-jost text-lg font-medium">
            Lv. {props.playerInfo.level}
          </p>
          <h1 class="min-w-0 truncate text-center font-sans text-2xl font-bold">
            {props.playerInfo.name}
          </h1>
        </div>
        <dl class="mt-3 grid grid-cols-3 divide-x divide-border border-t border-border pt-3 text-center">
          <div>
            <dt class="whitespace-nowrap text-xs font-bold text-text-muted">
              {RATING_IMAGE_COPY.ratingLabel}
            </dt>
            <dd class="whitespace-nowrap font-jost text-xl font-semibold text-text">
              {formatNullablePlayerRating(props.rating.rating)}
            </dd>
          </div>
          <div>
            <dt class="whitespace-nowrap text-xs font-bold text-text-muted">
              {RATING_IMAGE_COPY.overPowerLabel}
            </dt>
            <dd class="whitespace-nowrap font-jost text-xl font-semibold text-text">
              {overPowerValue()}
            </dd>
          </div>
          <div>
            <dt class="whitespace-nowrap text-xs font-bold text-text-muted">
              {RATING_IMAGE_COPY.overPowerPercentLabel}
            </dt>
            <dd class="whitespace-nowrap font-jost text-xl font-semibold text-text">
              {overPowerPercent()}
            </dd>
          </div>
        </dl>
      </header>

      <main class="mt-5 grid grid-cols-2 items-start gap-4">
        <RatingImageColumn
          heading={RATING_IMAGE_COPY.bestHeading}
          average={props.rating.best_average}
          records={props.rating.best}
          slotCount={RATING_SLOT_COUNT.best}
          showJackets={props.showJackets}
        />
        <RatingImageColumn
          heading={RATING_IMAGE_COPY.newHeading}
          average={props.rating.new_average}
          records={props.rating.new}
          slotCount={RATING_SLOT_COUNT.new}
          showJackets={props.showJackets}
        />
      </main>

      <footer class="mt-6 border-t-2 border-border-strong pt-4">
        <p class="font-sans text-base font-bold text-text-muted">{RATING_IMAGE_COPY.generatedBy}</p>
      </footer>
    </div>
  )
}
