import { createResource, Show } from 'solid-js'
import { fetchApiVersion } from '../../api/root'
import { StaffMenuPage } from '../../components/common/StaffMenuPage'
import {
  FRONTEND_APP_NAME,
  FRONTEND_BUILD_DATE,
  FRONTEND_COMMIT_HASH,
} from '../../constants/appBuild'
import { formatBuildRevisionLabel } from '../../utils/appVersionLabel'
import { ADMIN_PAGE_COPY, ADMIN_PAGE_LINKS } from './adminPage.constants'

/**
 * 管理者向けの API とフロントエンドのビルド情報を描画する。
 *
 * @returns 管理メニューに表示するビルド情報。
 */
const AdminBuildInfo = () => {
  const [apiVersion] = createResource(fetchApiVersion)
  const frontendBuildLabel = formatBuildRevisionLabel({
    appName: FRONTEND_APP_NAME,
    buildDate: FRONTEND_BUILD_DATE,
    commitHash: FRONTEND_COMMIT_HASH,
  })

  return (
    <div class="mt-4 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <Show when={apiVersion()} keyed>
          {(version) => (
            <span>
              {formatBuildRevisionLabel({
                appName: version.app_name,
                buildDate: version.build_date,
                commitHash: version.commit_hash,
              })}
            </span>
          )}
        </Show>
        <span>{frontendBuildLabel}</span>
      </div>
    </div>
  )
}

/**
 * 管理者向けメニュー画面を描画する。
 *
 * @returns 管理メニューUI。
 */
const AdminPage = () => {
  return (
    <StaffMenuPage
      pageTitle={ADMIN_PAGE_COPY.pageTitle}
      heading={ADMIN_PAGE_COPY.heading}
      description={ADMIN_PAGE_COPY.description}
      links={ADMIN_PAGE_LINKS}
      supplementaryContent={<AdminBuildInfo />}
    />
  )
}

export default AdminPage
