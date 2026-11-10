import type { AccountType, ApiTokenPermission } from '../types/api'

/**
 * アカウント種別が書き込み権限付きAPIトークンを発行できるか判定する。
 *
 * @param accountType - 発行者のアカウント種別。
 * @returns EDITORまたはADMINの場合はtrue。
 */
export const canIssueReadWriteApiToken = (accountType: AccountType | undefined): boolean =>
  accountType === 'EDITOR' || accountType === 'ADMIN'

/**
 * 発行者の権限に応じてAPIトークンの発行権限を確定する。
 *
 * @param accountType - 発行者のアカウント種別。
 * @param requestedPermission - 画面上で選択された権限。
 * @returns 発行可能な権限。EDITOR/ADMIN以外は常にread。
 */
export const resolveApiTokenIssuePermission = (
  accountType: AccountType | undefined,
  requestedPermission: ApiTokenPermission
): ApiTokenPermission => (canIssueReadWriteApiToken(accountType) ? requestedPermission : 'read')
