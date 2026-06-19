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
