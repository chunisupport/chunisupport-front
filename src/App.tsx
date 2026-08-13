import { A, Route, Router } from '@solidjs/router'
import { Calculator, ChartNoAxesCombined, Dices, Target, Trophy } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, ErrorBoundary, For, lazy, Show } from 'solid-js'

import { fetchMe } from './api/users'
import {
  Announcements,
  AppToastRegion,
  LoadError,
  Loading,
  NavBar,
  X_TIMELINE_HEADING,
  XTimeline,
} from './components'
import ApplicationAvailabilityGate from './components/availability/ApplicationAvailabilityGate'
import { SelectableCardLink } from './components/common/SelectableCardButton'
import RequireAuth from './components/guards/RequireAuth'
import RequireRole from './components/guards/RequireRole'

import {
  FOOTER_COPYRIGHT_TEXT,
  FOOTER_COPYRIGHT_TEXT_2,
  FOOTER_DISCLAIMER_TEXT,
} from './constants/footer'
import {
  ADMIN_DATA_COVERAGE_PATH,
  ADMIN_MAINTENANCE_PATH,
  ADMIN_PATH,
  BEST_SLOT_RANKING_PATH,
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  EDITOR_PATH,
  EDITOR_SONGS_PATH,
  FRIENDS_PATH,
  LATEST_SCORE_UPDATE_PATH,
  MAINTENANCE_LOGIN_PATH,
  RANDOM_SONG_SELECTOR_PATH,
  REGISTER_SCORE_PATH,
  REGISTER_SCORE_TEMP_PATH,
  TOOL_STATS_PATH,
  TOOLS_PATH,
  WEAK_CHART_INSPECTOR_PATH,
} from './constants/routes'
import {
  DISABLED_TOOL_BADGE_TEXT,
  TOOL_LINKS,
  type ToolLink,
  type ToolLinkIcon,
} from './constants/tools'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import NotFoundPage from './pages/NotFoundPage'
import { getAuthenticatedUser } from './stores/authSession'
import { resolveAuthSession } from './usecases/auth/resolveAuthSession'
import { resolveHomeView } from './usecases/auth/resolveHomeView'

const Login = lazy(() => import('./pages/auth/Login/Login'))
const Register = lazy(() => import('./pages/auth/Register/Register'))
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'))
const MaintenanceLoginPage = lazy(() => import('./pages/maintenance/MaintenanceLoginPage'))

const UserPage = lazy(() => import('./pages/users/UserPage/UserPage'))
const UserStatsPage = lazy(() => import('./pages/users/UserStats/UserStatsPage'))
const GoalsList = lazy(() => import('./pages/goals/GoalsList/GoalsList'))

const SongsList = lazy(() => import('./pages/songs/SongsList/SongsList'))
const WorldsendSongsList = lazy(() => import('./pages/songs/WorldsendSongsList/WorldsendSongsList'))
const SongDetail = lazy(() => import('./pages/songs/SongDetail/SongDetail'))
const WorldsendSongDetail = lazy(
  () => import('./pages/songs/WorldsendSongDetail/WorldsendSongDetail')
)
const SongScoreHistory = lazy(() => import('./pages/songs/SongScoreHistory/SongScoreHistory'))
const WorldsendScoreHistory = lazy(
  () => import('./pages/songs/WorldsendScoreHistory/WorldsendScoreHistory')
)

const Settings = lazy(() => import('./pages/settings/Settings'))
const FriendsPage = lazy(() => import('./pages/friends/FriendsPage'))

const RegisterScorePage = lazy(() => import('./pages/register-score/RegisterScorePage'))
const LatestScoreUpdatePage = lazy(() => import('./pages/register-score/LatestScoreUpdatePage'))
const RegisterScoreTempPage = lazy(
  () => import('./pages/register-score-temp/RegisterScoreTempPage')
)

const ChartConstantCalculatorPage = lazy(() => import('./pages/tools/ChartConstantCalculatorPage'))
const BorderCalculatorPage = lazy(() => import('./pages/tools/BorderCalculatorPage'))
const WeakChartInspectorPage = lazy(() => import('./pages/tools/WeakChartInspectorPage'))
const RandomSongSelectorPage = lazy(() => import('./pages/tools/RandomSongSelectorPage'))
const BestSlotRankingPage = lazy(() => import('./pages/tools/BestSlotRankingPage'))

