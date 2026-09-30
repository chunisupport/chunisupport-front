import { ADMIN_PREVIEWS_PATH } from '../../constants/routes'
import { buildUrlTabPath, resolveUrlTab } from '../../utils/urlTab'

/** テスト用ページ集のタブ */
export type AdminPreviewsTabValue = 'nameplate' | 'ratingImage'

/** テスト用ページ集のタブに対応するURLパスセグメント。既定タブはセグメントなし */
const ADMIN_PREVIEWS_TAB_PATH_SEGMENTS: Record<AdminPreviewsTabValue, string> = {
  nameplate: '',
  ratingImage: 'rating-image',
}

/**
 * テスト用ページ集タブのURLパスを生成する。
 *
 * @param tab - 表示するタブ。
 * @returns タブに対応するURLパス。
 */
export const buildAdminPreviewsTabPath = (tab: AdminPreviewsTabValue): string =>
  buildUrlTabPath(ADMIN_PREVIEWS_PATH, ADMIN_PREVIEWS_TAB_PATH_SEGMENTS, tab)

/**
 * URLパスセグメントからテスト用ページ集のタブを復元する。
 *
 * @param segment - URLパスのタブ部分。
 * @returns 対応するタブ。未対応の場合は null。
 */
export const resolveAdminPreviewsTab = (
  segment: string | undefined
): AdminPreviewsTabValue | null =>
  resolveUrlTab(ADMIN_PREVIEWS_TAB_PATH_SEGMENTS, segment, 'nameplate')
