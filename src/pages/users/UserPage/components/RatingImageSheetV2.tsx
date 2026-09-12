import { Triangle } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import placeholderImageUrl from '../../../../assets/placeholder.png'
import {
  getComboLampBadgeClass,
  SCORE_RANK_TEXT_CLASS,
} from '../../../../components/common/record/recordStyleClasses'
import { normalizePlayerDataDifficulty } from '../../../../constants/difficulty'
import { getHonorTypeClassName } from '../../../../constants/honors'
import { RATING_SLOT_COUNT } from '../../../../constants/rating'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO, UserRatingDTO } from '../../../../types/api'
import { getConstDisplay } from '../../../../utils/constDisplay'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import { formatInteger } from '../../../../utils/numberFormat'
import { getRankingPositionClass } from '../../../../utils/rankingPosition'
import { formatNullablePlayerRating, formatRatingFixed2 } from '../../../../utils/ratingFormat'
import { getScoreRank } from '../../../../utils/scoreRank'
import {
  buildEmptyRatingSlotLabel,
  RATING_IMAGE_COPY,
  RATING_IMAGE_V2_CARD_PADDING_PX,
  RATING_IMAGE_V2_COLUMN_COUNT,
  RATING_IMAGE_V2_DIFFICULTY_STRIPE_PX,
  RATING_IMAGE_V2_GAP_PX,
  RATING_IMAGE_V2_HONOR_COLUMN_PX,
  RATING_IMAGE_V2_JACKET_LAMP_BADGE_CLASS,
  RATING_IMAGE_V2_JACKET_LAMP_MARGIN_PX,
  RATING_IMAGE_V2_JACKET_PX,
  RATING_IMAGE_V2_META_GAP_PX,
  RATING_IMAGE_V2_META_TRIANGLE_GAP_PX,
  RATING_IMAGE_V2_META_TRIANGLE_PX,
  RATING_IMAGE_V2_META_VALUE_LABEL_CLASS,
  RATING_IMAGE_V2_META_VALUE_LABEL_GAP_PX,
  RATING_IMAGE_V2_META_WIDTH_PX,
  RATING_IMAGE_V2_PADDING_PX,
  RATING_IMAGE_V2_WIDTH_PX,
} from '../UserProfileView.constants'
import { RatingImageFooter } from './RatingImageFooter'
import { RatingImageJacketMedia } from './RatingImageJacketMedia'
import {
  buildHonorSlots,
  formatRatingImageOverPowerPercent,
  formatRatingImageOverPowerValue,
  getRatingImageV2ComboLampLabel,
  HONOR_SLOT_NUMBERS,
} from './ratingImageShared'

type RatingImageSheetV2Props = {
  /** 画像上部へ表示するプレイヤー情報 */
  playerInfo: PlayerDTO
  /** 画像上部へ表示する称号 */
  honors: HonorDTO[]
  /** ベスト枠・新曲枠と集計値 */
  rating: UserRatingDTO
  /** カードへジャケット画像を表示するかどうか */
  showJackets: boolean
  /** 画像化対象のルート要素を受け取るコールバック */
  captureRef: (element: HTMLDivElement) => void
  /** ジャケット画像ごとの準備状態を通知するコールバック */
  onJacketReadyChange: (key: string, ready: boolean) => void
}

type RatingImageV2JacketTileProps = {
  /** 表示対象のレコード */
  record: PlayerRecordDTO
  /** 一覧内の0始まりインデックス */
  index: number
  /** カードへジャケット画像を表示するかどうか */
  showJackets: boolean
  /** 画像化対象内でジャケット画像を識別するキー */
  jacketKey: string
  /** ジャケット画像の準備状態を通知するコールバック */
  onJacketReadyChange: (key: string, ready: boolean) => void
}

type RatingImageV2JacketComboLampProps = {
  /** コンボランプ表示対象のレコード */
  record: PlayerRecordDTO
}

type RatingImageV2EmptyTileProps = {
  /** 一覧内の0始まりインデックス */
  index: number
}

type RatingImageV2HeaderStatProps = {
  /** 数値の下へ置くラベル */
  label: string
  /** 値の文字サイズクラス */
  valueClass: string
  /** ラベル上へ表示する値 */
  children: JSX.Element
}

type RatingImageV2MetaValueProps = {
  /** 数値の上へ置くラベル */
  label: string
  /** 数値の文字色クラス */
  valueClass: string
  /** ラベル下へ表示する数値 */
  children: JSX.Element
}

