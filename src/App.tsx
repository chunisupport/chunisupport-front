import { A, Route, Router, useParams } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createResource, ErrorBoundary, Show } from 'solid-js'
import { fetchUserProfileSummary } from './api/users'
import { Loading, NavBar, PlayerDataEmptyState } from './components'
import RequireAuth from './components/guards/RequireAuth'
import RequireRole from './components/guards/RequireRole'
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

// インラインコンポーネント用のラッパー
const LandingPage = () => {
  useDocumentTitle()
  return (
    <>
      <h1>Welcome!</h1>
      <A href="/login">Login</A>
    </>
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

const ToolsPage = () => {
  useDocumentTitle('ツール')
  return <h1>Tools Page</h1>
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
      <Route path="/users/:username/:page?" component={withNavBar(UserPage)} />
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
