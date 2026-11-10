import assert from 'node:assert/strict'
import test from 'node:test'

import { isHomePath, isNavItemActive, type NavItemActiveTarget } from './navItemMatching.ts'

const homeItem: NavItemActiveTarget = { id: 'home', path: '/users/alice' }
const goalsItem: NavItemActiveTarget = { id: 'goals', path: '/goals', matchPrefix: true }
const toolsItem: NavItemActiveTarget = { id: 'tools', path: '/tools', matchPrefix: true }
const songsItem: NavItemActiveTarget = { id: 'songs', path: '/songs', matchPrefix: true }
const othersItem: NavItemActiveTarget = { id: 'others', path: '#', matchPattern: /a^/ }
const navItems = [homeItem, goalsItem, toolsItem, songsItem, othersItem]

/**
 * 指定パスでアクティブになるナビゲーション項目のIDを返す。
 *
 * @param pathname - 判定するパス。
 * @param authUsername - ログイン中のユーザー名。未ログイン時は null または undefined。
 * @returns アクティブな項目ID。
 */
const activeItemIds = (pathname: string, authUsername: string | null | undefined): string[] =>
  navItems.filter((item) => isNavItemActive(item, pathname, authUsername)).map((item) => item.id)

test('ホームタブは /users/:username 直下でアクティブ判定される', () => {
  assert.equal(isHomePath('/users/alice'), true)
})

test('ホームタブはプロフィール配下のタブパスでもアクティブ判定される', () => {
  assert.equal(isHomePath('/users/alice/rating_best'), true)
  assert.equal(isHomePath('/users/alice/rating_new'), true)
  assert.equal(isHomePath('/users/alice/record_normal'), true)
  assert.equal(isHomePath('/users/alice/record_we'), true)
  assert.equal(isHomePath('/users/alice/record_course'), true)
  assert.equal(isHomePath('/users/alice/overpower'), true)
  assert.equal(isHomePath('/users/alice/overpower/genre'), true)
  assert.equal(isHomePath('/users/alice/overpower/level'), true)
  assert.equal(isHomePath('/users/alice/overpower/version'), true)
})

test('ホームタブは統計や無関係なパスではアクティブ判定されない', () => {
  assert.equal(isHomePath('/users/alice/stats'), false)
  assert.equal(isHomePath('/users/alice/unknown'), false)
  assert.equal(isHomePath('/users/alice/rating_best/genre'), false)
  assert.equal(isHomePath('/songs'), false)
})

test('不正なパーセントエンコードのユーザーパスではアクティブ判定が例外を出さず、どの項目もアクティブにならない', () => {
  // Given: ログイン中に、デコードできないユーザーセグメントを含むパスへアクセスする
  const authUsername = 'alice'
  const pathnames = ['/users/%', '/users/%ZZ', '/users/%ZZ/rating_best', '/users/alice%']

  for (const pathname of pathnames) {
    // When: 各ナビゲーション項目のアクティブ判定を行う
    const activeIds = activeItemIds(pathname, authUsername)

    // Then: 例外にならず、ホームを含む全項目が非アクティブ
    assert.deepEqual(activeIds, [])
  }
})

test('未ログイン時の不正なユーザーパスでもホーム項目はアクティブにならない', () => {
  // Given
  const pathname = '/users/%'

  // When
  const activeIds = activeItemIds(pathname, null)

  // Then
  assert.deepEqual(activeIds, [])
})

test('ASCIIのユーザー名では自分のユーザーページだけホームがアクティブになる', () => {
  // Given
  const authUsername = 'alice'

  // When / Then
  assert.deepEqual(activeItemIds('/users/alice', authUsername), ['home'])
  assert.deepEqual(activeItemIds('/users/alice/rating_best', authUsername), ['home'])
  assert.deepEqual(activeItemIds('/users/alice/overpower/level', authUsername), ['home'])
  assert.deepEqual(activeItemIds('/users/alice/stats', authUsername), [])
  assert.deepEqual(activeItemIds('/users/bob', authUsername), [])
  assert.deepEqual(activeItemIds('/goals', authUsername), ['goals'])
  assert.deepEqual(activeItemIds('/tools/random', authUsername), ['tools'])
  assert.deepEqual(activeItemIds('/songs/1', authUsername), ['songs'])
})

test('未ログイン時の正常なユーザーパスは従来どおりホームがアクティブになる', () => {
  // Given
  const pathname = '/users/alice/record_we'

  // When
  const activeIds = activeItemIds(pathname, undefined)

  // Then
  assert.deepEqual(activeIds, ['home'])
})

test('日本語とエンコード済みユーザー名では自分のページだけホームがアクティブになる', () => {
  // Given
  const authUsername = 'あい'
  const encodedPath = `/users/${encodeURIComponent(authUsername)}`

  // When / Then
  assert.deepEqual(activeItemIds('/users/あい', authUsername), ['home'])
  assert.deepEqual(activeItemIds(encodedPath, authUsername), ['home'])
  assert.deepEqual(activeItemIds(`${encodedPath}/overpower/genre`, authUsername), ['home'])
  assert.deepEqual(activeItemIds(`/users/${encodeURIComponent('うえ')}`, authUsername), [])
})

test('パーセントを含むユーザー名は1回だけデコードして比較する', () => {
  // Given: 「100%」の正規パスは /users/100%25。不正な /users/100% は非アクティブ
  const authUsername = '100%'

  // When / Then
  assert.deepEqual(activeItemIds('/users/100%25', authUsername), ['home'])
  assert.deepEqual(activeItemIds('/users/100%25/rating_new', authUsername), ['home'])
  assert.deepEqual(activeItemIds('/users/100%', authUsername), [])
  assert.deepEqual(activeItemIds('/users/%2525', '%25'), ['home'])
})
