import type { Component } from 'solid-js'
import type { HonorDTO, PlayerDTO, PlayerRecordDTO } from '../../../../types/api'

type Props = {
  playerInfo: PlayerDTO
  honors: HonorDTO[]
  bestRecords: PlayerRecordDTO[]
  newRecords: PlayerRecordDTO[]
}

const sumRating = (records: PlayerRecordDTO[]): number => {
  return records.reduce((sum, record) => sum + record.rating, 0)
}

export const UserNameplate: Component<Props> = (props) => {
  const bestSum = sumRating(props.bestRecords)
  const newSum = sumRating(props.newRecords)
  const bestRating = props.bestRecords.length > 0 ? bestSum / props.bestRecords.length : 0
  const newRating = props.newRecords.length > 0 ? newSum / props.newRecords.length : 0
  const totalRecordsLength = props.bestRecords.length + props.newRecords.length
  const playerRating = totalRecordsLength > 0 ? (bestSum + newSum) / totalRecordsLength : 0

  return (
    <div class="mb-2 mx-4 px-3 py-3 border border-gray-200 shadow-sm rounded-md ">
      {/* TODO: 称号の背景画像を表示 */}
      <p class="mb-3 p-1 bg-yellow-200 rounded-md text-sm text-center">{props.honors[0].name}</p>
      <div class="mb-2 flex flex-row items-end justify-between">
        <p class="">Lv. {props.playerInfo.level}</p>
        <h1 class="flex-1 text-xl font-medium text-center">{props.playerInfo.name}</h1>
      </div>
      <hr class="mb-2 border-t border-gray-200" />
      <p>
        Rating {playerRating.toFixed(4)}{' '}
        <span class="text-gray-500">
          (Best {bestRating.toFixed(4)} / New {newRating.toFixed(4)})
        </span>
      </p>
      {/* TODO: OverPowerのゲージみたいなのあるといいよね */}
      <p>OP {props.playerInfo.overpower_percent}%</p>
    </div>
  )
}
