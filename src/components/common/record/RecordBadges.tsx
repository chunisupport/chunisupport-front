import type { PlayerDataDifficulty } from '../../../types/api'
import { difficultyBadgeClass, difficultyShort } from '../../../utils/difficultyUtils'

/** 難易度など短いドメイン値をレコード表で固定幅表示する共通バッジ寸法 */
export const RECORD_COMPACT_BADGE_CLASS =
  'inline-flex h-6 w-7 shrink-0 items-center justify-center rounded-lg px-1 font-oswald text-sm font-bold leading-none'

/**
 * レコード表と同じ1文字表記の難易度バッジを表示する。
 *
 * @param props.difficulty - 表示する難易度。
 * @returns 難易度色と固定寸法を適用し、支援技術にはフル表記を伝える1文字バッジ。
 */
export const RecordDifficultyBadge = (props: { difficulty: PlayerDataDifficulty }) => (
  <span class={`${RECORD_COMPACT_BADGE_CLASS} ${difficultyBadgeClass(props.difficulty)}`}>
    <span aria-hidden="true">{difficultyShort(props.difficulty)}</span>
    <span class="sr-only">{props.difficulty}</span>
  </span>
)

/**
 * 未プレイ状態を示す小さなバッジを表示する。
 *
 * @returns NoPlayバッジ。
 */
export const NoPlayBadge = () => (
  <span class="rounded-lg bg-surface-hover px-2 py-1 text-xs text-text-subtle">NoPlay</span>
)

/**
 * ランプ未設定時のプレースホルダーバッジを表示する。
 *
 * @param props - 追加クラス。
 * @returns 空白表示のプレースホルダーバッジ。
 */
export const LampPlaceholderBadge = (props: { class?: string }) => (
  <span
    class={`inline-flex min-h-7.5 min-w-7.5 items-center justify-center rounded-lg bg-surface-hover px-2 py-1 text-sm font-extrabold text-disabled-text ${props.class ?? ''}`}
    aria-hidden="true"
  >
    {'\u00a0'}
  </span>
)
