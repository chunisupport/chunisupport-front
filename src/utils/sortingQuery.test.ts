import assert from 'node:assert/strict'
import test from 'node:test'

import { nextSortState, parseSortQuery, sanitizeSortQuery } from './sortingQuery.ts'

test('STANDARD: クエリあり初期表示は指定ソートを使う', () => {
  const result = parseSortQuery(
    { sortcol: 'score', sortorder: 'asc' },
    { score: 'score', rating: 'rating' } as const,
    { sortKey: 'rating', sortDirection: 'desc' }
  )

  assert.deepEqual(result, { sortKey: 'score', sortDirection: 'asc' })
})

test("WORLD'S END: クエリあり初期表示は指定ソートを使う", () => {
  const result = parseSortQuery(
    { sortcol: 'updated_at', sortorder: 'desc' },
    { score: 'score', updated_at: 'updatedAt' } as const,
    { sortKey: 'score', sortDirection: 'desc' }
  )

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
    assert.equal(typeof normalRecordResult.sortKey, 'string')
    assert.deepEqual(worldsendResult, worldsendFallback)
    assert.equal(typeof worldsendResult.sortKey, 'string')
  }
})

test('対応表の自前プロパティである sortcol は指定ソートを使う', () => {
  // Given
  const sortColMap = { score: 'score', rating: 'rating', updated_at: 'updatedAt' } as const
  const fallback = { sortKey: 'rating', sortDirection: 'desc' } as const

  // When
  const sameNameKey = parseSortQuery({ sortcol: 'score', sortorder: 'asc' }, sortColMap, fallback)
  const renamedKey = parseSortQuery(
    { sortcol: 'updated_at', sortorder: 'desc' },
    sortColMap,
    fallback
  )

  // Then
  assert.deepEqual(sameNameKey, { sortKey: 'score', sortDirection: 'asc' })
  assert.equal(typeof sameNameKey.sortKey, 'string')
  assert.deepEqual(renamedKey, { sortKey: 'updatedAt', sortDirection: 'desc' })
  assert.equal(typeof renamedKey.sortKey, 'string')
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
