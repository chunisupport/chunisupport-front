import type { AppTabOption } from '../../components/common/AppTabs'
import type { AdminPreviewsTabValue } from './adminPreviewsTab'

/** テスト用ページ集のタブ選択肢 */
export const ADMIN_PREVIEWS_TAB_OPTIONS: readonly AppTabOption<AdminPreviewsTabValue>[] = [
  { value: 'nameplate', label: 'プロフィールカード' },
  { value: 'ratingImage', label: 'レーティング画像DOM' },
]
