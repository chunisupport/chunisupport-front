/** 難易度など短いドメイン値をレコード表で表示する共通バッジ寸法。 */
export const RECORD_COMPACT_BADGE_CLASS =
  'inline-flex h-6 w-7 items-center justify-center rounded-lg px-1 text-sm font-bold leading-none'

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
