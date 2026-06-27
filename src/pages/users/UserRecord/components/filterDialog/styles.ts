/**
 * 入力系コントロールのフォーカス表示を要素内側に収める共通スタイル。
 */
export const FILTER_DIALOG_FIELD_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * レコードフィルターダイアログ内の数値入力欄に適用する共通スタイル。
 */
export const FILTER_DIALOG_FIELD_INPUT_CLASS = `inline-flex w-full items-center justify-between rounded border border-border-strong bg-surface px-3 py-2 text-sm hover:border-input-border-hover ${FILTER_DIALOG_FIELD_FOCUS_CLASS}`

/**
 * レコードフィルターダイアログ内の単一選択トリガーに適用する共通スタイル。
 */
export const FILTER_DIALOG_SELECT_TRIGGER_CLASS = `inline-flex w-full items-center justify-between rounded border border-border-strong bg-surface px-3 py-2 text-sm hover:border-input-border-hover ${FILTER_DIALOG_FIELD_FOCUS_CLASS}`

/**
 * レコードフィルターダイアログ内の単一選択項目に適用する共通スタイル。
 */
export const FILTER_DIALOG_SELECT_ITEM_CLASS =
  'text-sm rounded flex h-8 cursor-pointer items-center justify-between px-2 outline-none hover:bg-success-bg data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-success-bg data-selected:bg-success-bg'

/**
 * レコードフィルターダイアログ内の単一選択ポータルに適用する共通スタイル。
 */
export const FILTER_DIALOG_SELECT_CONTENT_CLASS =
  'z-60 max-h-90 overflow-y-auto rounded-md border border-border-strong bg-surface shadow-lg'