type RatingImageV2GridProps = {
  /** 枠見出し */
  heading: string
  /** 枠へ採用されたレコード */
  records: PlayerRecordDTO[]
  /** 枠の規定件数 */
  slotCount: number
  /** カードへジャケット画像を表示するかどうか */
  showJackets: boolean
  /** 枠を識別するキー */
  columnKey: 'best' | 'new'
  /** ジャケット画像の準備状態を通知するコールバック */
  onJacketReadyChange: (key: string, ready: boolean) => void
}

/**
 * レーティング枠画像 Ver. 2 の譜面カード余白を返す。
 * 左端の難易度縦線ぶんだけ左余白を広げる。
 *
 * @returns 上下右は通常余白、左は縦線幅を足した余白。
 */
/**
 * レーティング枠画像 Ver. 2 のヘッダー指標を、値の下にラベルを置いて表示する。
 *
 * @param props - ラベル、値の文字サイズ、表示値。
 * @returns 値の下にラベルを置いた指標。
 */
const RatingImageV2HeaderStat: Component<RatingImageV2HeaderStatProps> = (props) => (
  <div class="shrink-0">
    <div class={`whitespace-nowrap font-jost font-semibold leading-none ${props.valueClass}`}>
      {props.children}
    </div>
    <p class="mt-[6px] whitespace-nowrap text-[13px] font-bold leading-none text-text-muted">
      {props.label}
    </p>
  </div>
)

/**
 * レーティング枠画像 Ver. 2 の譜面定数またはレーティングを、ラベルの下に置いて表示する。
 *
 * @param props - ラベル、数値の文字色、表示値。
 * @returns ラベルの下に数値を置いた指標。
 */
const RatingImageV2MetaValue: Component<RatingImageV2MetaValueProps> = (props) => (
  <div
    class="flex shrink-0 flex-col items-center"
    style={{ gap: `${RATING_IMAGE_V2_META_VALUE_LABEL_GAP_PX}px` }}
  >
    <span class={RATING_IMAGE_V2_META_VALUE_LABEL_CLASS}>{props.label}</span>
    <span
      class={`shrink-0 whitespace-nowrap font-oswald text-[18px] font-bold leading-none ${props.valueClass}`}
    >
      {props.children}
    </span>
  </div>
)

const buildRatingImageV2CardPaddingStyle = (): JSX.CSSProperties => ({
  padding: `${RATING_IMAGE_V2_CARD_PADDING_PX}px`,
  'padding-left': `${RATING_IMAGE_V2_CARD_PADDING_PX + RATING_IMAGE_V2_DIFFICULTY_STRIPE_PX}px`,
})

/**
 * レーティング枠画像 Ver. 2 の空きジャケット枠を表示する。
 * 順位数字は曲ありカードと同じ 32px 枠と上余白へ置き、ジャケットがなくても位置を揃える。
 *
 * @param props - 空き枠の一覧内インデックス。
 * @returns 曲ありカードと同じ寸法のプレースホルダー。
 */
const RatingImageV2EmptyTile: Component<RatingImageV2EmptyTileProps> = (props) => {
  /**
   * 表示する1始まりの枠番号を返す。
   *
   * @returns プレースホルダーの枠番号。
   */
  const slotNumber = () => props.index + 1

  return (
    <div class="rating-image-v2-card h-full min-w-0" style={buildRatingImageV2CardPaddingStyle()}>
      <span class="sr-only">{buildEmptyRatingSlotLabel(slotNumber())}</span>
      <div
        class="flex min-w-0"
        style={{ gap: `${RATING_IMAGE_V2_META_GAP_PX}px` }}
        aria-hidden="true"
      >
        <div
          class="flex shrink-0 items-start justify-center"
          style={{
            padding: '2px 0',
            width: `${RATING_IMAGE_V2_META_WIDTH_PX}px`,
          }}
        >
          <div class="flex h-[32px] w-[32px] shrink-0 items-center justify-center font-oswald text-[18px] font-bold leading-none text-disabled-text">
            {slotNumber()}
          </div>
        </div>
        <div
          class="shrink-0 bg-surface-muted"
          style={{
            height: `${RATING_IMAGE_V2_JACKET_PX}px`,
            width: `${RATING_IMAGE_V2_JACKET_PX}px`,
          }}
        />
      </div>
      <div
        class="min-w-0 border-t border-border"
        style={{ 'margin-top': '8px', 'padding-top': '6px' }}
        aria-hidden="true"
      >
        <p class="rating-image-v2-title min-w-0">{'\u00a0'}</p>
      </div>
    </div>
  )
}

