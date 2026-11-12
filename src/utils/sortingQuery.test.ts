import assert from 'node:assert/strict'
import test from 'node:test'

import { nextSortState, parseSortQuery, sanitizeSortQuery } from './sortingQuery.ts'

test('対応表と同名の列は指定されたソート方向で使う', () => {
  // Given: 列名とソートキーが同じ対応表と既定ソート。
  const sortColMap = { score: 'score', rating: 'rating' } as const
  const fallback = { sortKey: 'rating', sortDirection: 'desc' } as const

  // When: 対応表にある列の昇順を指定する。
  const result = parseSortQuery({ sortcol: 'score', sortorder: 'asc' }, sortColMap, fallback)

  // Then: 指定された列と昇順を使う。
  assert.deepEqual(result, { sortKey: 'score', sortDirection: 'asc' })
})

test('対応表で名前が変わる列は変換後のキーで指定ソートを使う', () => {
  // Given: クエリの列名と画面内のソートキーが異なる対応表。
  const sortColMap = { score: 'score', updated_at: 'updatedAt' } as const
  const fallback = { sortKey: 'score', sortDirection: 'desc' } as const

  // When: クエリ上の列名で降順を指定する。
  const result = parseSortQuery({ sortcol: 'updated_at', sortorder: 'desc' }, sortColMap, fallback)

  // Then: 画面内のキーへ変換し、指定された降順を使う。
  assert.deepEqual(result, { sortKey: 'updatedAt', sortDirection: 'desc' })
})

test('対応表の自前プロパティでない sortcol は既定ソートへ戻す', () => {
  // Given: 通常オブジェクトの対応表。toString などはプロトタイプ上にだけある
  const sortColMap = { score: 'score', rating: 'rating', updated_at: 'updatedAt' } as const
  const normalRecordFallback = { sortKey: 'rating', sortDirection: 'desc' } as const
  const worldsendFallback = { sortKey: 'score', sortDirection: 'desc' } as const
  const invalidSortCols = ['toString', 'constructor', '__proto__', 'not-a-column'] as const

  for (const sortcol of invalidSortCols) {
    // When: 継承プロパティ、または未登録の列名を指定する
    const normalRecordResult = parseSortQuery(
      { sortcol, sortorder: 'asc' },
      sortColMap,
      normalRecordFallback
    )
    const worldsendResult = parseSortQuery(
      { sortcol, sortorder: 'desc' },
      sortColMap,
      worldsendFallback
    )

    // Then: 関数やオブジェクトを通さず、各画面の既定ソートを返す
    assert.deepEqual(normalRecordResult, normalRecordFallback)
    assert.deepEqual(worldsendResult, worldsendFallback)
  }
})

test('1列を3回クリックすると asc -> desc -> 解除 になる', () => {
  const first = nextSortState<string>(null, null, 'score')
  const second = nextSortState(first.sortKey, first.sortDirection, 'score')
  const third = nextSortState(second.sortKey, second.sortDirection, 'score')

  assert.deepEqual(first, { sortKey: 'score', sortDirection: 'asc' })
  assert.deepEqual(second, { sortKey: 'score', sortDirection: 'desc' })
  assert.deepEqual(third, { sortKey: null, sortDirection: null })
})

test('クエリ除去後もソート状態を保持できる', () => {
  const initial = parseSortQuery(
    { sortcol: 'score', sortorder: 'desc' },
    { score: 'score', rating: 'rating' } as const,
    { sortKey: 'rating', sortDirection: 'desc' }
  )

  let called = false
  sanitizeSortQuery({ sortcol: 'score', sortorder: 'desc' }, (params, options) => {
    called = true
    assert.deepEqual(params, { sortcol: undefined, sortorder: undefined })
    assert.deepEqual(options, { replace: true })
  })

  assert.equal(called, true)
  assert.deepEqual(initial, { sortKey: 'score', sortDirection: 'desc' })
})
