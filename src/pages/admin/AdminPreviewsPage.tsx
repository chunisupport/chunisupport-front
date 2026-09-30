import { useNavigate, useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo } from 'solid-js'
import { AppTabContent, UnderlineTabs } from '../../components/common/AppTabs'
import { ADMIN_PREVIEWS_PAGE_TITLE } from '../../constants/pageTitles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import AdminNameplatePreviewPanel from './AdminNameplatePreviewPanel'
import { ADMIN_PREVIEWS_TAB_OPTIONS } from './AdminPreviewsPage.constants'
import AdminRatingImageDomPreviewPanel from './AdminRatingImageDomPreviewPanel'
import { buildAdminPreviewsTabPath, resolveAdminPreviewsTab } from './adminPreviewsTab'

/**
 * 表示確認用のテストページをタブでまとめて表示する。
 * 表示中のタブはURLに持たせ、非表示のタブは描画しない。
 *
 * @returns プロフィールカードとレーティング画像DOMの確認タブ。
 */
const AdminPreviewsPage = (): JSX.Element => {
  useDocumentTitle(ADMIN_PREVIEWS_PAGE_TITLE)

  const params = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const resolvedTab = createMemo(() => resolveAdminPreviewsTab(params.tab))
  const activeTab = createMemo(() => resolvedTab() ?? 'nameplate')

  // 未対応のタブを指すURLは既定タブへ置き換える
  createEffect(() => {
    if (resolvedTab() === null) {
      navigate(buildAdminPreviewsTabPath('nameplate'), { replace: true })
    }
  })

  return (
    <div class="flex w-full flex-col gap-4 p-4 sm:p-6">
      <h1 class="text-2xl font-semibold text-text">{ADMIN_PREVIEWS_PAGE_TITLE}</h1>
      <UnderlineTabs
        options={ADMIN_PREVIEWS_TAB_OPTIONS}
        value={activeTab()}
        onChange={(tab) => navigate(buildAdminPreviewsTabPath(tab))}
        class="space-y-4"
      >
        <AppTabContent value="nameplate">
          <AdminNameplatePreviewPanel />
        </AppTabContent>
        <AppTabContent value="ratingImage">
          <AdminRatingImageDomPreviewPanel />
        </AppTabContent>
      </UnderlineTabs>
    </div>
  )
}

export default AdminPreviewsPage