const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const AdminDataCoveragePage = lazy(() => import('./pages/admin/AdminDataCoveragePage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminSongsPage = lazy(() => import('./pages/admin/AdminSongsPage'))
const AdminHonorsPage = lazy(() => import('./pages/admin/AdminHonorsPage'))
const AdminMaintenancePage = lazy(() => import('./pages/admin/AdminMaintenancePage'))
const EditorPage = lazy(() => import('./pages/editor/EditorPage'))
const EditorSongsPage = lazy(() => import('./pages/editor/EditorSongsPage'))

/**
 * route module を事前取得できる遅延コンポーネント。
 *
 * @typeParam P - route component の props 型。
 */
type LazyRouteComponent<P extends object> = Component<P> & {
  preload: () => Promise<{ default: Component<P> }>
}

/**
 * 指定された画面を共通ナビゲーション内に表示する。
 *
 * @typeParam P - 対象画面の props 型。
 * @param Component - 共通ナビゲーション内へ配置する画面。
 * @returns 共通ナビゲーションを付与した route component。
 */
const withNavBar = <P extends object>(Component: (props: P) => JSX.Element) => {
  return (props: P) => (
    <NavBar>
      <Component {...props} />
    </NavBar>
  )
}

/**
 * 指定された画面を認証 guard の許可分岐内に表示する。
 *
 * @typeParam P - 対象画面の props 型。
 * @param Component - 認証を要求する画面。
 * @returns 認証 guard を付与した route component。
 */
const withAuth = <P extends object>(Component: (props: P) => JSX.Element) => {
  return (props: P) => (
    <RequireAuth>
      <Component {...props} />
    </RequireAuth>
  )
}

/**
 * route module の取得待ちと取得失敗を、ページ内の非同期処理とは独立して共通表示へ接続する。
 *
 * @typeParam P - 対象画面の props 型。
 * @param Component - 遅延読み込みする route component。
 * @returns 共通の loading・error boundary を付与した route component。
 */
const withRouteLoadBoundary = <P extends object>(Component: LazyRouteComponent<P>) => {
  let loadedModule: { default: Component<P> } | undefined

  return (props: P) => {
    // route 全体を Suspense で囲むとページ内 resource の待機まで捕捉するため、module だけを明示的に待つ。
    const [routeModule] = createResource(
      () =>
        loadedModule ??
        Component.preload().then((module) => {
          loadedModule = module
          return module
        })
    )

    return (
      <ErrorBoundary fallback={(error) => <LoadError error={error} />}>
        <Show when={routeModule()} fallback={<Loading />}>
          {(module) => {
            const RouteComponent = module().default
            return <RouteComponent {...props} />
          }}
        </Show>
      </ErrorBoundary>
    )
  }
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

        <div class="grid gap-6 md:grid-cols-2 md:items-start">
          <Announcements />

          <section class="min-w-0 rounded-lg border border-border bg-surface p-6">
            <h2 class="mb-3 text-xl font-semibold">{X_TIMELINE_HEADING}</h2>
            <XTimeline />
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
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

    case 'random':
      return <Dices class={iconClass} aria-hidden="true" />
    case 'ranking':
      return <Trophy class={iconClass} aria-hidden="true" />
  }
}

/**
 * ツールカード内の共通表示要素を表示する。
 * @param props.tool - 表示対象のツールリンク情報。
 * @returns アイコン、タイトル、状態ラベルを含むツールカード内容。
 */
const ToolCardContent = (props: { tool: ToolLink }) => {
  return (
    <SelectableCardLink
      href={props.tool.href}
      disabled={props.tool.disabled}
      class="min-h-24"
      icon={
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <ToolCardIcon icon={props.tool.icon} disabled={props.tool.disabled} />
        </span>
      }
      title={props.tool.title}
      titleClass="text-base"
    >
      <Show when={props.tool.disabled === true}>
        <span class="w-fit rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-muted">
          {DISABLED_TOOL_BADGE_TEXT}
        </span>
      </Show>
    </SelectableCardLink>
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
        <For each={TOOL_LINKS}>{(tool) => <ToolCardContent tool={tool} />}</For>
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

const LoadableAdminPage = withRouteLoadBoundary(AdminPage)
const LoadableAdminDataCoveragePage = withRouteLoadBoundary(AdminDataCoveragePage)
const LoadableAdminUsersPage = withRouteLoadBoundary(AdminUsersPage)
const LoadableAdminSongsPage = withRouteLoadBoundary(AdminSongsPage)
const LoadableAdminHonorsPage = withRouteLoadBoundary(AdminHonorsPage)
const LoadableAdminMaintenancePage = withRouteLoadBoundary(AdminMaintenancePage)
const LoadableEditorPage = withRouteLoadBoundary(EditorPage)
const LoadableEditorSongsPage = withRouteLoadBoundary(EditorSongsPage)
const LoadableRegisterScoreTempPage = withRouteLoadBoundary(RegisterScoreTempPage)

/**
 * ADMIN 権限を要求して管理メニューを表示する。
 *
 * @returns 権限制御と route module 読み込み境界を付与した管理メニュー。
 */
const GuardedAdminPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <LoadableAdminPage />
  </RequireRole>
)

/**
 * ADMINまたはEDITOR権限を要求してデータ充足状況画面を表示する。
 *
 * @returns 権限制御と route module 読み込み境界を付与したデータ充足状況画面。
 */
const GuardedAdminDataCoveragePage = () => (
  <RequireRole allowedRoles={['ADMIN', 'EDITOR']}>
    <LoadableAdminDataCoveragePage />
  </RequireRole>
)

/**
 * ADMIN 権限を要求してユーザー管理画面を表示する。
 *
 * @returns 権限制御と route module 読み込み境界を付与したユーザー管理画面。
 */
const GuardedAdminUsersPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <LoadableAdminUsersPage />
  </RequireRole>
)

/**
 * ADMIN 権限を要求して楽曲管理画面を表示する。
 *
 * @returns 権限制御と route module 読み込み境界を付与した楽曲管理画面。
 */
const GuardedAdminSongsPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <LoadableAdminSongsPage />
  </RequireRole>
)

