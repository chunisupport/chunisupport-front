import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveCourseClassEmblemName } from './courseClassDisplay.ts'

test('Ⅰ〜Ⅴと∞のコースクラスはエンブレム名へ変換されること', () => {
  // Given: エンブレム表示対象のコースクラス（大文字を含む）。
  const courseClasses = ['1', '2', '3', '4', '5', 'inf', 'INF']

  // When: エンブレム名へ変換する。
  const result = courseClasses.map(resolveCourseClassEmblemName)

  // Then: 小文字のマスタ名が返る。
  assert.deepEqual(result, ['1', '2', '3', '4', '5', 'inf', 'inf'])
})

test('EXと未対応値のコースクラスはエンブレム対象外になること', () => {
  // Given: EXと未対応のコースクラス。
  const courseClasses = ['extra', 'EXTRA', 'unknown']

  // When: エンブレム名へ変換する。
  const result = courseClasses.map(resolveCourseClassEmblemName)

  // Then: すべて null が返る。
  assert.deepEqual(result, [null, null, null])
})
