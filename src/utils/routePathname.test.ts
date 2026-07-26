import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeRoutePathname } from './routePathname.ts'

test('静的ルート比較用に大文字と重複・末尾スラッシュを正規化すること', () => {
  // Given: ルーターが同じ静的ルートとして扱うパス表記
  const pathnames = ['/MAINTENANCE//LOGIN/', '/maintenance/login']

  // When: ルート比較用に正規化する
  const normalized = pathnames.map(normalizeRoutePathname)

  // Then: 同じ小文字の絶対パスになる
  assert.deepEqual(normalized, ['/maintenance/login', '/maintenance/login'])
})

test('空セグメントだけのパスはルートパスとして維持すること', () => {
  // Given: スラッシュだけで構成されたパス
  const pathname = '///'

  // When & Then: ルートパスへ正規化する
  assert.equal(normalizeRoutePathname(pathname), '/')
})
