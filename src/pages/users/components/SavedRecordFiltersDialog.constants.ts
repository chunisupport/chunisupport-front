/**
 * 保存済みレコードフィルターダイアログで表示する文言。
 */
export const SAVED_RECORD_FILTER_DIALOG_TEXT = {
  trigger: '保存',
  title: 'フィルター条件の保存・呼出',
  savedListLabel: '保存した条件',
  empty: '保存された条件はありません',
  saveCurrentLabel: '現在の条件を保存',
  filterNameLabel: 'フィルター名',
  namePlaceholder: 'フィルターの名前を入力...',
  detailLabel: 'フィルターの詳細',
  noCondition: '（条件なし）',
  invalidBadge: '無効',
  invalidFallback: '古い形式のため無効です。',
  apply: '呼出',
  save: '保存',
  rename: '名前変更',
  overwrite: '現在の条件で上書き',
  delete: 'フィルターを削除',
  close: '戻る',
  login: 'ログイン',
  actionsLabel: 'フィルター操作',
  loadingLabel: '保存済みフィルターを取得中',
  loadError: '保存済みフィルターの取得に失敗しました。',
  saveError: 'フィルターの保存に失敗しました。',
  updateError: 'フィルターの更新に失敗しました。',
  deleteError: 'フィルターの削除に失敗しました。',
} as const

/**
 * 保存済みレコードフィルターダイアログで再利用する Tailwind クラス。
 */
export const SAVED_RECORD_FILTER_DIALOG_CLASS = {
  nameInput:
    'w-full rounded border border-border-strong bg-surface px-2 py-1 text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring',
  secondaryButton:
    'rounded bg-action-secondary px-4 py-2 text-text-muted hover:bg-action-secondary-hover disabled:cursor-not-allowed disabled:opacity-50',
  primarySmallButton:
    'rounded bg-action-primary px-2 py-1 text-text-inverse hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-50',
  dangerButton:
    'px-2 py-1 text-danger underline hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50',
} as const
