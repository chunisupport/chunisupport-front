import { Button } from '@kobalte/core/button'
import { Tooltip } from '@kobalte/core/tooltip'
import { A } from '@solidjs/router'
import { ChartColumnIncreasing } from 'lucide-solid'
import {
  type Component,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { fetchPossessions } from '../../../../api/possessions'
import { getAppButtonClass } from '../../../../components/common/AppButton'
import { HONOR_TYPE_CLASS_NAMES } from '../../../../constants/honors'
import { getPossessionClassName } from '../../../../constants/possession'
import type {
  HonorDTO,
  PlayerDTO,
  PlayerRecordDTO,
  PossessionName,
  UserRatingDTO,
} from '../../../../types/api'
import { formatOverPowerPercent, formatOverPowerValue } from '../../../../utils/overPowerFormat'
import { resolvePossessionName } from '../../../../utils/possession'
import { formatNullablePlayerRating } from '../../../../utils/ratingFormat'
import {
  hasUnknownChartConstants,
  hasUnknownOverPowerChartConstants,
  hasUnknownOverPowerPercentChartConstants,
} from '../../../../utils/unknownChartConstant'
import {
  USER_NAMEPLATE_HISTORY_LINK_ARIA_LABEL,
  USER_NAMEPLATE_HISTORY_LINK_LABEL,
  USER_NAMEPLATE_METRIC_LABELS,
  USER_NAMEPLATE_UNKNOWN_CONST_HINT,
  USER_NAMEPLATE_UNKNOWN_CONST_MARKER,
} from './UserNameplate.constants'

const HONOR_ROTATION_INTERVAL_MS = 4000
const SCROLL_AMOUNT_CSS_VARIABLE = '--honor-title-scroll-amount'
const SCROLL_DURATION_CSS_VARIABLE = '--honor-title-scroll-duration'
const VISIBLE_HONOR_LIMIT = 3

type Props = {
  playerInfo: PlayerDTO
  honors: HonorDTO[]
  rating: UserRatingDTO
  /** RATING・OVER POWER・OP%履歴ページへのリンク先 */
  historyHref: string
  /** 通常譜面レコード。未取得時はOVER POWER値・達成率の定数未判明判定を行わない */
  records?: readonly PlayerRecordDTO[]
  /** マスタ解決を省略して適用するポゼッション名。確認画面向け */
  possessionName?: PossessionName
}

type HonorTitleProps = {
  honor: HonorDTO
  isRotating?: boolean
}

type UnknownConstMetricValueProps = {
  /** 表示する指標文字列 */
  value: string
  /** 定数未判明の譜面を含むか */
  unknown: boolean
}

/**
 * 定数未判明の譜面を含む指標値を薄く表示し、ホバーまたはタップで理由を示す。
 *
 * @param props - 表示する指標文字列と未判明状態。
 * @returns 通常時は数値、未判明時はヒント付きの数値。
 */
const UnknownConstMetricValue: Component<UnknownConstMetricValueProps> = (props) => {
  const [isHintOpen, setIsHintOpen] = createSignal(false)
  let ignoreCloseOnClick = false

  return (
    <Show when={props.unknown} fallback={props.value}>
      <Tooltip
        open={isHintOpen()}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && ignoreCloseOnClick) {
            ignoreCloseOnClick = false
            return
          }
          setIsHintOpen(nextOpen)
        }}
        placement="top"
        gutter={4}
        openDelay={400}
      >
        <Tooltip.Trigger
          type="button"
          class="relative inline-block cursor-help rounded-sm p-0 align-baseline leading-none text-inherit opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          aria-label={`${props.value}。${USER_NAMEPLATE_UNKNOWN_CONST_HINT}`}
          onClick={() => {
            ignoreCloseOnClick = true
            setIsHintOpen((current) => !current)
            queueMicrotask(() => {
              ignoreCloseOnClick = false
            })
          }}
        >
          {props.value}
          <sup class="font-sans text-[0.55em] leading-none" aria-hidden="true">
            {USER_NAMEPLATE_UNKNOWN_CONST_MARKER}
          </sup>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="z-60 rounded-md border border-border-strong bg-surface-raised px-2 py-1 font-sans text-xs text-text shadow-lg">
            {USER_NAMEPLATE_UNKNOWN_CONST_HINT}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip>
    </Show>
  )
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
 * ユーザーの称号、レベル、指標とRATING・OVER POWER・OP%履歴への導線を表示する。
 * カード背景色はポゼッションに応じて切り替える。
 *
 * @param props - プレイヤー情報、称号、計算済みレーティング、通常譜面レコード、履歴ページのリンク先、確認用ポゼッション名。
 * @returns プロフィールカードの JSX 要素。
 */
