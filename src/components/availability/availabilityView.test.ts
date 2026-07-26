import assert from 'node:assert/strict'
import test from 'node:test'
import { isMaintenanceSessionResolved, resolveAvailabilityView } from './availabilityView.ts'

const maintenanceState = {
  kind: 'maintenance',
  comment: 'データ更新中',
  updatedAt: null,
  retryAfterSeconds: 60,
  checkedAt: 1,
} as const

test('一般利用者はメンテナンス中にアプリ本体へ進めない', () => {
  // Given: 一般アカウントでメンテナンス状態
  const options = {
    pathname: '/songs',
    state: maintenanceState,
    isBootstrapping: false,
    accountType: 'PLAYER',
  } as const

  // When: 表示対象を解決する
  const view = resolveAvailabilityView(options)

  // Then: メンテナンス画面になる
  assert.equal(view, 'maintenance')
})

test('管理者と編集者はメンテナンス中もアプリ本体へ進める', () => {
  // Given: メンテナンス中に許可するスタッフ種別
  const accountTypes = ['ADMIN', 'EDITOR'] as const

  // When: 各アカウントの表示対象を解決する
  const views = accountTypes.map((accountType) =>
    resolveAvailabilityView({
      pathname: '/admin',
      state: maintenanceState,
      isBootstrapping: false,
      accountType,
    })
  )

  // Then: どちらもアプリ本体になる
  assert.deepEqual(views, ['application', 'application'])
})

test('認証済みユーザーが既知なら再取得前にメンテナンス用認証判定を完了できる', () => {
  // Given: 通常稼働中にAPIで検証済みのユーザーを保持している
  const options = {
    authStatus: 'authenticated',
    hasAuthenticatedUser: true,
    hasRestored: false,
  } as const

  // When & Then: メンテナンス開始直後も既知の判定を利用できる
  assert.equal(isMaintenanceSessionResolved(options), true)
})

test('認証状態が未確定ならメンテナンス用セッション復元を待つ', () => {
  // Given: FirebaseとAPIの認証復元をまだ実行していない
  const options = {
    authStatus: 'unknown',
    hasAuthenticatedUser: false,
    hasRestored: false,
  } as const

  // When & Then: 復元完了までは未解決として扱う
  assert.equal(isMaintenanceSessionResolved(options), false)
})

test('既知ユーザーが残っていても認証信頼を無効化した場合は再検証を待つ', () => {
  // Given: maintenance_mode応答によって既知ユーザーの認証信頼を無効化した
  const options = {
    authStatus: 'error',
    hasAuthenticatedUser: true,
    hasRestored: false,
  } as const

  // When & Then: APIでスタッフ権限を再検証するまでは未解決として扱う
  assert.equal(isMaintenanceSessionResolved(options), false)
})

test('復元処理が完了済みなら未認証でもメンテナンス用認証判定を完了できる', () => {
  // Given: Firebaseユーザーが存在しないことを確認済み
  const options = {
    authStatus: 'unauthenticated',
    hasAuthenticatedUser: false,
    hasRestored: true,
  } as const

  // When & Then: 一般利用者向け画面の表示判定へ進める
  assert.equal(isMaintenanceSessionResolved(options), true)
})

test('スタッフ用ログイン画面は初回確認中でも可用性ゲートを迂回する', () => {
  // Given: 初回確認中のスタッフ用ログインパス
  const options = {
    pathname: '/maintenance/login',
    state: { kind: 'checking' },
    isBootstrapping: true,
  } as const

  // When & Then: ログイン画面を表示できる
  assert.equal(resolveAvailabilityView(options), 'application')
})

test('表記が異なるスタッフログイン画面も可用性ゲートを迂回する', () => {
  // Given: ルーターが同じ画面として扱う末尾・重複スラッシュと大文字のパス
  const pathnames = ['/maintenance/login/', '/maintenance//login', '/MAINTENANCE/LOGIN']

  // When: 各パスの表示対象を解決する
  const views = pathnames.map((pathname) =>
    resolveAvailabilityView({
      pathname,
      state: maintenanceState,
      isBootstrapping: false,
    })
  )

  // Then: すべてスタッフログイン画面を表示できる
  assert.deepEqual(views, ['application', 'application', 'application'])
})

test('後発メンテナンスのスタッフセッション復元中は一般画面を表示しない', () => {
  // Given: メンテナンス検知後にスタッフセッションを復元している管理者
  const options = {
    pathname: '/admin',
    state: maintenanceState,
    isBootstrapping: true,
    accountType: 'ADMIN',
  } as const

  // When & Then: 復元完了までは読み込み画面になる
  assert.equal(resolveAvailabilityView(options), 'loading')
})

test('API接続不能時はメンテナンスと区別した画面を表示する', () => {
  // Given: APIへの接続確認に失敗した状態
  const options = {
    pathname: '/',
    state: { kind: 'unavailable', retryCount: 2, checkedAt: 1 },
    isBootstrapping: false,
  } as const

  // When & Then: 接続不能画面になる
  assert.equal(resolveAvailabilityView(options), 'unavailable')
})