/**
 * EDITOR権限を要求して楽曲編集画面を表示する。
 *
 * @returns 権限制御済みの楽曲編集画面。
 */
const GuardedEditorSongsPage = () => (
  <RequireRole allowedRoles={['EDITOR']}>
    <LoadableEditorSongsPage />
  </RequireRole>
)

/**
 * EDITOR権限を要求して編集メニューを表示する。
 *
 * @returns 権限制御と route module 読み込み境界を付与した編集メニュー。
 */
const GuardedEditorPage = () => (
  <RequireRole allowedRoles={['EDITOR']}>
    <LoadableEditorPage />
  </RequireRole>
)

/**
 * ADMIN 権限を要求して称号管理画面を表示する。
 *
 * @returns 権限制御済みの称号管理画面。
 */
const GuardedAdminHonorsPage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <LoadableAdminHonorsPage />
  </RequireRole>
)

/**
 * ADMIN 権限を要求してメンテナンス管理画面を表示する。
 *
 * @returns 権限制御済みのメンテナンス管理画面。
 */
const GuardedAdminMaintenancePage = () => (
  <RequireRole allowedRoles={['ADMIN']}>
    <LoadableAdminMaintenancePage />
  </RequireRole>
)

/**
 * 認証を要求してスコア登録の一時検証画面を表示する。
 *
 * @returns 認証 guard と route module 読み込み境界を付与した一時検証画面。
 */
const GuardedRegisterScoreTempPage = () => (
  <RequireAuth>
    <LoadableRegisterScoreTempPage />
  </RequireAuth>
)

/**
 * ルーター配下の画面をAPI可用性ゲートと共通トースト領域で包む。
 *
 * @param props - 現在のrouteが解決した画面。
 * @returns 可用性制御を適用したアプリケーションルート。
 */
const ApplicationRoot = (props: { children?: JSX.Element }) => (
  <ApplicationAvailabilityGate>
    {props.children}
    <AppToastRegion />
  </ApplicationAvailabilityGate>
)

/**
 * アプリ全体の route と共通 shell を構成する。
 *
 * @returns トップレベル route、toast 領域を含むアプリケーション。
 */
