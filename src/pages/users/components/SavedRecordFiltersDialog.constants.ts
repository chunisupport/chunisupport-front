/**
 * 保存済みレコードフィルターダイアログで表示する文言。
 */
export const SAVED_RECORD_FILTER_DIALOG_TEXT = {
  openList: '呼出',
  saveNameTitle: 'フィルター名',
  listTitle: '保存済みフィルター',
  empty: '保存された条件はありません',
  apply: '呼出',
  edit: '編集',
  save: '保存',
  delete: 'フィルターを削除',
  deleteTitle: 'フィルターを削除しますか？',
  deleteDescription: '削除した保存済みフィルターは元に戻せません。',
  cancel: 'キャンセル',
  close: '戻る',
  login: 'ログイン',
  loadingLabel: '保存済みフィルターを取得中',
  loadError: '保存済みフィルターの取得に失敗しました。',
  saveError: 'フィルターの保存に失敗しました。',
  updateError: 'フィルターの更新に失敗しました。',
  deleteError: 'フィルターの削除に失敗しました。',
  payloadTooLarge: 'フィルター条件が大きすぎるため保存できません。',
} as const

/**
 * 保存済みレコードフィルターダイアログで再利用する Tailwind クラス。
 */
export const SAVED_RECORD_FILTER_DIALOG_CLASS = {
  nameInput:
    'w-full rounded border border-border-strong bg-surface px-2 py-2 text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring',
  secondaryButton:
    'rounded bg-action-secondary px-4 py-2 text-text-muted hover:bg-action-secondary-hover disabled:cursor-not-allowed disabled:opacity-50',
  primaryButton:
    'rounded bg-action-primary px-4 py-2 text-text-inverse hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-50',
  iconButton:
    'inline-flex h-9 w-9 items-center justify-center rounded border border-border-strong bg-surface text-text-muted hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50',
  dangerIconButton:
    'inline-flex h-9 w-9 items-center justify-center rounded border border-danger text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50',
  dangerButton:
    'rounded border border-danger px-4 py-2 text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50',
} as const
