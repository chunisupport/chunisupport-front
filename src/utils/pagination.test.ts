import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPaginationItems, resolvePagedListTotalPages } from './pagination.ts'

test('総件数がある場合はページサイズで割った総ページ数を返すこと', () => {
  // Given: 250件を100件ずつ表示する。
  const options = { currentPage: 1, pageSize: 100, itemCount: 100, totalCount: 250 }

  // When: 総ページ数を求める。
  const result = resolvePagedListTotalPages(options)

  // Then: 3ページになる。
  assert.equal(result, 3)
})

test('総件数が0の場合は1ページとして扱うこと', () => {
  // Given: 総件数が0件。
  const options = { currentPage: 1, pageSize: 100, itemCount: 0, totalCount: 0 }

  // When: 総ページ数を求める。
  const result = resolvePagedListTotalPages(options)

  // Then: 1ページになる。
  assert.equal(result, 1)
})

test('総件数がページサイズちょうどの場合は1ページになること', () => {
  // Given: 総件数が100件でページサイズも100。
  const options = { currentPage: 1, pageSize: 100, itemCount: 100, totalCount: 100 }

  // When: 総ページ数を求める。
  const result = resolvePagedListTotalPages(options)

  // Then: 1ページになる。
  assert.equal(result, 1)
})

test('総件数がない場合は満件なら次ページありと推定すること', () => {
  // Given: 総件数なしで1ページ目が満件。
  const options = { currentPage: 1, pageSize: 100, itemCount: 100 }

  // When: 総ページ数を求める。
  const result = resolvePagedListTotalPages(options)

  // Then: 次ページを含む2になる。
  assert.equal(result, 2)
})

test('総件数がない場合は満件未満なら現在ページを最終とすること', () => {
  // Given: 総件数なしで1ページ目が40件。
  const options = { currentPage: 1, pageSize: 100, itemCount: 40 }

  // When: 総ページ数を求める。
  const result = resolvePagedListTotalPages(options)

  // Then: 現在の1ページだけになる。
  assert.equal(result, 1)
})

test('総件数がなく現在ページが空でも現在ページ番号を維持すること', () => {
  // Given: 総件数なしで3ページ目が0件。
  const options = { currentPage: 3, pageSize: 100, itemCount: 0 }

  // When: 総ページ数を求める。
  const result = resolvePagedListTotalPages(options)

  // Then: 現在ページの3を返す。
  assert.equal(result, 3)
})

test('総ページ数が少ない場合はすべての番号を並べること', () => {
  // Given: 7ページ中4ページ目。
  const currentPage = 4
  const totalPages = 7

  // When: 表示項目を生成する。
  const result = buildPaginationItems(currentPage, totalPages)

  // Then: 1から7までがすべて並ぶ。
  assert.deepEqual(
    result,
    [1, 2, 3, 4, 5, 6, 7].map((page) => ({ type: 'page', page }))
  )
})

test('先頭付近では右側だけ省略記号を出すこと', () => {
  // Given: 10ページ中1ページ目。
  const currentPage = 1
  const totalPages = 10

  // When: 表示項目を生成する。
  const result = buildPaginationItems(currentPage, totalPages)

  // Then: 先頭5件と末尾ページが並ぶ。
  assert.deepEqual(result, [
    { type: 'page', page: 1 },
    { type: 'page', page: 2 },
    { type: 'page', page: 3 },
    { type: 'page', page: 4 },
    { type: 'page', page: 5 },
    { type: 'ellipsis', key: 'end' },
    { type: 'page', page: 10 },
  ])
})

test('末尾付近では左側だけ省略記号を出すこと', () => {
  // Given: 10ページ中10ページ目。
  const currentPage = 10
  const totalPages = 10

  // When: 表示項目を生成する。
  const result = buildPaginationItems(currentPage, totalPages)

  // Then: 先頭ページと末尾5件が並ぶ。
  assert.deepEqual(result, [
    { type: 'page', page: 1 },
    { type: 'ellipsis', key: 'start' },
    { type: 'page', page: 6 },
    { type: 'page', page: 7 },
    { type: 'page', page: 8 },
    { type: 'page', page: 9 },
    { type: 'page', page: 10 },
  ])
})

test('中間ページでは左右に省略記号を出すこと', () => {
  // Given: 10ページ中5ページ目。
  const currentPage = 5
  const totalPages = 10

  // When: 表示項目を生成する。
  const result = buildPaginationItems(currentPage, totalPages)

  // Then: 先頭・現在付近・末尾が省略記号付きで並ぶ。
  assert.deepEqual(result, [
    { type: 'page', page: 1 },
    { type: 'ellipsis', key: 'start' },
    { type: 'page', page: 4 },
    { type: 'page', page: 5 },
    { type: 'page', page: 6 },
    { type: 'ellipsis', key: 'end' },
    { type: 'page', page: 10 },
  ])
})
