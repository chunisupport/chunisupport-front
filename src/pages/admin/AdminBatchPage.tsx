import { useNavigate, useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo } from 'solid-js'
import { AppTabContent, UnderlineTabs } from '../../components/common/AppTabs'
import { ADMIN_BATCH_PAGE_TITLE } from '../../constants/pageTitles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import AdminChartStatsBatchPanel from './AdminChartStatsBatchPanel'
import AdminSongBatchPanel from './AdminSongBatchPanel'
import { ADMIN_BATCH_TAB_OPTIONS } from './adminBatch.constants'
import { buildAdminBatchTabPath, resolveAdminBatchTab } from './adminBatchTab'

/**
 * ADMINが各バッチを実行し、実行履歴を確認する画面を表示する。
 * 表示中のタブはURLに持たせ、再読み込みやリンクで同じタブを開けるようにする。
 * 非表示のタブは描画しないため、実行履歴の取得と実行中の再取得は表示中のタブだけで行う。
 *
 * @returns バッチの種類ごとのタブ。
 */
const AdminBatchPage = (): JSX.Element => {
  useDocumentTitle(ADMIN_BATCH_PAGE_TITLE)

  const params = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const resolvedTab = createMemo(() => resolveAdminBatchTab(params.tab))
  const activeTab = createMemo(() => resolvedTab() ?? 'song')

  // 未対応のタブを指すURLは既定タブへ置き換える
  createEffect(() => {
    if (resolvedTab() === null) {
      navigate(buildAdminBatchTabPath('song'), { replace: true })
    }
  })

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <h1 class="text-2xl font-semibold text-text">{ADMIN_BATCH_PAGE_TITLE}</h1>
      <UnderlineTabs
        options={ADMIN_BATCH_TAB_OPTIONS}
        value={activeTab()}
        onChange={(tab) => navigate(buildAdminBatchTabPath(tab))}
        class="space-y-4"
      >
        <AppTabContent value="song">
          <AdminSongBatchPanel />
        </AppTabContent>
        <AppTabContent value="chartStats">
          <AdminChartStatsBatchPanel />
        </AppTabContent>
      </UnderlineTabs>
    </div>
  )
}

export default AdminBatchPage
