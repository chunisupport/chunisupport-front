import { A, Route, Router } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { NavBar } from './components'
import RequireAuth from './components/guards/RequireAuth'
import RequireRole from './components/guards/RequireRole'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import {
  AdminPage,
  AdminSongsPage,
  AdminUsersPage,
  EditorPage,
  EditorSongsPage,
  ForbiddenPage,
  GoalsList,
  Login,
  NotFoundPage,
  RecoveryReset,
  Register,
  RegisterScoreTempPage,
  SettingsApiTokenPage,
  SettingsGoogleLinkPage,
  SettingsPage,
  SettingsPasswordPage,
  SettingsPrivacyPage,
  SettingsRecoveryCodesPage,
  SettingsSessionsPage,
  SongDetail,
  SongsList,
  UserPage,
  WorldsendSongDetail,
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
  useDocumentTitle('統計')
  return <h1>User Stats Page</h1>
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

const GuardedEditorPage = () => (
  <RequireRole allowedRoles={['EDITOR', 'ADMIN']}>
    <EditorPage />
  </RequireRole>
)

const GuardedEditorSongsPage = () => (
  <RequireRole allowedRoles={['EDITOR', 'ADMIN']}>
    <EditorSongsPage />
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
      <Route path="/recovery" component={RecoveryReset} />
      <Route path="/403" component={ForbiddenPage} />

      {/* ユーザ */}
      <Route path="/users/:username/:page?" component={withNavBar(UserPage)} />
      <Route path="/users/:username/stats" component={withNavBar(withAuth(UserStatsPage))} />
      <Route path="/goals" component={withNavBar(withAuth(GoalsList))} />

      {/* 楽曲 */}
      <Route path="/songs" component={withNavBar(SongsList)} />
      <Route path="/songs/worldsend/:displayid" component={withNavBar(WorldsendSongDetail)} />
      <Route path="/songs/:displayid" component={withNavBar(SongDetail)} />

      {/* 設定 */}
      <Route path="/settings" component={withNavBar(withAuth(SettingsPage))} />
      <Route path="/settings/privacy" component={withNavBar(withAuth(SettingsPrivacyPage))} />
      <Route path="/settings/password" component={withNavBar(withAuth(SettingsPasswordPage))} />
      <Route
        path="/settings/recovery-codes"
        component={withNavBar(withAuth(SettingsRecoveryCodesPage))}
      />
      <Route path="/settings/api-token" component={withNavBar(withAuth(SettingsApiTokenPage))} />
      <Route path="/settings/sessions" component={withNavBar(withAuth(SettingsSessionsPage))} />
      <Route
        path="/settings/google-link"
        component={withNavBar(withAuth(SettingsGoogleLinkPage))}
      />

      {/* その他 */}
      <Route path="/register-score-temp" component={withNavBar(GuardedRegisterScoreTempPage)} />
      <Route path="/tools" component={withNavBar(ToolsPage)} />
      <Route path="/terms" component={withNavBar(TermsPage)} />

      {/* 管理 */}
      <Route path="/admin" component={withNavBar(GuardedAdminPage)} />
      <Route path="/admin/users" component={withNavBar(GuardedAdminUsersPage)} />
      <Route path="/admin/songs" component={withNavBar(GuardedAdminSongsPage)} />
      <Route path="/editor" component={withNavBar(GuardedEditorPage)} />
      <Route path="/editor/songs" component={withNavBar(GuardedEditorSongsPage)} />

      {/* 404 */}
      <Route path="*" component={NotFoundPage} />
    </Router>
  )
}

export default App
