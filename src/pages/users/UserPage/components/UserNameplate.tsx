import { Button } from '@kobalte/core/button'
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { HONOR_TYPE_CLASS_NAMES } from '../../../../constants/honors'
import type { HonorDTO, PlayerDTO, UserRatingDTO } from '../../../../types/api'
import { formatOverPowerPercent, formatOverPowerValue } from '../../../../utils/overPowerFormat'
import { formatNullablePlayerRating } from '../../../../utils/ratingFormat'

const HONOR_ROTATION_INTERVAL_MS = 4000
const SCROLL_AMOUNT_CSS_VARIABLE = '--honor-title-scroll-amount'
const SCROLL_DURATION_CSS_VARIABLE = '--honor-title-scroll-duration'
const VISIBLE_HONOR_LIMIT = 3

type Props = {
  playerInfo: PlayerDTO
  honors: HonorDTO[]
  rating: UserRatingDTO
}

type HonorTitleProps = {
  honor: HonorDTO
  isRotating?: boolean
}

/**
 * プレイヤー名札に表示する称号一覧を最大表示件数へ絞り込む。
 *
 * @param honors - APIから取得した称号一覧。
 * @returns ローテーション表示対象の称号一覧。
 */
const getVisibleHonors = (honors: HonorDTO[]): HonorDTO[] => {
  return honors.slice(0, VISIBLE_HONOR_LIMIT)
}

/**
 * 称号配列の範囲内に収まる表示インデックスへ正規化する。
 *
 * @param index - 正規化前の表示インデックス。
 * @param length - 称号配列の件数。
 * @returns 有効な表示インデックス。称号がない場合は 0。
 */
const normalizeHonorIndex = (index: number, length: number): number => {
  return length === 0 ? 0 : index % length
}

/**
 * 要素の表示幅に対する横方向のはみ出し割合を計算する。
 *
 * @param element - 横スクロール量を測定する称号テキスト要素。
 * @returns CSS translateX に渡すための負のパーセント値。はみ出しがない場合は `null`。
 */
const calculateOverflowTranslatePercent = (element: HTMLElement): string | null => {
  if (element.clientWidth === 0 || element.scrollWidth <= element.clientWidth) return null

  const overflowPercentage =
    ((element.scrollWidth - element.clientWidth) / element.clientWidth) * 100

  return `-${overflowPercentage}%`
}

/**
 * APIの称号種別を称号背景のCSSクラス名へ変換する。
 */
const honorTypeClassNames: Record<HonorDTO['type_name'], string> = HONOR_TYPE_CLASS_NAMES

/**
 * 称号種別に応じた装飾を付けて称号名を表示する。
 *
 * @param props - 表示対象の称号とローテーションアニメーションの有無。
 * @returns 称号表示の JSX 要素。
 */
const HonorTitle: Component<HonorTitleProps> = (props) => {
  const [shouldScroll, setShouldScroll] = createSignal(false)
  let titleTextRef: HTMLSpanElement | undefined

  /**
   * 称号テキストが表示幅を超える場合だけ横スクロール用のCSS変数を更新する。
   *
   * @returns なし。
   */
  const updateScrollAnimation = (): void => {
    if (!titleTextRef) return

    const scrollAmount = calculateOverflowTranslatePercent(titleTextRef)

    if (!scrollAmount) {
      titleTextRef.style.removeProperty(SCROLL_AMOUNT_CSS_VARIABLE)
      titleTextRef.style.removeProperty(SCROLL_DURATION_CSS_VARIABLE)
      setShouldScroll(false)
      return
    }

    titleTextRef.style.setProperty(SCROLL_AMOUNT_CSS_VARIABLE, scrollAmount)
    titleTextRef.style.setProperty(SCROLL_DURATION_CSS_VARIABLE, `${HONOR_ROTATION_INTERVAL_MS}ms`)
    setShouldScroll(true)
  }

  // DOM上の実寸が必要なため、マウント後に称号テキストのはみ出し量を測定する。
  onMount(updateScrollAnimation)

  return (
    <span
      class={`user-honor-title${props.isRotating ? ' user-honor-title--rotating' : ''} ${
        honorTypeClassNames[props.honor.type_name]
      }`}
      data-honor-type={props.honor.type_name}
    >
      <span
        ref={titleTextRef}
        class={`user-honor-title__text${shouldScroll() ? ' user-honor-title__text--scrolling' : ''}${
          props.isRotating ? ' user-honor-title__text--rotating' : ''
        }`}
      >
        {props.honor.name}
      </span>
    </span>
  )
}

