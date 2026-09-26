import { localizedCopy, withLocalizedLabels } from '../../i18n'
import type { ApiTokenPermission } from '../../types/api'

/** APIトークン設定欄で使用する表示文言 */
export const API_TOKEN_SETTINGS_COPY = localizedCopy('settings.apiToken')

/** APIが許可するAPIトークン名の最大文字数 */
export const API_TOKEN_NAME_MAX_LENGTH = 50

/** 1ユーザーが所有できるAPIトークンの最大件数 */
export const API_TOKEN_MAX_COUNT = 10

/** APIトークン発行時に選択できる権限 */
export const API_TOKEN_PERMISSION_OPTIONS: readonly {
  value: ApiTokenPermission
  label: string
  description: string
}[] = withLocalizedLabels(
  withLocalizedLabels(
  [
  {
    value: 'read' },
  {
    value: 'read_write' },
],
  API_TOKEN_SETTINGS_COPY.permissions
),
  API_TOKEN_SETTINGS_COPY.permissionDescriptions, 'description'
)

/**
 * APIトークン権限の表示名を返す。
 *
 * @param permission - APIが返したAPIトークン権限。
 * @returns 設定画面で表示する権限名。
 */
export const formatApiTokenPermission = (permission: ApiTokenPermission): string =>
  API_TOKEN_PERMISSION_OPTIONS.find((option) => option.value === permission)?.label ?? permission

