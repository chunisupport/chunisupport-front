import assert from 'node:assert/strict'
import test from 'node:test'

import {
  courseClassBadgeClass,
  formatCourseClass,
  formatWorldsendChartLevel,
} from './registerScoreDisplay.ts'

test('コースクラスをレポート用の短縮表記へ変換すること', () => {
  // Given: APIが返す全コースクラス。
  const courseClasses = ['1', '2', '3', '4', '5', 'inf', 'extra']

  // When: レポート表示用に変換する。
  const result = courseClasses.map(formatCourseClass)

  // Then: ローマ数字・無限大・EXで表示される。
  assert.deepEqual(result, ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', '∞', 'EX'])
})

test('コースクラスの英字値は大文字小文字を区別せず変換すること', () => {
  // Given: 大文字を含むAPI値。
  const courseClass = 'INF'

  // When: レポート表示用に変換する。
  const result = formatCourseClass(courseClass)

  // Then: 無限大の表記になる。
  assert.equal(result, '∞')
})

test('未対応のコースクラスは元の値で表示すること', () => {
  // Given: 未知のコースクラス。
  const courseClass = 'special'

  // When: レポート表示用に変換する。
  const result = formatCourseClass(courseClass)

  // Then: 情報を失わず元の値を表示する。
  assert.equal(result, 'special')
})

test('WORLD’S ENDの星数レベルを星付きで表示すること', () => {
  // Given: 最小・最大の星数レベル。
  const levelStars = [1, 5]

  // When: レポート表示用に変換する。
  const result = levelStars.map(formatWorldsendChartLevel)

  // Then: 星を付けたレベルで表示される。
  assert.deepEqual(result, ['★1', '★5'])
})

test('コースクラス別のバッジクラスが正しく返ること', () => {
  // Given: 全コースクラスと期待される背景クラス。
  const expectations: Readonly<Record<string, string>> = {
    '1': 'bg-course-class-1-bg',
    '2': 'bg-course-class-2-bg',
    '3': 'bg-course-class-3-bg',
    '4': 'bg-course-class-4-bg',
    '5': 'bg-course-class-5-bg',
  }

  for (const [courseClass, expectedBg] of Object.entries(expectations)) {
    // When: バッジクラスを取得する。
    const result = courseClassBadgeClass(courseClass)

    // Then: 背景クラスと黄色文字クラスが含まれる。
    assert.ok(result.includes(expectedBg), `${courseClass}: ${expectedBg} を含むはず`)
    assert.ok(result.includes('text-course-class-text'), `${courseClass}: 黄色文字クラスを含むはず`)
  }
})

test("コースクラス EX はWORLD'S ENDと同じ虹グラデーション背景になること", () => {
  // Given: extraクラス。
  const courseClass = 'extra'

  // When: バッジクラスを取得する。
  const result = courseClassBadgeClass(courseClass)

  // Then: 虹グラデーションと黄色文字クラスが含まれる。
  assert.ok(result.includes('bg-[image:var(--cs-color-worldsend-label-bg)]'))
  assert.ok(result.includes('text-course-class-text'))
})

test('コースクラス ∞ はAJCと同じ薄い虹グラデーション背景になること', () => {
  // Given: infクラス。
  const courseClass = 'inf'

  // When: バッジクラスを取得する。
  const result = courseClassBadgeClass(courseClass)

  // Then: 薄い虹グラデーションと黄色文字クラスが含まれる。
  assert.ok(result.includes('bg-[image:var(--cs-color-course-class-inf-bg)]'))
  assert.ok(result.includes('text-course-class-text'))
})

test('未対応のコースクラスはsuccess色バッジを返すこと', () => {
  // Given: 未知のコースクラス。
  const courseClass = 'special'

  // When: バッジクラスを取得する。
  const result = courseClassBadgeClass(courseClass)

  // Then: デフォルトのsuccess色クラスが返る。
  assert.ok(result.includes('bg-success-bg'))
  assert.ok(result.includes('text-success'))
})
