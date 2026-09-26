import { localizedCopy, t } from '../../i18n'
/** ユーザー管理画面の集計表示に使用する文言 */
export const ADMIN_USER_STATISTICS_COPY = localizedCopy('admin.users.adminUserStatisticsCopy')

/** ユーザー管理画面の一覧・検索に使用する文言 */
export const ADMIN_USER_LIST_COPY = localizedCopy('admin.users.adminUserListCopy')

/**
 * ユーザー物理削除の確認文言を作成する。
 *
 * @param username - 削除対象のユーザー名。
 * @returns 確認ダイアログに表示する文言。
 */
export const formatAdminUserDeleteConfirmation = (username: string): string =>
  t('admin.users.deleteConfirmation', { username })

/**
 * ユーザーごとのフラグ切り替えに使うアクセシブルなラベルを作成する。
 *
 * @param username - 対象ユーザー名。
 * @param flagLabel - 対象フラグの表示名。
 * @returns ユーザー名とフラグ名を組み合わせたラベル。
 */
export const formatAdminUserFlagLabel = (username: string, flagLabel: string): string =>
  t('admin.users.flagLabel', { username, flag: flagLabel })
