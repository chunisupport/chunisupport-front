import { createResource, Match, Show, Switch } from 'solid-js'
import { fetchApiFeatureFlagProbe, fetchApiVersion } from '../../api/root'
import { StaffMenuPage } from '../../components/common/StaffMenuPage'
import { Loading } from '../../components/Loading'
import {
  FRONTEND_APP_NAME,
  FRONTEND_BUILD_DATE,
  FRONTEND_COMMIT_HASH,
} from '../../constants/appBuild'
import { APP_ENVIRONMENT, isFeatureEnabled } from '../../lib/featureFlags'
import { formatBuildRevisionLabel } from '../../utils/appVersionLabel'
import {
  ADMIN_FEATURE_FLAG_PROBE_COPY,
  ADMIN_PAGE_COPY,
  ADMIN_PAGE_LINKS,
} from './adminPage.constants'

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
    <div class="rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
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
 * feature-flag の真偽値を ON / OFF の表示文言に変換する。
 *
 * @param enabled - 機能が有効か。
 * @returns 表示文言。
 */
const formatFeatureFlagState = (enabled: boolean) =>
  enabled ? ADMIN_FEATURE_FLAG_PROBE_COPY.enabled : ADMIN_FEATURE_FLAG_PROBE_COPY.disabled

/**
 * 配備設定の確認用 feature-flag について、運用環境とフロント・API それぞれの判定結果を描画する。
 * 全環境で「両方 OFF」も確かめられるよう、表示自体はフラグで隠さない。
 *
 * @returns 管理メニューに表示する feature-flag の状態。
 */
const AdminFeatureFlagProbe = () => {
  const [apiEnabled] = createResource(fetchApiFeatureFlagProbe)

  return (
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
      <span class="font-medium text-text">{ADMIN_FEATURE_FLAG_PROBE_COPY.title}</span>
      <dl class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div class="flex items-center gap-1">
          <dt>{ADMIN_FEATURE_FLAG_PROBE_COPY.environment}</dt>
          <dd class="font-medium text-text">{APP_ENVIRONMENT}</dd>
        </div>
        <div class="flex items-center gap-1">
          <dt>{ADMIN_FEATURE_FLAG_PROBE_COPY.frontend}</dt>
          <dd class="font-medium text-text">
            {formatFeatureFlagState(isFeatureEnabled('feature_flag_probe'))}
          </dd>
        </div>
        <div class="flex items-center gap-1">
          <dt>{ADMIN_FEATURE_FLAG_PROBE_COPY.api}</dt>
          <dd class="font-medium text-text">
            <Switch>
              <Match when={apiEnabled.loading}>
                <Loading size="inline" ariaLabel={ADMIN_FEATURE_FLAG_PROBE_COPY.loading} />
              </Match>
              <Match when={apiEnabled.error}>
                <span class="text-danger">{ADMIN_FEATURE_FLAG_PROBE_COPY.failed}</span>
              </Match>
              <Match when={apiEnabled.state === 'ready'}>
                {formatFeatureFlagState(apiEnabled() === true)}
              </Match>
            </Switch>
          </dd>
        </div>
      </dl>
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
      supplementaryContent={
        <>
          <AdminBuildInfo />
          <AdminFeatureFlagProbe />
        </>
      }
    />
  )
}

export default AdminPage
