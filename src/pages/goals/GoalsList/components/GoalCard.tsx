import { type Component, createSignal, onCleanup } from 'solid-js'
import { Pencil, Trash2, MoreVertical } from 'lucide-solid'
import type { GoalDTO, MasterDataDTO } from '../../../../types/api'
// import { formatGoalAttributesLabel, formatGoalTypeLabel } from '../../utils/goalForm'
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

  const [menuOpen, setMenuOpen] = createSignal(false)

  let menuRef: HTMLDivElement | undefined

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef && !menuRef.contains(e.target as Node)) {
      setMenuOpen(false)
    }
  }

  const openMenu = () => {
    setMenuOpen(true)
    document.addEventListener('click', handleClickOutside)
    onCleanup(() => document.removeEventListener('click', handleClickOutside))
  }

  const closeMenu = () => {
    setMenuOpen(false)
    document.removeEventListener('click', handleClickOutside)
  }

  const handleEdit = () => {
    closeMenu()
    props.onEdit(props.goal)
  }

  const handleDelete = () => {
    closeMenu()
    props.onDelete(props.goal)
  }

  return (
    <article class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{props.goal.title}</h2>
        </div>
        <div ref={menuRef} class="relative">
          <button
            type="button"
            class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="メニューを開く"
            aria-haspopup="true"
            aria-expanded={menuOpen()}
            onClick={(e) => {
              e.stopPropagation()
              menuOpen() ? closeMenu() : openMenu()
            }}
          >
            <MoreVertical size={20} aria-hidden="true" />
          </button>
          {menuOpen() && (
            <div
              role="menu"
              class="absolute right-0 z-10 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={handleEdit}
              >
                <Pencil size={16} aria-hidden="true" />
                編集
              </button>
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 size={16} aria-hidden="true" />
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      <div class="mt-4">
        <div class="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>{props.goal.invert ? '反転表示（未達寄り）' : '進捗'}</span>
          <span>{displayPercent().toFixed(1)}%</span>
        </div>
        <progress
          class="h-2 w-full rounded appearance-none overflow-hidden [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-primary-600 [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-primary-600"
          value={Math.max(0, Math.min(displayPercent(), 100))}
          max={100}
          aria-label={`${props.goal.title} 進捗 ${displayPercent().toFixed(1)}%`}
        />
      </div>

      <div class="mt-3 flex items-center justify-between text-sm">
        <span class="text-gray-700">
          {formatValue(displayCurrent(), props.goal.achievement_type)} /{' '}
          {formatValue(props.progress.target, props.goal.achievement_type)}
        </span>
        {props.progress.achieved && (
          <span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
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