/**
 * レーティング枠画像 Ver. 2 のジャケット左上へコンボランプバッジを表示する。
 * AJCは虹色の ALL JUSTICE として表示する。
 *
 * @param props - 表示対象のレコード。
 * @returns コンボランプがある場合のみ左上のバッジ。
 */
const RatingImageV2JacketComboLamp: Component<RatingImageV2JacketComboLampProps> = (props) => {
  /**
   * 表示するコンボランプを返す。
   *
   * @returns コンボランプ。未設定なら null。
   */
  const comboLamp = () => props.record.combo_lamp

  return (
    <Show when={comboLamp()}>
      {(lamp) => (
        <span
          class={`rating-image-v2-jacket-lamp pointer-events-none absolute top-0 left-0 z-20 ${RATING_IMAGE_V2_JACKET_LAMP_BADGE_CLASS} ${getComboLampBadgeClass(lamp(), props.record.score)}`}
          style={{ margin: `${RATING_IMAGE_V2_JACKET_LAMP_MARGIN_PX}px` }}
        >
          {getRatingImageV2ComboLampLabel(lamp())}
        </span>
      )}
    </Show>
  )
}

/**
 * レーティング枠画像 Ver. 2 のジャケットタイルを表示する。
 *
 * @param props - レコード、順位、ジャケット表示設定。
 * @returns 左端に難易度色の縦線を付けたジャケットタイル。
 */
