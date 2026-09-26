import { localizedCopy, t } from '../../i18n'
/** バージョン管理画面で使用する表示文言 */
export const ADMIN_VERSIONS_COPY = localizedCopy('admin.versions.adminVersionsCopy')

/** バージョン入力のAPI制約 */
export const VERSION_INPUT_CONSTRAINTS = {
  nameMaxLength: 50,
  namePattern: 'CHUNITHM .+',
} as const

/**
 * バージョン編集ボタンのアクセシブルなラベルを生成する。
 *
 * @param versionName - 対象バージョン名。
 * @returns スクリーンリーダー向けの編集ラベル。
 */
export const formatVersionEditLabel = (versionName: string): string =>
  t('admin.versions.editLabel', { name: versionName })

/**
 * バージョン削除ボタンのアクセシブルなラベルを生成する。
 *
 * @param versionName - 対象バージョン名。
 * @param canDelete - 最新版として削除できる場合は true。
 * @returns スクリーンリーダー向けの削除ラベル。
 */
export const formatVersionDeleteLabel = (versionName: string, canDelete = true): string =>
  canDelete
    ? t('admin.versions.deleteLabel', { name: versionName })
    : t('admin.versions.notDeletable', { name: versionName })

/**
 * 削除確認ダイアログで対象バージョン名を示す文面を生成する。
 *
 * @param versionName - 削除対象のバージョン名。
 * @returns 対象名を含む削除確認の前文。
 */
export const formatVersionDeleteTargetMessage = (versionName: string): string =>
  t('admin.versions.deleteTarget', { name: versionName })
