import assert from 'node:assert/strict'
import test from 'node:test'
import { courseClassBadgeClass } from './courseClassDisplay.ts'

test('すべてのコースクラスバッジに共通の文字影を適用すること', () => {
  // Given: 定義済みクラスと未知のクラス。
  const courseClasses = ['1', '2', '3', '4', '5', 'inf', 'extra', 'unknown']

  // When: 各クラスのバッジクラスを取得する。
  const badgeClasses = courseClasses.map(courseClassBadgeClass)

  // Then: すべて文字影ユーティリティを含む。
  assert.ok(badgeClasses.every((className) => className.includes('text-shadow-badge')))
})