/**
 * ユーザーの称号、レベル、レーティング、OVER POWERをまとめたプロフィールカードを表示する。
 *
 * @param props - 表示対象のプレイヤー情報、称号、APIで計算済みのレーティング。
 * @returns プロフィールカードの JSX 要素。
 */
export const UserNameplate: Component<Props> = (props) => {
  const playerRatingText = createMemo(() => formatNullablePlayerRating(props.rating.rating))
  const bestRatingText = createMemo(() => formatNullablePlayerRating(props.rating.best_average))
  const newRatingText = createMemo(() => formatNullablePlayerRating(props.rating.new_average))
  const [activeHonorIndex, setActiveHonorIndex] = createSignal(0)
  const [isHonorListExpanded, setIsHonorListExpanded] = createSignal(false)
  const visibleHonors = createMemo(() => getVisibleHonors(props.honors))
  const hasMultipleVisibleHonors = createMemo(() => visibleHonors().length > 1)
  const activeHonor = createMemo(() => {
    const honors = visibleHonors()

    return honors[normalizeHonorIndex(activeHonorIndex(), honors.length)]
  })

  /**
   * 複数称号の表示モードをローテーションと縦並びで切り替える。
   *
   * @returns なし。
   */
  const toggleHonorDisplay = (): void => {
    setIsHonorListExpanded((current) => !current)
  }

  // 称号一覧や展開状態に応じて、表示中の称号インデックスと自動切り替えを同期する。
  createEffect(() => {
    const honorsLength = visibleHonors().length

    setActiveHonorIndex((current) => normalizeHonorIndex(current, honorsLength))

    if (honorsLength <= 1 || isHonorListExpanded()) return

    const intervalId = window.setInterval(() => {
      setActiveHonorIndex((current) => normalizeHonorIndex(current + 1, visibleHonors().length))
    }, HONOR_ROTATION_INTERVAL_MS)

    onCleanup(() => window.clearInterval(intervalId))
  })

  return (
    <div class="mb-2 mx-auto w-[min(420px,calc(100%-2rem))] px-3 py-3 border border-border shadow-sm rounded-md ">
      <Show when={visibleHonors().length > 0}>
        <Show
          when={hasMultipleVisibleHonors()}
          fallback={
            <Show when={activeHonor()} keyed>
              {(honor) => <HonorTitle honor={honor} />}
            </Show>
          }
        >
          <Button
            type="button"
            class="user-honor-toggle"
            aria-expanded={isHonorListExpanded()}
            aria-label={
              isHonorListExpanded() ? '称号をローテーション表示に戻す' : '称号を縦に表示する'
            }
            onClick={toggleHonorDisplay}
          >
            <Show
              when={isHonorListExpanded()}
              fallback={
                <Show when={activeHonor()} keyed>
                  {(honor) => <HonorTitle honor={honor} isRotating />}
                </Show>
              }
            >
              <span class="user-honor-list">
                <For each={visibleHonors()}>{(honor) => <HonorTitle honor={honor} />}</For>
              </span>
            </Show>
          </Button>
        </Show>
      </Show>
      <div class="mb-2 flex flex-row items-end justify-between">
        <p class="">Lv. {props.playerInfo.level}</p>
        <h1 class="flex-1 text-xl font-medium text-center">{props.playerInfo.name}</h1>
      </div>
      <hr class="mb-2 border-t border-border" />
      <p>
        RATING <b>{playerRatingText()}</b>{' '}
        <span class="goal-card-progress-secondary">
          (BEST <b>{bestRatingText()}</b> / NEW <b>{newRatingText()}</b>)
        </span>
      </p>
      {/* TODO: OVER POWERのゲージみたいなのあるといいよね */}
      <p>
        OVER POWER{' '}
        <b>
          {props.playerInfo.overpower_value == null
            ? undefined
            : formatOverPowerValue(props.playerInfo.overpower_value)}
        </b>{' '}
        (
        <Show when={props.playerInfo.overpower_percent !== null}>
          {formatOverPowerPercent(props.playerInfo.overpower_percent ?? 0)}
        </Show>
        %)
      </p>
    </div>
  )
}
