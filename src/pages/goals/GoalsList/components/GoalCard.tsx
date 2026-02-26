import type { Component } from 'solid-js'
import type { GoalDTO, MasterDataDTO } from '../../../../../types/api'
import { formatGoalAttributesLabel, formatGoalTypeLabel } from '../../utils/goalForm'
import type { GoalProgressResult } from '../../utils/goalProgress'

interface GoalCardProps {
  goal: GoalDTO
  progress: GoalProgressResult
  masterData: MasterDataDTO
  onEdit: (goal: GoalDTO) => void
  onDelete: (goal: GoalDTO) => void
}

const formatValue = (value: number, type: GoalDTO['achievement_type']) => {
  if (type === 'overpower_value' || type === 'overpower_percent') {
    return value.toLocaleString('ja-JP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })
  }

  return Math.floor(value).toLocaleString('ja-JP')
}

const GoalCard: Component<GoalCardProps> = (props) => {
  const displayCurrent = () =>
    props.goal.invert ? Math.max(props.progress.target - props.progress.current, 0) : props.progress.current
  const displayPercent = () => (props.goal.invert ? 100 - props.progress.percent : props.progress.percent)

  return (
    <article class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{props.goal.title}</h2>
          <p class="mt-1 text-sm text-gray-600">{formatGoalTypeLabel(props.goal.achievement_type)}</p>
          <p class="mt-1 text-xs text-gray-500">
            {formatGoalAttributesLabel(props.goal.attributes, props.masterData)}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            onClick={() => props.onEdit(props.goal)}
          >
            編集
          </button>
          <button
            type="button"
            class="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            onClick={() => props.onDelete(props.goal)}
          >
            削除
          </button>
        </div>
      </div>

      <div class="mt-4">
        <div class="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>{props.goal.invert ? '反転表示（未達寄り）' : '進捗'}</span>
          <span>{displayPercent().toFixed(1)}%</span>
        </div>
        <div class="h-2 rounded bg-gray-200">
          <div
            class="h-2 rounded bg-green-600"
            style={{ width: `${Math.max(0, Math.min(displayPercent(), 100))}%` }}
          />
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between text-sm">
        <span class="text-gray-700">
          {formatValue(displayCurrent(), props.goal.achievement_type)} /{' '}
          {formatValue(props.progress.target, props.goal.achievement_type)}
        </span>
        {props.progress.achieved && (
          <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            達成
          </span>
        )}
      </div>

      {props.goal.achievement_type === 'overpower_percent' && props.progress.hasUnknownMaxOp && (
        <p class="mt-2 text-xs text-amber-700">※ maxop不明譜面を含むため、達成率は暫定値です。</p>
      )}
    </article>
  )
}

export default GoalCard
