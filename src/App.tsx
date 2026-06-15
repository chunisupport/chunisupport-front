import { A, Route, Router, useParams } from '@solidjs/router'
import { Calculator, Search, Target } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, createResource, ErrorBoundary, For, Show } from 'solid-js'

import { fetchMe, fetchUserProfileSummary } from './api/users'
import { LoadError, Loading, NavBar, PlayerDataEmptyState } from './components'
import RequireAuth from './components/guards/RequireAuth'
import RequireRole from './components/guards/RequireRole'

import { FOOTER_COPYRIGHT_TEXT } from './constants/footer'
import {
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  LOCKED_SONGS_FINDER_PATH,
  REGISTER_SCORE_PATH,
  TOOLS_PATH,
} from './constants/routes'
import { TOOL_LINKS, type ToolLinkIcon } from './constants/tools'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import {
  AdminHonorsPage,
  AdminPage,
  AdminSongsPage,
  AdminUsersPage,
  BorderCalculatorPage,
  ForbiddenPage,
  GoalsList,
  Login,
  NotFoundPage,
  Register,
  RegisterScorePage,
  RegisterScoreTempPage,
  Settings,
  SongDetail,
  SongsList,
  UserPage,
  WorldsendSongDetail,
  WorldsendSongsList,
} from './pages'
import { getAuthenticatedUser } from './stores/authSession'
import { resolveAuthSession } from './usecases/auth/resolveAuthSession'
import { resolveHomeView } from './usecases/auth/resolveHomeView'
import { isNotFoundApiError } from './utils/apiError'

const withNavBar = <P extends object>(Component: (props: P) => JSX.Element) => {
  return (props: P) => (
    <NavBar>
      <Component {...props} />
    </NavBar>
  )
}

const withAuth = <P extends object>(Component: (props: P) => JSX.Element) => {
  return (props: P) => (
    <RequireAuth>
      <Component {...props} />
    </RequireAuth>
  )
}

/**
 * トップページ専用のフッターを表示する。
 *
 * @returns ライセンス表記を含むフッター。
 */
const LandingFooter = () => {
  return (
    <footer class="border-t border-border bg-surface px-4 py-5 text-sm text-text-muted">
      <div class="mx-auto flex w-full max-w-4xl justify-center">
        <span>{FOOTER_COPYRIGHT_TEXT}</span>
      </div>
    </footer>
  )
}

/**
 * トップページを表示する。
 *
 * @returns ランディングページ。
 */
const LandingPage = () => {
  useDocumentTitle()

  const [authStatus] = createResource(async () =>
    resolveAuthSession(() => fetchMe({ redirectOnUnauthorized: false }))
  )

  const homeView = createMemo(() => {
    return resolveHomeView({
      authStatus: authStatus() ?? 'unknown',
      username: getAuthenticatedUser()?.username ?? null,
    })
  })
  const authenticatedUsername = createMemo(() => {
    const view = homeView()
    return view.type === 'authenticated' ? view.username : null
  })

  return (
    <div class="flex min-h-dvh flex-col">
      <main class="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <Show when={homeView().type !== 'loading'} fallback={<Loading />}>
          <Show
            when={authenticatedUsername()}
            fallback={
              <section class="rounded-lg border border-border bg-surface p-6">
                <h1 class="mb-2 text-2xl font-semibold">ChuniSupport</h1>
                <p class="mb-4 text-sm text-text-muted">
                  ログインまたは新規登録して、プレイデータを管理しましょう。
                </p>
                <div class="flex flex-wrap gap-3">
                  <A
                    href="/login"
                    class="rounded-md border border-border-strong px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                  >
                    ログイン
                  </A>
                  <A
                    href="/register"
                    class="rounded-md bg-action-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-action-primary-hover"
                  >
                    新規登録
                  </A>
                </div>
              </section>
            }
          >
            {(username) => (
              <section class="rounded-lg border border-border bg-surface p-6">
                <h1 class="mb-4 text-2xl font-semibold">ようこそ、{username()}さん</h1>
                <div class="rounded-md border border-border bg-surface-muted p-4">
                  <p class="text-sm text-text-muted">プロフィール</p>
                  <p class="mt-1 text-lg font-semibold text-text">@{username()}</p>
                  <A
                    href={`/users/${encodeURIComponent(username())}`}
                    class="mt-3 inline-block text-sm font-medium text-action-primary underline"
                  >
                    マイページを開く
                  </A>
                </div>
              </section>
            )}
          </Show>
        </Show>

        <section class="rounded-lg border border-border bg-surface p-6">
          <h2 class="mb-3 text-xl font-semibold">お知らせ</h2>
          <ul class="space-y-2 text-sm text-text-muted">
            <li class="rounded-md border border-border p-3">
              [モック] 2026-04-29: 新機能の準備を進めています。
            </li>
            <li class="rounded-md border border-border p-3">
              [モック] 2026-04-25: メンテナンス予定を公開しました。
            </li>
          </ul>
        </section>

        <section class="rounded-lg border border-border bg-surface p-6">
          <h2 class="mb-3 text-xl font-semibold">X公式アカウント</h2>
          <ul class="space-y-2 text-sm text-text-muted">
            <li class="rounded-md border border-border p-3">
              [モック] 投稿1: アップデート予定のお知らせ
            </li>
            <li class="rounded-md border border-border p-3">[モック] 投稿2: 活用方法の紹介</li>
          </ul>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}

const UserStatsPage = () => {
  const params = useParams<{ username: string }>()
  useDocumentTitle('統計')

  const [resource] = createResource(() => params.username, fetchUserProfileSummary)

  return (
    <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
      <Show
        when={!resource.error}
        fallback={
          <Show
            when={isNotFoundApiError(resource.error)}
            fallback={
              <div class="mx-auto w-full max-w-3xl p-4">
                <LoadError error={resource.error} />
              </div>
            }
          >
            <NotFoundPage />
          </Show>
        }
      >
        <Show when={!resource.loading} fallback={<Loading />}>
          <Show when={resource()?.player} fallback={<PlayerDataEmptyState />}>
            <div class="mx-auto w-full max-w-3xl p-4">
              <h1 class="text-2xl font-semibold">統計</h1>
            </div>
          </Show>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

/**
 * ツールリンクの種類に対応するアイコンを表示する。
 * @param props.icon - 表示するツールアイコンの種類。
 * @returns ツールカード用アイコン
 */
const ToolCardIcon = (props: { icon: ToolLinkIcon }) => {
  const iconClass = 'h-5 w-5 text-action-primary'

  switch (props.icon) {
    case 'calculator':
      return <Calculator class={iconClass} aria-hidden="true" />
    case 'target':
      return <Target class={iconClass} aria-hidden="true" />
    case 'search':
      return <Search class={iconClass} aria-hidden="true" />
  }
}

/**
 * ツールページの見出しを表示する。
 * @returns ツールページ
 */
const ToolsPage = () => {
  useDocumentTitle('ツール')

  return (
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">ツール</h1>
      <div class="grid gap-3 sm:grid-cols-2">
        <For each={TOOL_LINKS}>
          {(tool) => (
            <A
              href={tool.href}
              class="flex min-h-24 items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
                <ToolCardIcon icon={tool.icon} />
              </span>
              <span class="text-base font-semibold text-text">{tool.title}</span>
            </A>
          )}
        </For>
      </div>
    </div>
  )
}

/**
 * 未実装ツールの空ページを表示する。
 * @returns 空のツールページ
 */
const EmptyToolPage = () => {
  return <div />
}

const TermsPage = () => {
  useDocumentTitle('利用規約')
  return <h1>Terms of Service Page</h1>
}

const GuardedAdminPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <AdminPage />
  </RequireRole>
)

const GuardedAdminUsersPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <AdminUsersPage />
  </RequireRole>
)

const GuardedAdminSongsPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <AdminSongsPage />
  </RequireRole>
)

