import { getAppButtonClass } from '../../../components/common/AppButton'
import { localizedCopy } from '../../../i18n'

/**
 * 保存済みレコードフィルターダイアログで表示する文言。
 */
export const SAVED_RECORD_FILTER_DIALOG_TEXT = localizedCopy('users.savedFilters')

/**
 * 保存済みレコードフィルターダイアログで再利用する Tailwind クラス。
 */
export const SAVED_RECORD_FILTER_DIALOG_CLASS = {
  nameInput:
    'w-full rounded border border-border-strong bg-surface px-2 py-2 font-sans text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring',
  secondaryButton: getAppButtonClass({ variant: 'secondary' }),
} as const
