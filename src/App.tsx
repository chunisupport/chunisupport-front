import { A, Route, Router, useParams } from '@solidjs/router'
import { Calculator, ChartNoAxesCombined, Search, Target } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, createResource, ErrorBoundary, For, Show } from 'solid-js'

import { fetchMe, fetchUserProfileSummary } from './api/users.ts'
import RequireAuth from './components/guards/RequireAuth.tsx'
import RequireRole from './components/guards/RequireRole.tsx'
import { LoadError, Loading, NavBar, PlayerDataEmptyState } from './components/index.ts'

import {
  FOOTER_COPYRIGHT_TEXT,
  FOOTER_COPYRIGHT_TEXT_2,
  FOOTER_DISCLAIMER_TEXT,
} from './constants/footer.ts'
import {
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  LOCKED_SONGS_FINDER_PATH,
  REGISTER_SCORE_PATH,
  TOOLS_PATH,
  WEAK_CHART_INSPECTOR_PATH,
} from './constants/routes.ts'
import {
  DISABLED_TOOL_BADGE_TEXT,
  TOOL_LINKS,
  type ToolLink,
  type ToolLinkIcon,
} from './constants/tools.ts'
import { useDocumentTitle } from './hooks/useDocumentTitle.ts'
import {
  AdminHonorsPage,
  AdminPage,
  AdminSongsPage,
  AdminUsersPage,
  BorderCalculatorPage,
  ChartConstantCalculatorPage,
  ForbiddenPage,
  GoalsList,
  Login,
  NotFoundPage,
  Register,
  RegisterScorePage,
  RegisterScoreTempPage,
  Settings,
  SongDetail,
  SongScoreHistory,
  SongsList,
  UserPage,
  WeakChartInspectorPage,
  WorldsendSongDetail,
  WorldsendSongsList,
} from './pages/index.ts'
import { getAuthenticatedUser } from './stores/authSession.ts'
import { resolveAuthSession } from './usecases/auth/resolveAuthSession.ts'
import { resolveHomeView } from './usecases/auth/resolveHomeView.ts'
import { isNotFoundApiError } from './utils/apiError.ts'

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
      <div class="mx-auto flex w-full max-w-4xl flex-col items-center gap-1">
        <span>{FOOTER_COPYRIGHT_TEXT}</span>
        <span>{FOOTER_COPYRIGHT_TEXT_2}</span>
        <span>{FOOTER_DISCLAIMER_TEXT}</span>
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
 * @param props.disabled - 無効状態の見た目で表示するかどうか。
 * @returns ツールカード用アイコン
 */
const ToolCardIcon = (props: { icon: ToolLinkIcon; disabled?: boolean }) => {
  const iconClass = `h-5 w-5 ${props.disabled === true ? 'text-text-muted' : 'text-action-primary'}`

  switch (props.icon) {
    case 'calculator':
      return <Calculator class={iconClass} aria-hidden="true" />
    case 'target':
      return <Target class={iconClass} aria-hidden="true" />
    case 'chart':
      return <ChartNoAxesCombined class={iconClass} aria-hidden="true" />
    case 'search':
      return <Search class={iconClass} aria-hidden="true" />
  }
}

/**
 * ツールカード内の共通表示要素を表示する。
 * @param props.tool - 表示対象のツールリンク情報。
 * @returns アイコン、タイトル、状態ラベルを含むツールカード内容。
 */
const ToolCardContent = (props: { tool: ToolLink }) => {
  return (
    <>
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
        <ToolCardIcon icon={props.tool.icon} disabled={props.tool.disabled} />
      </span>
      <span class="flex min-w-0 flex-1 flex-row gap-2">
        <span class="text-base font-semibold text-text">{props.tool.title}</span>
        <Show when={props.tool.disabled === true}>
          <span class="w-fit rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-muted">
            {DISABLED_TOOL_BADGE_TEXT}
          </span>
        </Show>
      </span>
    </>
  )
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
            <Show
              when={tool.disabled !== true}
              fallback={
                <div
                  aria-disabled="true"
                  class="flex min-h-24 cursor-not-allowed items-center gap-4 rounded-lg border border-border bg-surface-muted p-4 opacity-70"
                >
                  <ToolCardContent tool={tool} />
                </div>
              }
            >
              <A
                href={tool.href}
                class="flex min-h-24 items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <ToolCardContent tool={tool} />
              </A>
            </Show>
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
      <Route
        path="/songs/:displayid/score-history"
        component={withNavBar(withAuth(SongScoreHistory))}
      />
      <Route path="/songs/:displayid" component={withNavBar(SongDetail)} />

      {/* 設定 */}
      <Route path="/settings/:section?" component={withNavBar(withAuth(Settings))} />

      {/* その他 */}
      <Route path={REGISTER_SCORE_PATH} component={withNavBar(withAuth(RegisterScorePage))} />
      <Route path="/register-score-temp" component={withNavBar(GuardedRegisterScoreTempPage)} />
      <Route path={TOOLS_PATH} component={withNavBar(ToolsPage)} />
      <Route
        path={CHART_CONSTANT_CALCULATOR_PATH}
        component={withNavBar(ChartConstantCalculatorPage)}
      />
      <Route path={BORDER_CALCULATOR_PATH} component={withNavBar(BorderCalculatorPage)} />
      <Route
        path={WEAK_CHART_INSPECTOR_PATH}
        component={withNavBar(withAuth(WeakChartInspectorPage))}
      />
      <Route path={LOCKED_SONGS_FINDER_PATH} component={withNavBar(EmptyToolPage)} />

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