export const UserNameplate: Component<Props> = (props) => {
  const [possessions] = createResource(
    () => (props.possessionName == null ? true : undefined),
    () => fetchPossessions()
  )
  /** 明示指定、またはマスタから解決したポゼッション名。未取得時は既定値 */
  const possessionName = createMemo(
    () =>
      props.possessionName ??
      resolvePossessionName(props.playerInfo.possession_id, possessions() ?? [])
  )
  const playerRatingText = createMemo(() => formatNullablePlayerRating(props.rating.rating))
  const bestRatingText = createMemo(() => formatNullablePlayerRating(props.rating.best_average))
  const newRatingText = createMemo(() => formatNullablePlayerRating(props.rating.new_average))
  const bestHasUnknownChartConstants = createMemo(() => hasUnknownChartConstants(props.rating.best))
  const newHasUnknownChartConstants = createMemo(() => hasUnknownChartConstants(props.rating.new))
  const ratingHasUnknownChartConstants = createMemo(
    () => bestHasUnknownChartConstants() || newHasUnknownChartConstants()
  )
  /** 現在OVER POWER集計対象に定数未判明の譜面が含まれるか */
  const overPowerHasUnknownChartConstants = createMemo(() =>
    hasUnknownOverPowerChartConstants(props.records ?? [])
  )
  /** OVER POWER達成率の計算対象に定数未判明の譜面が含まれるか */
  const overPowerPercentHasUnknownChartConstants = createMemo(() =>
    hasUnknownOverPowerPercentChartConstants(props.records ?? [])
  )
  /** OVER POWER値の表示文字列。未設定時は undefined */
  const overPowerValueText = createMemo(() =>
    props.playerInfo.overpower_value == null
      ? undefined
      : formatOverPowerValue(props.playerInfo.overpower_value)
  )
  /** OVER POWER達成率の表示文字列。未設定時は undefined */
  const overPowerPercentText = createMemo(() =>
    props.playerInfo.overpower_percent == null
      ? undefined
      : formatOverPowerPercent(props.playerInfo.overpower_percent)
  )
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
    <div
      class={`user-nameplate relative mb-2 mx-auto w-[min(380px,calc(100%-2rem))] rounded-md px-3 py-3 shadow-sm ${getPossessionClassName(
        possessionName()
      )}`}
      data-possession={possessionName()}
    >
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
      <hr class="mb-2 border-t" />
      <dl class="space-y-2">
        <div>
          <dt class="text-sm font-medium leading-tight">{USER_NAMEPLATE_METRIC_LABELS.rating}</dt>
          <dd class="flex flex-wrap items-baseline gap-x-2 leading-none">
            <strong class="font-jost text-2xl font-semibold tracking-tight">
              <UnknownConstMetricValue
                value={playerRatingText()}
                unknown={ratingHasUnknownChartConstants()}
              />
            </strong>
            <span class="user-nameplate-metric-secondary font-jost text-base font-semibold">
              {USER_NAMEPLATE_METRIC_LABELS.best}{' '}
              <UnknownConstMetricValue
                value={bestRatingText()}
                unknown={bestHasUnknownChartConstants()}
              />
              {' / '}
              {USER_NAMEPLATE_METRIC_LABELS.new}{' '}
              <UnknownConstMetricValue
                value={newRatingText()}
                unknown={newHasUnknownChartConstants()}
              />
            </span>
          </dd>
        </div>
        <div class="pr-20">
          <dt class="text-sm font-medium leading-tight">
            {USER_NAMEPLATE_METRIC_LABELS.overPower}
          </dt>
          <dd class="flex flex-wrap items-baseline gap-x-2 leading-none">
            <strong class="font-jost text-2xl font-semibold tracking-tight">
              <Show when={overPowerValueText() !== undefined}>
                <UnknownConstMetricValue
                  value={overPowerValueText() ?? ''}
                  unknown={overPowerHasUnknownChartConstants()}
                />
              </Show>
            </strong>
            <span class="user-nameplate-metric-secondary font-jost text-base font-semibold">
              <Show when={overPowerPercentText() !== undefined} fallback="%">
                <UnknownConstMetricValue
                  value={`${overPowerPercentText() ?? ''}%`}
                  unknown={overPowerPercentHasUnknownChartConstants()}
                />
              </Show>
            </span>
          </dd>
        </div>
      </dl>
      <A
        href={props.historyHref}
        class={getAppButtonClass({
          variant: 'surface',
          size: 'xs',
          shape: 'pill',
          class: 'absolute right-3 bottom-3',
        })}
        aria-label={USER_NAMEPLATE_HISTORY_LINK_ARIA_LABEL}
      >
        <ChartColumnIncreasing class="h-4 w-4" aria-hidden="true" />
        <span>{USER_NAMEPLATE_HISTORY_LINK_LABEL}</span>
      </A>
    </div>
  )
}
