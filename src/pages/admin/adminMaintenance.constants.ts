import { localizedCopy } from '../../i18n'
import type { MaintenanceAction } from './maintenanceAction'

/** メンテナンス管理画面に表示する文言 */
export const ADMIN_MAINTENANCE_COPY = localizedCopy('admin.maintenance.adminMaintenanceCopy')

/** メンテナンス変更操作ごとの確認・完了文言 */
export const ADMIN_MAINTENANCE_ACTION_COPY: Record<
  MaintenanceAction,
  {
    /** 確認ダイアログの見出し */
    title: string
    /** 確認ダイアログで操作の影響を示す文言 */
    description: string
    /** 確定ボタンの文言 */
    confirmButton: string
    /** 成功時に操作位置の近くへ表示する文言 */
    success: string
    /** 失敗理由を特定できない場合の文言 */
    failure: string
  }
> = localizedCopy('admin.maintenance.adminMaintenanceActionCopy')

/** メンテナンスコメント入力欄の表示行数 */
export const ADMIN_MAINTENANCE_COMMENT_ROWS = 8
