import type { AccountType } from '../types/api'

/**
 * アカウント種別がメンテナンス中も利用を許可されるスタッフか判定する。
 *
 * この判定はフロントエンドの表示制御専用であり、APIの認可を代替しない。
 *
 * @param accountType - APIから取得したアカウント種別。未認証時はundefined。
 * @returns ADMINまたはEDITORの場合はtrue。
 */
export const isMaintenanceStaff = (accountType: AccountType | undefined): boolean =>
  accountType === 'ADMIN' || accountType === 'EDITOR'
