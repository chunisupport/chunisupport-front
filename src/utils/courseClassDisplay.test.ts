import assert from 'node:assert/strict'
import test from 'node:test'
import { COURSE_CLASS_OPTIONS, courseClassBadgeClass } from './courseClassDisplay.ts'

test('コースクラス選択肢はAPI値と表示ラベルをすべて含むこと', () => {
  // Given: 選択可能なコースクラス。

  // When: 選択肢の値を取得する。
  const values = COURSE_CLASS_OPTIONS.map((option) => option.value)

  // Then: 1〜5 / inf / extra をすべて含む。
  assert.deepEqual(values, ['1', '2', '3', '4', '5', 'inf', 'extra'])
})

test('すべてのコースクラスバッジに共通の文字影を適用すること', () => {
  // Given: 定義済みクラスと未知のクラス。
  const courseClasses = ['1', '2', '3', '4', '5', 'inf', 'extra', 'unknown']

  // When: 各クラスのバッジクラスを取得する。
  const badgeClasses = courseClasses.map(courseClassBadgeClass)

  // Then: すべて文字影ユーティリティを含む。
  assert.ok(badgeClasses.every((className) => className.includes('text-shadow-badge')))
})