/**
 * ADMIN 権限を要求して称号管理画面を表示する。
 *
 * @returns 権限制御済みの称号管理画面。
 */
const GuardedAdminHonorsPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <AdminHonorsPage />
  </RequireRole>
)

const GuardedRegisterScoreTempPage = () => (
  <RequireAuth>
    <RegisterScoreTempPage />
  </RequireAuth>
)

const App = () => {
  return (
    <Router>
      {/* ランディングページ */}
      <Route path="/" component={LandingPage} />

      {/* 認証 */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/403" component={ForbiddenPage} />

      {/* ユーザ */}
      <Route path="/users/:username/stats" component={withNavBar(withAuth(UserStatsPage))} />
      <Route path="/users/:username/:page?/:subPage?" component={withNavBar(UserPage)} />
      <Route path="/goals" component={withNavBar(withAuth(GoalsList))} />

      {/* 楽曲 */}
      <Route path="/songs" component={withNavBar(SongsList)} />
      <Route path="/songs/worldsend" component={withNavBar(WorldsendSongsList)} />
      <Route path="/songs/worldsend/:displayid" component={withNavBar(WorldsendSongDetail)} />
      <Route path="/songs/:displayid" component={withNavBar(SongDetail)} />

      {/* 設定 */}
      <Route path="/settings/:section?" component={withNavBar(withAuth(Settings))} />

      {/* その他 */}
      <Route path={REGISTER_SCORE_PATH} component={withNavBar(withAuth(RegisterScorePage))} />
      <Route path="/register-score-temp" component={withNavBar(GuardedRegisterScoreTempPage)} />
      <Route path={TOOLS_PATH} component={withNavBar(ToolsPage)} />
      <Route path={CHART_CONSTANT_CALCULATOR_PATH} component={withNavBar(EmptyToolPage)} />
      <Route path={BORDER_CALCULATOR_PATH} component={withNavBar(BorderCalculatorPage)} />
      <Route path={LOCKED_SONGS_FINDER_PATH} component={withNavBar(EmptyToolPage)} />
      <Route path="/terms" component={withNavBar(TermsPage)} />

      {/* 管理 */}
      <Route path="/admin" component={withNavBar(GuardedAdminPage)} />
      <Route path="/admin/users" component={withNavBar(GuardedAdminUsersPage)} />
      <Route path="/admin/songs" component={withNavBar(GuardedAdminSongsPage)} />
      <Route path="/admin/honors" component={withNavBar(GuardedAdminHonorsPage)} />

      {/* 404 */}
      <Route path="*" component={NotFoundPage} />
    </Router>
  )
}

export default App
