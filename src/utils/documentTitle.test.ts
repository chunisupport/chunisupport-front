import assert from 'node:assert/strict'
import test from 'node:test'
import { SITE_NAME } from '../constants/site'
import { createDocumentTitleRegistry } from './documentTitle'

test('遷移先の画面が先に登録され、その後で前の画面が解除されても遷移先のタイトルを表示すること', () => {
  // Given: 新規登録画面を表示している
  const registry = createDocumentTitleRegistry()
  const register = registry.add('新規登録 | ChuniSupport')

  // When: 遷移先の画面を登録してから、新規登録画面を解除する
  registry.add('alice | ChuniSupport')
  registry.remove(register)

  // Then
  assert.equal(registry.current(), 'alice | ChuniSupport')
})

test('前の画面が先に解除され、その後で遷移先の画面が登録されても遷移先のタイトルを表示すること', () => {
  // Given: 新規登録画面を表示している
  const registry = createDocumentTitleRegistry()
  const register = registry.add('新規登録 | ChuniSupport')

  // When: 新規登録画面を解除してから、遷移先の画面を登録する
  registry.remove(register)
  registry.add('alice | ChuniSupport')

  // Then
  assert.equal(registry.current(), 'alice | ChuniSupport')
})

test('入れ子の画面が解除されたら外側の画面のタイトルに戻ること', () => {
  // Given: ユーザーページの中に404画面を表示している
  const registry = createDocumentTitleRegistry()
  const userPage = registry.add('alice | ChuniSupport')
  const notFound = registry.add('404 Not Found | ChuniSupport')
  assert.equal(registry.current(), '404 Not Found | ChuniSupport')

  // When: 404画面だけを解除する
  registry.remove(notFound)

  // Then
  assert.equal(registry.current(), 'alice | ChuniSupport')
  registry.remove(userPage)
})

test('登録したタイトルを更新したら更新後のタイトルを表示すること', () => {
  // Given
  const registry = createDocumentTitleRegistry()
  const entry = registry.add('alice | ChuniSupport')

  // When: プレイヤー名を読み込んでタイトルを更新する
  entry.title = 'Alice (@alice) | ChuniSupport'

  // Then
  assert.equal(registry.current(), 'Alice (@alice) | ChuniSupport')
})

test('タイトルを設定している画面がなければサイト名を表示すること', () => {
  // Given
  const registry = createDocumentTitleRegistry()
  const entry = registry.add('alice | ChuniSupport')

  // When
  registry.remove(entry)

  // Then
  assert.equal(registry.current(), SITE_NAME)
})
