import { EllipsisVertical, Pencil, Trash2 } from 'lucide-solid'
import { type Component, createSignal, onCleanup } from 'solid-js'
import type { GoalDTO } from '../../../../types/api'
// import { formatGoalAttributesLabel, formatGoalTypeLabel } from '../../utils/goalForm'
import type { GoalProgressResult } from '../../utils/goalProgress'

interface GoalCardProps {
  goal: GoalDTO
  progress: GoalProgressResult
  onEdit: (goal: GoalDTO) => void
  onDelete: (goal: GoalDTO) => void
}

/**
 * 目標進捗の数値を目標種別に合わせて表示用に整形する。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @returns 画面表示用の数値文字列。
 */
const formatValue = (value: number, type: GoalDTO['achievement_type']) => {
  if (type === 'overpower_value' || type === 'overpower_percent') {
    return value.toLocaleString('ja-JP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })
  }

  return Math.floor(value).toLocaleString('ja-JP')
}

/**
 * 反転目標の達成値として表示する符号付き文字列を作成する。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @param invert - 目標の反転表示が有効か。
 * @returns 反転時はマイナスを付与した画面表示用の数値文字列。
 */
const formatDisplayValue = (value: number, type: GoalDTO['achievement_type'], invert: boolean) => {
  const formatted = formatValue(value, type)
  return invert ? `-${formatted}` : formatted
}

/**
 * 反転目標の達成率として表示する符号付き文字列を作成する。
 *
 * @param percent - 整形対象の達成率。
 * @param invert - 目標の反転表示が有効か。
 * @returns 反転時はマイナスを付与した画面表示用の達成率文字列。
 */
const formatDisplayPercent = (percent: number, invert: boolean) => {
  const formatted = `${percent.toFixed(2)}%`
  return invert ? `-${formatted}` : formatted
}

/**
 * 目標の現在値、目標値、達成率をカード形式で表示する。
 *
 * @param props - 目標カードの表示内容と操作ハンドラ。
 * @returns 目標カードの JSX 要素。
 */
const GoalCard: Component<GoalCardProps> = (props) => {
  const displayCurrent = () =>
    props.goal.invert
      ? Math.max(props.progress.target - props.progress.current, 0)
      : props.progress.current
  const normalizedPercent = () => {
    const safeTarget = props.progress.target <= 0 ? 1 : props.progress.target
    const raw = (props.progress.current / safeTarget) * 100
    return Number.isFinite(raw) ? Math.max(0, raw) : 0
  }

  const displayPercent = () => {
    return props.goal.invert
      ? Math.max(0, 100 - Math.min(normalizedPercent(), 100))
      : normalizedPercent()
  }
  const displayCurrentText = () =>
    formatDisplayValue(displayCurrent(), props.goal.achievement_type, props.goal.invert)
  const displayPercentText = () => formatDisplayPercent(displayPercent(), props.goal.invert)

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
        props.progress.achieved
          ? 'border-action-primary-border bg-action-primary-muted'
          : 'border-border bg-surface'
      }`}
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="font-sans text-lg font-bold text-text">{props.goal.title}</h2>
        </div>
        <div ref={menuRef} class="relative">
          <button
            type="button"
            class="rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-text-muted"
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
              class="absolute right-0 z-10 mt-1 w-28 rounded-md border border-border bg-surface py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-muted hover:bg-surface-muted"
                onClick={handleEdit}
              >
                <Pencil size={16} aria-hidden="true" />
                編集
              </button>
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-danger-bg"
                onClick={handleDelete}
              >
                <Trash2 size={16} aria-hidden="true" />
                削除
              </button>
            </div>
          )}
        </div>
      </div>

      <div class="mt-2">
        <div class="font-oswald text-3xl font-bold leading-none text-text">
          {displayCurrentText()}
        </div>
        <div class="mb-2 flex items-end justify-between gap-3 mt-1">
          <div class="flex min-w-0 w-full items-end gap-3 text-text-subtle">
            <div class="pb-0.5 font-oswald text-lg font-bold leading-none">/</div>
            <div class="goal-card-progress-secondary pb-0.5 font-oswald text-xl font-bold leading-none">
              {formatValue(props.progress.target, props.goal.achievement_type)}
            </div>
            <div class="goal-card-progress-secondary ml-auto pb-0.5 text-right font-oswald text-lg font-semibold leading-none">
              {displayPercentText()}
            </div>
          </div>
        </div>
        <progress
          class="h-2 w-full rounded appearance-none overflow-hidden [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-action-secondary [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-action-primary [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-action-primary"
          value={Math.max(0, Math.min(normalizedPercent(), 100))}
          max={100}
          aria-label={`${props.goal.title} 進捗 ${displayPercentText()}`}
        />
      </div>
    </article>
  )
}

export default GoalCard
