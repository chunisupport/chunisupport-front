import { type Component, Show } from 'solid-js'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../../types/api'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { formatPlayerRating } from '../../utils/ratingFormat'

type Props = {
  playerInfo: PlayerDTO
  honors: HonorDTO[]
  bestRecords: PlayerRecordDTO[]
  newRecords: PlayerRecordDTO[]
}

const sumRating = (records: PlayerRecordDTO[]): number => {
  return records.reduce((sum, record) => sum + record.rating, 0)
}

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
  const primaryHonor = () => props.honors[0]

  return (
    <div class="mb-2 mx-auto w-[min(420px,calc(100%-2rem))] px-3 py-3 border border-border shadow-sm rounded-md ">
      {/* TODO: 称号の背景画像を表示 */}
      <Show when={primaryHonor()}>
        {(honor) => (
          <p
            class={`user-honor-title mb-3 p-1 rounded-md font-sans text-sm text-center ${honorTypeClassNames[honor().type_name]}`}
            data-honor-type={honor().type_name}
          >
            {honor().name}
          </p>
        )}
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
