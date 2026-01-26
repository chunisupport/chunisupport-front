import { Progress } from '@kobalte/core/progress'
import { CircleX } from 'lucide-solid'
import type { Component } from 'solid-js'
import type { TrackingCondition } from '../utils/storage'

/** 追跡の統計情報の型定義 */
type TrackingStats = {
  /** 達成数 */
  achieved: number
  /** 総数 */
  total: number
  /** 残り数 */
  remaining: number
  /** 達成数の割合 */
  percent: number
}

type TrackingSummaryProps = {
  condition: TrackingCondition
  targetName: string
  goalLabel: string
  stats: TrackingStats
  onClear: () => void
}

const TrackingSummary: Component<TrackingSummaryProps> = (props) => (
  <div class="mb-2 p-2 border border-lime-600 rounded-sm text-lime-600">
    <div class="flex justify-between mb-1 items-center">
      <div class="flex items-center gap-2">
        <p class="text-base font-bold">追跡中の条件</p>
        <CircleX
          class="text-red-500 cursor-pointer hover:bg-lime-100"
          size={16}
          onClick={props.onClear}
        />
      </div>
      <div class="flex items-center gap-2">
        <p>
          達成: <span class="text-base">{props.stats.achieved}</span>
        </p>
      </div>
    </div>
    <div class="flex justify-between mb-2">
      <p>
        「{props.targetName}」 {props.goalLabel}
      </p>
      <p>
        残り: {props.stats.remaining}, 総数: {props.stats.total}
      </p>
    </div>
    <Progress value={props.stats.percent} class="w-full">
      <Progress.Track class="h-3 rounded bg-gray-200">
        <Progress.Fill class="h-full rounded w-(--kb-progress-fill-width) bg-lime-500" />
      </Progress.Track>
    </Progress>
  </div>
)

export default TrackingSummary
