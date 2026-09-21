/** 称号管理画面で使用する表示文言 */
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
  noResults: '条件に一致する称号がありません。',
  searchLabel: '称号名を検索',
  searchPlaceholder: '称号名を検索',
  allTypes: 'すべて',
  sortLabel: '並べ替え',
  pageSizeLabel: (pageSize: number) => `${pageSize}件/ページ`,
  idColumn: 'ID',
  createdAtColumn: '登録日時',
  resultCount: (filtered: number, total: number) =>
    filtered === total
      ? `${total.toLocaleString()}件`
      : `${filtered.toLocaleString()}件 / 全${total.toLocaleString()}件`,
} as const

/** 1ページに表示する称号の件数 */
export const ADMIN_HONORS_PAGE_SIZE = 50

/** クラス絞り込みの「すべて」に対応する選択値 */
export const ADMIN_HONORS_ALL_TYPE_VALUE = '__all__'

/** 称号一覧の並べ替え候補 */
export const ADMIN_HONORS_SORT_OPTIONS = [
  { value: 'id-desc', label: 'IDの新しい順' },
  { value: 'id-asc', label: 'IDの古い順' },
  { value: 'name-asc', label: '称号名の昇順' },
  { value: 'name-desc', label: '称号名の降順' },
  { value: 'created-at-desc', label: '登録日時の新しい順' },
  { value: 'created-at-asc', label: '登録日時の古い順' },
] as const

/** 称号フォームの入力上限 */
export const HONOR_INPUT_LIMITS = {
  name: 500,
  imageUrl: 255,
} as const
