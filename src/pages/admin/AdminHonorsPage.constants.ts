import { formatMessage, localizedCopy } from '../../i18n'

/** 称号管理画面の表示文言 */
const ADMIN_HONORS_TEXT = localizedCopy('admin.honors')
/** 称号管理画面で使用する表示文言 */
export const ADMIN_HONORS_COPY = {
  pageTitle: ADMIN_HONORS_TEXT.pageTitle,
  pageDescription: ADMIN_HONORS_TEXT.pageDescription,
  createButton: ADMIN_HONORS_TEXT.createButton,
  createDialogTitle: ADMIN_HONORS_TEXT.createDialogTitle,
  editDialogTitle: ADMIN_HONORS_TEXT.editDialogTitle,
  formDescription: ADMIN_HONORS_TEXT.formDescription,
  honorLabel: ADMIN_HONORS_TEXT.honorLabel,
  typeLabel: ADMIN_HONORS_TEXT.typeLabel,
  imageUrlLabel: 'image_url',
  imageLinkAriaLabel: (imageName: string) =>
    formatMessage(ADMIN_HONORS_TEXT.imageLinkAriaLabel, { name: imageName }),
  selectPlaceholder: ADMIN_HONORS_TEXT.selectPlaceholder,
  cancelButton: ADMIN_HONORS_TEXT.cancelButton,
  createButtonLabel: ADMIN_HONORS_TEXT.createButtonLabel,
  saveButton: ADMIN_HONORS_TEXT.saveButton,
  savingButton: ADMIN_HONORS_TEXT.savingButton,
  createSuccess: ADMIN_HONORS_TEXT.createSuccess,
  createError: ADMIN_HONORS_TEXT.createError,
  editSuccess: ADMIN_HONORS_TEXT.editSuccess,
  editError: ADMIN_HONORS_TEXT.editError,
  editAction: ADMIN_HONORS_TEXT.editAction,
  emptyState: ADMIN_HONORS_TEXT.emptyState,
  noResults: ADMIN_HONORS_TEXT.noResults,
  searchLabel: ADMIN_HONORS_TEXT.searchLabel,
  searchPlaceholder: ADMIN_HONORS_TEXT.searchPlaceholder,
  allTypes: ADMIN_HONORS_TEXT.allTypes,
  idColumn: 'ID',
  createdAtColumn: ADMIN_HONORS_TEXT.createdAtColumn,
  actionColumn: ADMIN_HONORS_TEXT.actionColumn,
  resultCount: (filtered: number, total: number) =>
    filtered === total
      ? formatMessage(ADMIN_HONORS_TEXT.resultCountAll, { total: total.toLocaleString() })
      : formatMessage(ADMIN_HONORS_TEXT.resultCountFiltered, {
          filtered: filtered.toLocaleString(),
          total: total.toLocaleString(),
        }),
} as const

/** クラス絞り込みの「すべて」に対応する選択値 */
export const ADMIN_HONORS_ALL_TYPE_VALUE = '__all__'

/** 称号フォームの入力上限 */
export const HONOR_INPUT_LIMITS = {
  name: 500,
  imageUrl: 255,
} as const