const App = () => {
  return (
    <Router root={ApplicationRoot}>
      {/* ランディングページ */}
      <Route path="/" component={LandingPage} />

      {/* 認証 */}
      <Route path="/login" component={withRouteLoadBoundary(Login)} />
      <Route path="/register" component={withRouteLoadBoundary(Register)} />
      <Route path="/403" component={withRouteLoadBoundary(ForbiddenPage)} />
      <Route
        path={MAINTENANCE_LOGIN_PATH}
        component={withRouteLoadBoundary(MaintenanceLoginPage)}
      />

      {/* ユーザ */}
      <Route
        path="/users/:username/stats"
        component={withNavBar(withRouteLoadBoundary(UserStatsPage))}
      />
      <Route
        path="/users/:username/:page?/:subPage?"
        component={withNavBar(withRouteLoadBoundary(UserPage))}
      />
      <Route path="/goals" component={withNavBar(withAuth(withRouteLoadBoundary(GoalsList)))} />

      {/* 楽曲 */}
      <Route path="/songs" component={withNavBar(withRouteLoadBoundary(SongsList))} />
      <Route
        path="/songs/worldsend"
        component={withNavBar(withRouteLoadBoundary(WorldsendSongsList))}
      />
      <Route
        path="/songs/worldsend/:displayid/chart-detail"
        component={withNavBar(withAuth(withRouteLoadBoundary(WorldsendScoreHistory)))}
      />
      <Route
        path="/songs/worldsend/:displayid"
        component={withNavBar(withRouteLoadBoundary(WorldsendSongDetail))}
      />
      <Route
        path="/songs/:displayid/chart-detail"
        component={withNavBar(withAuth(withRouteLoadBoundary(SongScoreHistory)))}
      />
      <Route path="/songs/:displayid" component={withNavBar(withRouteLoadBoundary(SongDetail))} />

      {/* 設定 */}
      <Route
        path="/settings/:section?"
        component={withNavBar(withAuth(withRouteLoadBoundary(Settings)))}
      />

      {/* その他 */}
      <Route
        path={`${FRIENDS_PATH}/:tab?`}
        component={withNavBar(withAuth(withRouteLoadBoundary(FriendsPage)))}
      />
      <Route
        path={REGISTER_SCORE_PATH}
        component={withNavBar(withAuth(withRouteLoadBoundary(RegisterScorePage)))}
      />
      <Route
        path={LATEST_SCORE_UPDATE_PATH}
        component={withNavBar(withAuth(withRouteLoadBoundary(LatestScoreUpdatePage)))}
      />
      <Route path={REGISTER_SCORE_TEMP_PATH} component={withNavBar(GuardedRegisterScoreTempPage)} />
      <Route path={TOOLS_PATH} component={withNavBar(ToolsPage)} />
      <Route
        path={CHART_CONSTANT_CALCULATOR_PATH}
        component={withNavBar(withRouteLoadBoundary(ChartConstantCalculatorPage))}
      />
      <Route
        path={BORDER_CALCULATOR_PATH}
        component={withNavBar(withRouteLoadBoundary(BorderCalculatorPage))}
      />
      <Route
        path={WEAK_CHART_INSPECTOR_PATH}
        component={withNavBar(withAuth(withRouteLoadBoundary(WeakChartInspectorPage)))}
      />
      <Route
        path={RANDOM_SONG_SELECTOR_PATH}
        component={withNavBar(withRouteLoadBoundary(RandomSongSelectorPage))}
      />
      <Route
        path={BEST_SLOT_RANKING_PATH}
        component={withNavBar(withRouteLoadBoundary(BestSlotRankingPage))}
      />
      <Route path={TOOL_STATS_PATH} component={withNavBar(EmptyToolPage)} />

      {/* 管理 */}
      <Route path={ADMIN_PATH} component={withNavBar(GuardedAdminPage)} />
      <Route path={ADMIN_DATA_COVERAGE_PATH} component={withNavBar(GuardedAdminDataCoveragePage)} />
      <Route path="/admin/users" component={withNavBar(GuardedAdminUsersPage)} />
      <Route path="/admin/songs" component={withNavBar(GuardedAdminSongsPage)} />
      <Route path="/admin/honors" component={withNavBar(GuardedAdminHonorsPage)} />
      <Route path={ADMIN_MAINTENANCE_PATH} component={withNavBar(GuardedAdminMaintenancePage)} />

      {/* 編集 */}
      <Route path={EDITOR_PATH} component={withNavBar(GuardedEditorPage)} />
      <Route path={EDITOR_SONGS_PATH} component={withNavBar(GuardedEditorSongsPage)} />

      {/* 404 */}
      <Route path="*" component={NotFoundPage} />
    </Router>
  )
}

export default App
