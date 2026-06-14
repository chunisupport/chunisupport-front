import { A } from '@solidjs/router'
import { createResource, For, Show } from 'solid-js'
import { fetchApiRoot } from '../../api/root'
import {
  FRONTEND_APP_NAME,
  FRONTEND_BUILD_DATE,
  FRONTEND_COMMIT_HASH,
} from '../../constants/appBuild'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatBuildRevisionLabel } from '../../utils/appVersionLabel'

const links = [
  {
    href: '/admin/users',
    title: 'ユーザー管理',
    description: 'ユーザー一覧、検索、削除、復活を行います。',
  },
  {
    href: '/admin/songs',
    title: '楽曲管理',
    description: '楽曲一覧、編集、削除、復活を行います。',
  },
  {
    href: '/admin/honors',
    title: '称号管理',
    description: '称号一覧、クラス、画像URLを確認します。',
  },
]

/**
 * 管理者向けの API とフロントエンドのビルド情報を描画する。
 *
 * @returns 管理メニューに表示するビルド情報。
 */
const AdminBuildInfo = () => {
  const [apiRoot] = createResource(fetchApiRoot)
  const frontendBuildLabel = formatBuildRevisionLabel({
    appName: FRONTEND_APP_NAME,
    buildDate: FRONTEND_BUILD_DATE,
    commitHash: FRONTEND_COMMIT_HASH,
  })

  return (
    <div class="mt-4 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <Show when={apiRoot()} keyed>
          {(root) => (
            <span>
              {formatBuildRevisionLabel({
                appName: root.app_name,
                buildDate: root.build_date,
                commitHash: root.revision ?? 'unknown',
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
  useDocumentTitle('管理')

  return (
    <div class="mx-auto w-full max-w-4xl p-6">
      <h1 class="text-2xl font-semibold">管理ページ</h1>
      <p class="mt-2 text-sm text-text-muted">管理者向けのメニューです。</p>
      <AdminBuildInfo />

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <For each={links}>
          {(link) => (
            <A
              href={link.href}
              class="rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:border-info-border hover:bg-info-bg"
            >
              <h2 class="text-lg font-semibold text-text">{link.title}</h2>
              <p class="mt-1 text-sm text-text-muted">{link.description}</p>
            </A>
          )}
        </For>
      </div>
    </div>
  )
}

export default AdminPage
