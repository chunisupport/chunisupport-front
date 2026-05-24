import { Button } from '@kobalte/core/button'
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../../types/api'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { formatPlayerRating } from '../../utils/ratingFormat'

const HONOR_ROTATION_INTERVAL_MS = 4000
const VISIBLE_HONOR_LIMIT = 3

type Props = {
  playerInfo: PlayerDTO
  honors: HonorDTO[]
  bestRecords: PlayerRecordDTO[]
  newRecords: PlayerRecordDTO[]
}

type HonorTitleProps = {
  honor: HonorDTO
  isRotating?: boolean
}

/**
 * レーティング対象レコードの rating 合計値を計算する。
 *
 * @param records - 合計対象のプレイヤーレコード一覧。
 * @returns rating の合計値。
 */
const sumRating = (records: PlayerRecordDTO[]): number => {
  return records.reduce((sum, record) => sum + record.rating, 0)
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
 * APIの称号種別を称号背景のCSSクラス名へ変換する。
 */
const honorTypeClassNames: Record<HonorDTO['type_name'], string> = {
  normal: 'user-honor-title--normal',
  copper: 'user-honor-title--copper',
  silver: 'user-honor-title--silver',
  gold: 'user-honor-title--gold',
  platina: 'user-honor-title--platina',
  rainbow: 'user-honor-title--rainbow',
  staff: 'user-honor-title--staff',
  ongeki: 'user-honor-title--ongeki',
  maimai: 'user-honor-title--maimai',
  sp: 'user-honor-title--sp',
  phoenix_g: 'user-honor-title--phoenix-g',
  phoenix_p: 'user-honor-title--phoenix-p',
  phoenix_r: 'user-honor-title--phoenix-r',
  expert: 'user-honor-title--expert',
  master: 'user-honor-title--master',
  ultima: 'user-honor-title--ultima',
}

/**
 * 称号種別に応じた装飾を付けて称号名を表示する。
 *
 * @param props - 表示対象の称号とローテーションアニメーションの有無。
 * @returns 称号表示の JSX 要素。
 */
const HonorTitle: Component<HonorTitleProps> = (props) => (
  <span
    class={`user-honor-title${props.isRotating ? ' user-honor-title--rotating' : ''} ${
      honorTypeClassNames[props.honor.type_name]
    }`}
    data-honor-type={props.honor.type_name}
  >
    {props.honor.name}
  </span>
)

/**
 * ユーザーの称号、レベル、レーティング、OVER POWERをまとめたプロフィールカードを表示する。
 *
 * @param props - 表示対象のプレイヤー情報、称号、レーティング対象レコード。
 * @returns プロフィールカードの JSX 要素。
 */
export const UserNameplate: Component<Props> = (props) => {
  const bestSum = sumRating(props.bestRecords)
  const newSum = sumRating(props.newRecords)
  const bestRating = props.bestRecords.length > 0 ? bestSum / props.bestRecords.length : 0
  const newRating = props.newRecords.length > 0 ? newSum / props.newRecords.length : 0
  const totalRecordsLength = props.bestRecords.length + props.newRecords.length
  const playerRating = totalRecordsLength > 0 ? (bestSum + newSum) / totalRecordsLength : 0
  const playerRatingText = formatPlayerRating(playerRating)
  const bestRatingText = formatPlayerRating(bestRating)
  const newRatingText = formatPlayerRating(newRating)
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
        RATING <b>{playerRatingText}</b>{' '}
        <span class="goal-card-progress-secondary">
          (BEST <b>{bestRatingText}</b> / NEW <b>{newRatingText}</b>)
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
