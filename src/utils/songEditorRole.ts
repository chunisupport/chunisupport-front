import type { AccountType } from '../types/api'

/**
 * アカウント種別が楽曲マスタを編集できるか判定する。
 *
 * この判定はフロントエンドの表示制御専用であり、APIの認可を代替しない。
 *
 * @param accountType - APIから取得したアカウント種別。未認証時はundefined。
 * @returns ADMINまたはEDITORの場合はtrue。
 */
export const canEditSongMaster = (accountType: AccountType | undefined): boolean =>
  accountType === 'ADMIN' || accountType === 'EDITOR'
