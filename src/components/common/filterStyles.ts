/**
 * 入力系コントロールのフォーカス表示を要素内側に収める共通スタイル。
 */
export const FILTER_DIALOG_FIELD_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * レコードフィルターダイアログ内の数値入力欄に適用する共通スタイル。
 */
export const FILTER_DIALOG_FIELD_INPUT_CLASS = `inline-flex w-full items-center justify-between rounded border border-border-strong bg-surface px-3 py-2 text-sm placeholder:text-text-placeholder hover:border-input-border-hover ${FILTER_DIALOG_FIELD_FOCUS_CLASS}`

/** 楽曲フィルタの範囲入力欄に適用する共通スタイル。 */
export const SONG_FILTER_INPUT_CLASS =
  'w-full min-w-0 rounded border border-border-strong bg-surface px-3 py-2 text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
