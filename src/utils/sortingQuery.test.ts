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

test('対応表と同名の列は指定された降順で使う', () => {
  // Given: 列名とソートキーが同じ対応表と、別の列を使う既定ソート。
  const sortColMap = { score: 'score', rating: 'rating' } as const
  const fallback = { sortKey: 'rating', sortDirection: 'desc' } as const

  // When: 旧クエリでscore列の降順を指定する。
  const result = parseSortQuery({ sortcol: 'score', sortorder: 'desc' }, sortColMap, fallback)

  // Then: 既定のrating列ではなく、指定されたscore列の降順を使う。
  assert.deepEqual(result, { sortKey: 'score', sortDirection: 'desc' })
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

test('旧ソートクエリをreplaceで除去する', () => {
  // Given: 旧形式のソートクエリが残ったURL
  const calls: unknown[] = []

  // When: 旧ソートクエリを除去する
  sanitizeSortQuery({ sortcol: 'score', sortorder: 'desc' }, (params, options) => {
    calls.push({ params, options })
  })

  // Then: 履歴を増やさないreplaceで、sortcolとsortorderだけを消す更新を1回要求する
  assert.deepEqual(calls, [
    { params: { sortcol: undefined, sortorder: undefined }, options: { replace: true } },
  ])
})

test('sortcolだけが残っていても旧クエリを除去する', () => {
  // Given: sortcolだけが残ったURL。
  const calls: unknown[] = []

  // When: 旧ソートクエリを除去する。
  sanitizeSortQuery({ sortcol: 'score' }, (params, options) => {
    calls.push({ params, options })
  })

  // Then: 片方だけでもreplaceで除去を1回要求する。
  assert.deepEqual(calls, [
    { params: { sortcol: undefined, sortorder: undefined }, options: { replace: true } },
  ])
})

test('sortorderだけが残っていても旧クエリを除去する', () => {
  // Given: sortorderだけが残ったURL。
  const calls: unknown[] = []

  // When: 旧ソートクエリを除去する。
  sanitizeSortQuery({ sortorder: 'desc' }, (params, options) => {
    calls.push({ params, options })
  })

  // Then: 片方だけでもreplaceで除去を1回要求する。
  assert.deepEqual(calls, [
    { params: { sortcol: undefined, sortorder: undefined }, options: { replace: true } },
  ])
})

test('旧ソートクエリがなければ何もしないこと', () => {
  // Given: 旧クエリのないURL。
  const calls: unknown[] = []

  // When: 除去を試みる。
  sanitizeSortQuery({}, (params, options) => {
    calls.push({ params, options })
  })

  // Then: 更新を要求しない。
  assert.deepEqual(calls, [])
})
