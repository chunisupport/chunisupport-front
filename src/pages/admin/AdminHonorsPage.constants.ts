/** 称号管理画面で使用する表示文言。 */
export const ADMIN_HONORS_COPY = {
  pageTitle: '称号管理',
  pageDescription: '称号、クラス、image_url を一覧で確認します。',
  createButton: '称号を追加',
  createDialogTitle: '称号を追加',
  editDialogTitle: '称号を編集',
  formDescription: '称号名、クラス、画像URLを入力します。',
  honorLabel: '称号',
  typeLabel: 'クラス',
  imageUrlLabel: 'image_url',
  selectPlaceholder: '選択してください',
  cancelButton: 'キャンセル',
  createButtonLabel: '追加',
  saveButton: '保存',
  savingButton: '保存中...',
  createSuccess: '称号を追加しました。',
  createError: '称号の追加に失敗しました。',
  editSuccess: '称号を更新しました。',
  editError: '称号の更新に失敗しました。',
  editAction: '編集',
  emptyState: '登録されている称号がありません。',
} as const

/** 称号フォームの入力上限。 */
export const HONOR_INPUT_LIMITS = {
  name: 500,
  imageUrl: 255,
} as const
