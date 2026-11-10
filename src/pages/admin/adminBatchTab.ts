import { ADMIN_BATCH_PATH } from '../../constants/routes'
import { buildUrlTabPath, resolveUrlTab } from '../../utils/urlTab'

/** バッチ管理画面のタブ */
export type AdminBatchTabValue = 'song' | 'chartStats'

/** バッチ管理画面のタブに対応するURLパスセグメント。既定タブはセグメントなし */
const ADMIN_BATCH_TAB_PATH_SEGMENTS: Record<AdminBatchTabValue, string> = {
  song: '',
  chartStats: 'chart-stats',
}

/**
 * バッチ管理画面タブのURLパスを生成する。
 *
 * @param tab - 表示するタブ。
 * @returns タブに対応するURLパス。
 */
export const buildAdminBatchTabPath = (tab: AdminBatchTabValue): string =>
  buildUrlTabPath(ADMIN_BATCH_PATH, ADMIN_BATCH_TAB_PATH_SEGMENTS, tab)

/**
 * URLパスセグメントからバッチ管理画面のタブを復元する。
 *
 * @param segment - URLパスのタブ部分。
 * @returns 対応するタブ。未対応の場合は null。
 */
export const resolveAdminBatchTab = (segment: string | undefined): AdminBatchTabValue | null =>
  resolveUrlTab(ADMIN_BATCH_TAB_PATH_SEGMENTS, segment, 'song')
