import { A, Route, Router } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { NavBar } from './components'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import {
  Login,
  Register,
  RegisterScoreTempPage,
  SongDetail,
  SongsList,
  UserPage,
  UserRecord,
} from './pages'

const withNavBar = <P extends object>(Component: (props: P) => JSX.Element) => {
  return (props: P) => (
    <NavBar>
      <Component {...props} />
    </NavBar>
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

const SettingsPage = () => {
  useDocumentTitle('設定')
  return <h1>Settings Page</h1>
}

const TermsPage = () => {
  useDocumentTitle('利用規約')
  return <h1>Terms of Service Page</h1>
}

const AdminPage = () => {
  useDocumentTitle('管理')
  return <h1>Admin Page</h1>
}

const AdminUsersPage = () => {
  useDocumentTitle('ユーザー管理')
  return <h1>Admin Users Management Page</h1>
}

const AdminSongsPage = () => {
  useDocumentTitle('楽曲管理')
  return <h1>Admin Songs Management Page</h1>
}

const EditorPage = () => {
  useDocumentTitle('エディター')
  return <h1>Editor Page</h1>
}

const EditorSongsPage = () => {
  useDocumentTitle('楽曲編集')
  return <h1>Editor Songs Management Page</h1>
}

const App = () => {
  return (
    <Router>
      {/* ランディングページ */}
      <Route path="/" component={LandingPage} />

      {/* 認証系 */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* ユーザ */}
      <Route path="/users/:username" component={withNavBar(UserPage)} />
      <Route path="/users/:username/records" component={withNavBar(UserRecord)} />
      <Route path="/users/:username/stats" component={withNavBar(UserStatsPage)} />

      {/* 楽曲 */}
      <Route path="/songs" component={withNavBar(SongsList)} />
      <Route path="/songs/:displayid" component={withNavBar(SongDetail)} />

      {/* その他 */}
      <Route path="/register-score-temp" component={withNavBar(RegisterScoreTempPage)} />
      <Route path="/tools" component={withNavBar(ToolsPage)} />
      <Route path="/settings" component={withNavBar(SettingsPage)} />
      <Route path="/terms" component={withNavBar(TermsPage)} />

      {/* 管理系 */}
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/songs" component={AdminSongsPage} />
      <Route path="/editor" component={EditorPage} />
      <Route path="/editor/songs" component={EditorSongsPage} />
    </Router>
  )
}

export default App
