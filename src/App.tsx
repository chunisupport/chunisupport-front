import { A, Route, Router, useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createMemo, createResource, ErrorBoundary, For, Show } from 'solid-js'
import { fetchMe, fetchUserProfileSummary } from './api/users'
import { Loading, NavBar, PlayerDataEmptyState } from './components'
import RequireAuth from './components/guards/RequireAuth'
import RequireRole from './components/guards/RequireRole'
import {
  ANNOUNCEMENTS_ITEMS,
  ANNOUNCEMENTS_TITLE,
  X_ACCOUNT_ITEMS,
  X_ACCOUNT_TITLE,
} from './constants'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import {
  AdminPage,
  AdminSongsPage,
  AdminUsersPage,
  ForbiddenPage,
  GoalsList,
  Login,
  NotFoundPage,
  Register,
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
 * ランディングページを表示し、認証状態に応じた導線とお知らせ情報を提供する。
 * @returns 認証状態に応じたコンテンツとお知らせセクションを含むJSX
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

  return (
    <main class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <Show when={homeView().type !== 'loading'} fallback={<Loading />}>
        <Show
          when={homeView().type === 'authenticated' ? homeView() : null}
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
          {(view) => (
            <section class="rounded-lg border border-border bg-surface p-6">
              <h1 class="mb-4 text-2xl font-semibold">ようこそ、{view().username}さん</h1>
              <div class="rounded-md border border-border bg-surface-muted p-4">
                <p class="text-sm text-text-muted">プロフィール</p>
                <p class="mt-1 text-lg font-semibold text-text">@{view().username}</p>
                <A
                  href={`/users/${encodeURIComponent(view().username)}`}
                  class="mt-3 inline-block text-sm font-medium text-primary-600 underline"
                >
                  マイページを開く
                </A>
              </div>
            </section>
          )}
        </Show>
      </Show>

      <section class="rounded-lg border border-border bg-surface p-6">
        <h2 class="mb-3 text-xl font-semibold">{ANNOUNCEMENTS_TITLE}</h2>
        <ul class="space-y-2 text-sm text-text-muted">
          <For each={ANNOUNCEMENTS_ITEMS}>
            {(item) => <li class="rounded-md border border-border p-3">{item}</li>}
          </For>
        </ul>
      </section>

      <section class="rounded-lg border border-border bg-surface p-6">
        <h2 class="mb-3 text-xl font-semibold">{X_ACCOUNT_TITLE}</h2>
        <ul class="space-y-2 text-sm text-text-muted">
          <For each={X_ACCOUNT_ITEMS}>
            {(item) => <li class="rounded-md border border-border p-3">{item}</li>}
          </For>
        </ul>
      </section>
    </main>
  )
}

const UserStatsPage = () => {
  const params = useParams<{ username: string }>()
  useDocumentTitle('統計')

  const [resource] = createResource(() => params.username, fetchUserProfileSummary)

  return (
    <ErrorBoundary fallback={(err) => <p class="p-4 text-red-500">ERROR: {err.message}</p>}>
      <Show when={!resource.loading} fallback={<Loading />}>
        <Show when={resource()?.player} fallback={<PlayerDataEmptyState />}>
          <div class="mx-auto w-full max-w-3xl p-4">
            <h1 class="text-2xl font-semibold">統計</h1>
          </div>
        </Show>
      </Show>
    </ErrorBoundary>
  )
}

/**
 * ツールページの見出しを表示する。
 * @returns ツールページ
 */
const ToolsPage = () => {
  useDocumentTitle('ツール')

  return (
    <div class="mx-auto w-full max-w-3xl p-4">
      <h1 class="text-2xl font-semibold">ツール</h1>
    </div>
  )
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
      <Route path="/register-score-temp" component={withNavBar(GuardedRegisterScoreTempPage)} />
      <Route path="/tools" component={withNavBar(ToolsPage)} />
      <Route path="/terms" component={withNavBar(TermsPage)} />

      {/* 管理 */}
      <Route path="/admin" component={withNavBar(GuardedAdminPage)} />
      <Route path="/admin/users" component={withNavBar(GuardedAdminUsersPage)} />
      <Route path="/admin/songs" component={withNavBar(GuardedAdminSongsPage)} />

      {/* 404 */}
      <Route path="*" component={NotFoundPage} />
    </Router>
  )
}

export default App
