/**
 * 検索欄の状態に応じた外枠クラスを返す。
 *
 * @param active - 検索文字列が入力されているか。
 * @returns 検索欄の外枠へ適用するクラス。
 */
export const getSearchTextFieldFrameStateClass = (active: boolean): string =>
  active
    ? 'border-action-primary bg-action-primary-muted focus-within:border-action-primary'
    : 'border-border-strong bg-surface focus-within:border-focus-ring'

/**
 * 検索欄の状態に応じたアイコンクラスを返す。
 *
 * @param active - 検索文字列が入力されているか。
 * @returns 検索アイコンへ適用するクラス。
 */
export const getSearchTextFieldIconClass = (active: boolean): string =>
  active ? 'text-action-primary' : 'text-text-subtle'
