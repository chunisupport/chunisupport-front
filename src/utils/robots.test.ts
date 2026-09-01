import assert from 'node:assert/strict'
import test from 'node:test'
import { isNoindexPathname, ROBOTS_NOINDEX_CONTENT, resolveRobotsMetaContent } from './robots.ts'

test('ユーザーページは noindex 対象であること', () => {
  // Given: 個人ページとその配下パス
  const pathnames = [
    '/users/kjumanenobikto',
    '/users/kjumanenobikto/stats',
    '/users/kjumanenobikto/record_normal',
    '/users/kjumanenobikto/overpower/genre',
    '/USERS/Kjumanenobikto/',
  ]

  // When: noindex 対象か判定する
  const results = pathnames.map(isNoindexPathname)

  // Then: すべて noindex 対象になる
  assert.deepEqual(results, [true, true, true, true, true])
})

test('楽曲ページなど公開コンテンツは noindex 対象ではないこと', () => {
  // Given: インデックスしてよい公開パス
  const pathnames = ['/', '/songs', '/songs/worldsend', '/songs/foo', '/tools/border-calculator']

  // When: noindex 対象か判定する
  const results = pathnames.map(isNoindexPathname)

  // Then: いずれも noindex 対象ではない
  assert.deepEqual(results, [false, false, false, false, false])
})

test('サイト全体が noindex のときはユーザーページ以外でも noindex を維持すること', () => {
  // Given: HTML 初期状態が noindex の楽曲ページ
  const pathname = '/songs/foo'
  const initialRobotsContent = ROBOTS_NOINDEX_CONTENT

  // When: 設定すべき robots content を決める
  const result = resolveRobotsMetaContent(pathname, initialRobotsContent)

  // Then: サイト全体の noindex は解除されない
  assert.equal(result, ROBOTS_NOINDEX_CONTENT)
})

test('インデックス許可時はユーザーページだけ noindex にすること', () => {
  // Given: HTML 初期状態に robots がなく、個人ページへ遷移する
  const pathname = '/users/alice'
  const initialRobotsContent = null

  // When: 設定すべき robots content を決める
  const result = resolveRobotsMetaContent(pathname, initialRobotsContent)

  // Then: ユーザーページは noindex になる
  assert.equal(result, ROBOTS_NOINDEX_CONTENT)
})

test('インデックス許可時は楽曲ページの robots を付けないこと', () => {
  // Given: HTML 初期状態に robots がなく、楽曲ページへ遷移する
  const pathname = '/songs/foo'
  const initialRobotsContent = null

  // When: 設定すべき robots content を決める
  const result = resolveRobotsMetaContent(pathname, initialRobotsContent)

  // Then: robots メタタグは設定しない
  assert.equal(result, null)
})