const RatingImageV2JacketTile: Component<RatingImageV2JacketTileProps> = (props) => {
  const scoreRank = () => getScoreRank(props.record.score)
  const jacketUrl = () => buildChunithmJacketUrl(props.record.img)
  const constDisplay = () => getConstDisplay(props.record.const, props.record.is_const_unknown)
  const jacketSource = () => (props.showJackets ? jacketUrl() : null)
  const indexColor = () => getRankingPositionClass(props.index + 1, 'bg-surface-hover text-text')
  const numericClass = () => (props.record.is_const_unknown ? 'text-danger' : 'text-text')

  /**
   * 左端の縦線へ付ける正規化済み難易度を返す。
   *
   * @returns 大文字の難易度。未対応の場合は null。
   */
  const difficulty = () => normalizePlayerDataDifficulty(props.record.difficulty)

  /**
   * プレースホルダー画像のデコード完了後に準備完了を通知する。
   *
   * @param image - 読み込みを完了したプレースホルダー画像。
   * @returns なし。
   */
  const notifyPlaceholderReady = (image: HTMLImageElement): void => {
    void image
      .decode()
      .catch(() => undefined)
      .then(() => props.onJacketReadyChange(props.jacketKey, true))
  }

  /**
   * プレースホルダーの load イベントから準備完了を通知する。
   *
   * @param event - 読み込みを完了した画像イベント。
   * @returns なし。
   */
  const handlePlaceholderLoad: JSX.EventHandlerUnion<HTMLImageElement, Event> = (event): void => {
    notifyPlaceholderReady(event.currentTarget)
  }

  return (
    <div
      class="rating-image-v2-card h-full min-w-0"
      data-difficulty={difficulty() ?? undefined}
      style={buildRatingImageV2CardPaddingStyle()}
    >
      <div class="flex min-w-0" style={{ gap: `${RATING_IMAGE_V2_META_GAP_PX}px` }}>
        <div
          class="flex shrink-0 flex-col items-center justify-between"
          style={{
            height: `${RATING_IMAGE_V2_JACKET_PX}px`,
            padding: '2px 0',
            width: `${RATING_IMAGE_V2_META_WIDTH_PX}px`,
          }}
        >
          <div
            class={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full font-oswald text-[18px] font-bold leading-none ${indexColor()}`}
          >
            {props.index + 1}
          </div>
          <div
            class="flex shrink-0 flex-col items-center"
            style={{ gap: `${RATING_IMAGE_V2_META_TRIANGLE_GAP_PX}px` }}
          >
            <RatingImageV2MetaValue
              label={RATING_IMAGE_COPY.constLabel}
              valueClass={numericClass()}
            >
              {constDisplay().valueText}
              <Show when={constDisplay().markerText}>
                {(marker) => <sup class="align-super text-[0.7em]">{marker()}</sup>}
              </Show>
            </RatingImageV2MetaValue>
            <Triangle
              class="shrink-0 rotate-180 text-text-muted"
              style={{
                height: `${RATING_IMAGE_V2_META_TRIANGLE_PX}px`,
                width: `${RATING_IMAGE_V2_META_TRIANGLE_PX}px`,
              }}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden="true"
            />
            <RatingImageV2MetaValue
              label={RATING_IMAGE_COPY.ratingLabel}
              valueClass={numericClass()}
            >
              {formatRatingFixed2(props.record.rating)}
              <Show when={constDisplay().markerText}>
                {(marker) => <sup class="align-super text-[0.6em]">{marker()}</sup>}
              </Show>
            </RatingImageV2MetaValue>
          </div>
        </div>
        <div
          class="relative shrink-0 bg-surface"
          style={{
            height: `${RATING_IMAGE_V2_JACKET_PX}px`,
            width: `${RATING_IMAGE_V2_JACKET_PX}px`,
          }}
        >
          <Show
            when={jacketSource()}
            fallback={
              <img
                src={placeholderImageUrl}
                alt=""
                class="pointer-events-none absolute inset-0 z-0 block h-full w-full object-cover object-center"
                ref={(image) => {
                  if (image.complete) notifyPlaceholderReady(image)
                }}
                onLoad={handlePlaceholderLoad}
              />
            }
          >
            {(url) => (
              <RatingImageJacketMedia
                source={url()}
                jacketKey={props.jacketKey}
                onJacketReadyChange={props.onJacketReadyChange}
                class="pointer-events-none absolute inset-0 z-0 block overflow-hidden"
                imageClass="block h-full w-full object-cover object-center"
                fallbackClass="block h-full w-full"
              />
            )}
          </Show>
          <RatingImageV2JacketComboLamp record={props.record} />
          <div class="pointer-events-none absolute inset-x-0 bottom-0.5 z-20 flex flex-col items-end">
            <span class="rating-image-v2-jacket-score shrink-0 whitespace-nowrap text-right font-oswald text-[17px] font-bold leading-none">
              {formatInteger(props.record.score)}
            </span>
            <span
              class={`rating-image-v2-jacket-rank shrink-0 whitespace-nowrap font-oswald text-[15px] font-bold leading-none ${SCORE_RANK_TEXT_CLASS[scoreRank()]}`}
            >
              {scoreRank()}
            </span>
          </div>
        </div>
      </div>
      <div
        class="min-w-0 border-t border-border"
        style={{ 'margin-top': '8px', 'padding-top': '6px' }}
      >
        <p class="rating-image-v2-title min-w-0 text-text">{props.record.title}</p>
      </div>
    </div>
  )
}

/**
 * レーティング枠画像 Ver. 2 のジャケットグリッドを表示する。
 *
 * @param props - 見出し、採用レコード、規定件数、ジャケット表示設定。
 * @returns ベスト枠または新曲枠の格子。
 */
const RatingImageV2Grid: Component<RatingImageV2GridProps> = (props) => {
  /**
   * 規定件数分の枠インデックスを返す。
   *
   * @returns 0始まりの枠番号配列。
   */
  const slotIndexes = (): number[] => Array.from({ length: props.slotCount }, (_, index) => index)

  return (
    <section class="min-w-0">
      <h2
        class="inline-flex shrink-0 items-center whitespace-nowrap bg-action-primary px-[10px] py-[5px] font-sans text-[24px] font-bold leading-none text-text-inverse"
        style={{ 'margin-bottom': '10px' }}
      >
        {props.heading}
      </h2>
      <ol
        class="m-0 list-none p-0"
        style={{
          display: 'grid',
          gap: `${RATING_IMAGE_V2_GAP_PX}px`,
          'grid-template-columns': `repeat(${RATING_IMAGE_V2_COLUMN_COUNT}, minmax(0, 1fr))`,
        }}
      >
        <For each={slotIndexes()}>
          {(slotIndex) => (
            <li class="min-w-0">
              <Show
                when={props.records[slotIndex]}
                fallback={<RatingImageV2EmptyTile index={slotIndex} />}
              >
                {(record) => (
                  <RatingImageV2JacketTile
                    record={record()}
                    index={slotIndex}
                    showJackets={props.showJackets}
                    jacketKey={`${props.columnKey}-${slotIndex}`}
                    onJacketReadyChange={props.onJacketReadyChange}
                  />
                )}
              </Show>
            </li>
          )}
        </For>
      </ol>
    </section>
  )
}

/**
 * プレビューとJPEG出力で共有するベスト枠・新曲枠画像 Ver. 2 を表示する。
 *
 * @param props - プレイヤー情報、称号、レーティング枠、ジャケット表示設定、参照コールバック。
 * @returns ジャケットを格子状に並べた固定論理幅の縦長画像レイアウト。
 */
export const RatingImageSheetV2: Component<RatingImageSheetV2Props> = (props) => {
  const honorSlots = () => buildHonorSlots(props.honors)
  const overPowerValue = () => formatRatingImageOverPowerValue(props.playerInfo.overpower_value)
  const overPowerPercent = () =>
    formatRatingImageOverPowerPercent(props.playerInfo.overpower_percent)

  return (
    <div
      ref={props.captureRef}
      class="rating-image-v2-backdrop box-border font-sans text-text"
      style={{
        padding: `${RATING_IMAGE_V2_PADDING_PX}px`,
        width: `${RATING_IMAGE_V2_WIDTH_PX}px`,
      }}
    >
      <header
        class="rating-image-v2-header flex gap-[16px] bg-surface"
        style={{
          'border-left': '8px solid var(--color-action-primary)',
          padding: '16px 20px',
        }}
      >
        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 items-baseline gap-[12px]">
            <h1 class="min-w-0 flex-1 truncate font-sans text-[48px] font-bold leading-none">
              {props.playerInfo.name}
            </h1>
            <p class="shrink-0 whitespace-nowrap font-jost text-[22px] font-medium text-text-muted">
              Lv. {props.playerInfo.level}
            </p>
          </div>
          <div
            class="flex min-w-0 items-end gap-[24px]"
            style={{
              'border-top': '1px solid var(--color-border)',
              'margin-top': '12px',
              'padding-top': '10px',
            }}
          >
            <RatingImageV2HeaderStat label={RATING_IMAGE_COPY.ratingLabel} valueClass="text-[28px]">
              {formatNullablePlayerRating(props.rating.rating)}
            </RatingImageV2HeaderStat>
            <RatingImageV2HeaderStat
              label={RATING_IMAGE_COPY.bestAverageLabel}
              valueClass="text-[22px]"
            >
              {formatNullablePlayerRating(props.rating.best_average)}
            </RatingImageV2HeaderStat>
            <RatingImageV2HeaderStat
              label={RATING_IMAGE_COPY.newAverageLabel}
              valueClass="text-[22px]"
            >
              {formatNullablePlayerRating(props.rating.new_average)}
            </RatingImageV2HeaderStat>
            <RatingImageV2HeaderStat
              label={RATING_IMAGE_COPY.overPowerFullLabel}
              valueClass="text-[22px]"
            >
              {overPowerValue()}
              <span class="text-[16px] font-medium text-text-muted"> ({overPowerPercent()}%)</span>
            </RatingImageV2HeaderStat>
          </div>
        </div>
        <div
          class="flex shrink-0 flex-col justify-center gap-[4px]"
          style={{ width: `${RATING_IMAGE_V2_HONOR_COLUMN_PX}px` }}
        >
          <For each={[...HONOR_SLOT_NUMBERS]}>
            {(slot) => (
              <Show
                when={honorSlots()[slot - 1]}
                fallback={
                  <div class="rating-image-v2-honor-empty">
                    <span class="sr-only">{RATING_IMAGE_COPY.emptyHonorSlot}</span>
                  </div>
                }
              >
                {(currentHonor) => (
                  <div
                    class={`rating-image-honor-title user-honor-title mb-0 w-full ${getHonorTypeClassName(currentHonor().type_name)}`}
                  >
                    <span class="user-honor-title__text truncate">{currentHonor().name}</span>
                  </div>
                )}
              </Show>
            )}
          </For>
        </div>
      </header>

      <main class="flex flex-col" style={{ gap: '22px', 'margin-top': '18px' }}>
        <RatingImageV2Grid
          heading={RATING_IMAGE_COPY.bestHeading}
          records={props.rating.best}
          slotCount={RATING_SLOT_COUNT.best}
          showJackets={props.showJackets}
          columnKey="best"
          onJacketReadyChange={props.onJacketReadyChange}
        />
        <RatingImageV2Grid
          heading={RATING_IMAGE_COPY.newHeading}
          records={props.rating.new}
          slotCount={RATING_SLOT_COUNT.new}
          showJackets={props.showJackets}
          columnKey="new"
          onJacketReadyChange={props.onJacketReadyChange}
        />
      </main>

      <RatingImageFooter
        style={{
          'border-top': '2px solid var(--color-border-strong)',
          'margin-top': '18px',
          'padding-top': '12px',
        }}
      />
    </div>
  )
}
