import { Button } from '@kobalte/core/button'
import { EllipsisVertical, ExternalLink, Pencil, Trash2 } from 'lucide-solid'
import { type Component, createSignal, onCleanup } from 'solid-js'
import type { GoalDTO } from '../../../../types/api'
// import { formatGoalAttributesLabel, formatGoalTypeLabel } from '../../utils/goalForm'
import type { GoalProgressResult } from '../../utils/goalProgress'
import { isGoalRecordNavigationEnabled } from '../../utils/goalRecordFilter'

interface GoalCardProps {
  goal: GoalDTO
  progress: GoalProgressResult
  onEdit: (goal: GoalDTO) => void
  onDelete: (goal: GoalDTO) => void
  onOpenRecords?: (goal: GoalDTO) => void
}

interface GoalCardProgressProps {
  title: string
  achievementType: GoalDTO['achievement_type']
  invert: boolean
  progress: GoalProgressResult
}

/**
 * 反転表示時に現在値へ添える未達量ラベル。
 */
const INVERT_PROGRESS_LABEL = '残り'

/**
 * 目標進捗の数値を目標種別に合わせて表示用に整形する。
 *
 * @param value - 整形対象の数値。
 * @param type - 目標種別。
 * @returns 画面表示用の数値文字列。
 */
export const formatValue = (value: number, type: GoalDTO['achievement_type']) => {
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
const formatDisplayValue = (value: number, type: GoalDTO['achievement_type'], _invert: boolean) => {
  return formatValue(value, type)
}

/**
 * 反転目標の達成率として表示する符号付き文字列を作成する。
 *
 * @param percent - 整形対象の達成率。
 * @param invert - 目標の反転表示が有効か。
 * @returns 反転時はマイナスを付与した画面表示用の達成率文字列。
 */
const formatDisplayPercent = (percent: number, _invert: boolean) => {
  return `${percent.toFixed(2)}%`
}

/**
 * 目標カードの進捗値とゲージ値を実表示用に変換する。
 *
 * @param progress - 目標進捗の現在値、目標値、達成率。
 * @param type - 目標種別。
 * @param invert - 反転表示が有効か。
 * @returns カードに表示する現在値、目標値、達成率、ゲージ値。
 */
const resolveGoalCardDisplayProgress = (
  progress: GoalProgressResult,
  type: GoalDTO['achievement_type'],
  invert: boolean
) => {
  const displayCurrent = invert ? Math.max(progress.target - progress.current, 0) : progress.current
  const safeTarget = progress.target <= 0 ? 1 : progress.target
  const raw = (progress.current / safeTarget) * 100
  const normalizedPercent = Number.isFinite(raw) ? Math.max(0, raw) : 0
  const displayPercent = invert
    ? Math.max(0, 100 - Math.min(normalizedPercent, 100))
    : normalizedPercent

  return {
    currentText: formatDisplayValue(displayCurrent, type, invert),
    targetText: formatValue(progress.target, type),
    percentText: formatDisplayPercent(displayPercent, invert),
    progressValue: Math.max(0, Math.min(normalizedPercent, 100)),
  }
}

/**
 * 目標カード共通の進捗数値とゲージを表示する。
 *
 * @param props - タイトル、目標種別、反転表示、進捗情報。
 * @returns 目標カードの進捗表示 JSX 要素。
 */
export const GoalCardProgress: Component<GoalCardProgressProps> = (props) => {
  const displayProgress = () =>
    resolveGoalCardDisplayProgress(props.progress, props.achievementType, props.invert)

  return (
    <div class="mt-2">
      <div class="flex items-baseline gap-1">
        {props.invert && (
          <span class="text-base font-medium leading-none text-text">{INVERT_PROGRESS_LABEL}</span>
        )}
        <span class="font-oswald text-3xl font-bold leading-none text-text">
          {displayProgress().currentText}
        </span>
      </div>
      <div class="mb-2 mt-1 flex items-end justify-between gap-3">
        <div class="flex min-w-0 w-full items-end gap-3 text-text-subtle">
          <div class="pb-0.5 font-oswald text-lg font-bold leading-none">/</div>
          <div class="goal-card-progress-secondary pb-0.5 font-oswald text-xl font-bold leading-none">
            {displayProgress().targetText}
          </div>
          <div class="goal-card-progress-secondary ml-auto pb-0.5 text-right font-oswald text-lg font-semibold leading-none">
            {displayProgress().percentText}
          </div>
        </div>
      </div>
      <progress
        class="h-2 w-full rounded appearance-none overflow-hidden [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-action-secondary [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-action-primary [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-action-primary"
        value={displayProgress().progressValue}
        max={100}
        aria-label={`${props.title} 進捗 ${displayProgress().percentText}`}
      />
    </div>
  )
}

/**
 * 目標の現在値、目標値、達成率をカード形式で表示する。
 *
 * @param props - 目標カードの表示内容と操作ハンドラ。
 * @returns 目標カードの JSX 要素。
 */
const GoalCard: Component<GoalCardProps> = (props) => {
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

  /**
   * 現在の目標で未達成の通常レコード画面を開く。
   *
   * @returns なし。
   */
  const handleOpenRecords = (): void => {
    props.onOpenRecords?.(props.goal)
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
        <h2 class="min-w-0 font-sans text-lg font-bold text-text">
          {isGoalRecordNavigationEnabled(props.goal) && props.onOpenRecords ? (
            <Button
              type="button"
              class="inline-flex items-center gap-1.5 rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={handleOpenRecords}
            >
              <span>{props.goal.title}</span>
              <ExternalLink class="shrink-0" size={18} aria-hidden="true" />
            </Button>
          ) : (
            props.goal.title
          )}
        </h2>
        <div ref={menuRef} class="relative">
          <Button.Root
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
          </Button.Root>
          {menuOpen() && (
            <div
              role="menu"
              class="absolute right-0 z-10 mt-1 w-28 rounded-md border border-border bg-surface py-1 shadow-lg"
            >
              <Button.Root
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-muted hover:bg-surface-muted"
                onClick={handleEdit}
              >
                <Pencil size={16} aria-hidden="true" />
                編集
              </Button.Root>
              <Button.Root
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-danger-bg"
                onClick={handleDelete}
              >
                <Trash2 size={16} aria-hidden="true" />
                削除
              </Button.Root>
            </div>
          )}
        </div>
      </div>

      <GoalCardProgress
        title={props.goal.title}
        achievementType={props.goal.achievement_type}
        invert={props.goal.invert}
        progress={props.progress}
      />
    </article>
  )
}

export default GoalCard
