import { EllipsisVertical, Pencil, Trash2 } from 'lucide-solid'
import { type Component, createSignal, onCleanup } from 'solid-js'
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
    props.goal.invert
      ? Math.max(props.progress.target - props.progress.current, 0)
      : props.progress.current
  const displayPercent = () => {
    const safeTarget = props.progress.target <= 0 ? 1 : props.progress.target
    const rawPercent = (props.progress.current / safeTarget) * 100
    const normalizedPercent = Number.isFinite(rawPercent) ? Math.max(0, rawPercent) : 0

    return props.goal.invert
      ? Math.max(0, 100 - Math.min(normalizedPercent, 100))
      : normalizedPercent
  }

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
    <article
      class={`rounded-lg border p-4 shadow-sm ${
        props.progress.achieved ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-gray-900">{props.goal.title}</h2>
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
            <EllipsisVertical size={20} aria-hidden="true" />
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
        <div class="mb-2 flex items-end justify-between gap-3">
          <div class="flex min-w-0 items-end gap-2 text-gray-700">
            <span class="font-oswald text-3xl font-bold leading-none text-black">
              {formatValue(displayCurrent(), props.goal.achievement_type)}
            </span>
            <span class="pb-0.5 font-oswald text-xl font-bold leading-none text-gray-400">/</span>
            <span class="pb-0.5 font-oswald text-2xl font-bold leading-none text-gray-500">
              {formatValue(props.progress.target, props.goal.achievement_type)}
            </span>
            <span class="pb-0.5 font-oswald text-lg font-semibold leading-none text-gray-400">
              {displayPercent().toFixed(2)}%
            </span>
          </div>
        </div>
        <progress
          class="h-2 w-full rounded appearance-none overflow-hidden [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-primary-600 [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-primary-600"
          value={Math.max(0, Math.min(displayPercent(), 100))}
          max={100}
          aria-label={`${props.goal.title} 進捗 ${displayPercent().toFixed(1)}%`}
        />
      </div>
    </article>
  )
}

export default GoalCard
