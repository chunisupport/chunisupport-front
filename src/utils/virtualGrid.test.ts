import assert from 'node:assert/strict'
import test from 'node:test'
import { getVirtualGridRowCount, getVirtualGridRowSlice } from './virtualGrid'

test('グリッド行数は列数で切り上げること', () => {
  // Given: 5件を2列で並べる。
  const itemCount = 5
  const columnCount = 2

  // When: 行数を求める。
  const rowCount = getVirtualGridRowCount(itemCount, columnCount)

  // Then: 最後の行が1件でも3行になる。
  assert.equal(rowCount, 3)
  assert.equal(getVirtualGridRowCount(0, 2), 0)
  assert.equal(getVirtualGridRowCount(4, 0), 0)
})

test('仮想行のスライスは列数分だけ切り出すこと', () => {
  // Given: 5件の識別子。
  const items = ['a', 'b', 'c', 'd', 'e']

  // When: 2列グリッドの各行を切り出す。
  const firstRow = getVirtualGridRowSlice(items, 0, 2)
  const lastRow = getVirtualGridRowSlice(items, 2, 2)

  // Then: 先頭行は2件、最終行は余り1件。
  assert.deepEqual(firstRow, ['a', 'b'])
  assert.deepEqual(lastRow, ['e'])
  assert.deepEqual(getVirtualGridRowSlice(items, 0, 0), [])
})

test('行インデックスが負の場合は列数にかかわらず空配列を返すこと', () => {
  // Given: 5件の識別子。
  const items = ['a', 'b', 'c', 'd', 'e']

  // When: 負の行インデックスで切り出す。
  const result = getVirtualGridRowSlice(items, -2, 2)

  // Then: 空配列になる。
  assert.deepEqual(result, [])
})
