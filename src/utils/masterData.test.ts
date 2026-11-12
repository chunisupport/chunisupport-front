import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MasterItemDTO } from '../types/api.ts'
import {
  compareMasterItemNames,
  compareMasterItemNamesKeepingUnknownLast,
  createMasterItemOrderMap,
  sortMasterItemsBySortOrder,
} from './masterData.ts'

const genres: MasterItemDTO[] = [
  { id: 3, name: '東方Project', sort_order: 30 },
  { id: 1, name: 'POPS & ANIME', sort_order: 10 },
  { id: 2, name: 'niconico', sort_order: 20 },
]

test('マスタ項目をsort_order順に並べる', () => {
  assert.deepEqual(
    sortMasterItemsBySortOrder(genres).map((genre) => genre.name),
    ['POPS & ANIME', 'niconico', '東方Project']
  )
})

test('マスタ順序にない名称は末尾で日本語順に並べる', () => {
  // Given: 未知項目も既知項目も期待順とは異なる順序で入力する。
  const orderMap = createMasterItemOrderMap(genres)

  // When
  const sorted = ['い', 'VARIETY', '東方Project', 'あ', 'POPS & ANIME'].sort((left, right) =>
    compareMasterItemNames(left, right, orderMap)
  )

  // Then: 未知項目は既知項目の後ろで日本語順に並ぶ。
  assert.deepEqual(sorted, ['POPS & ANIME', '東方Project', 'VARIETY', 'あ', 'い'])
})

test('sort_order順がid順と異なる場合はsort_order順に並べる', () => {
  // Given: id順とsort_order順が逆になるマスタ項目。
  const items: MasterItemDTO[] = [
    { id: 3, name: 'aaa', sort_order: 10 },
    { id: 1, name: 'bbb', sort_order: 30 },
    { id: 2, name: 'ccc', sort_order: 20 },
  ]

  // When: sort_order順に並べる。
  const sorted = sortMasterItemsBySortOrder(items).map((item) => item.name)

  // Then: sort_orderの昇順になる。
  assert.deepEqual(sorted, ['aaa', 'ccc', 'bbb'])
})

test('sort_orderが同じ場合はid順に並べる', () => {
  // Given: sort_orderが同じでid順と名称順が逆の項目。
  const items: MasterItemDTO[] = [
    { id: 2, name: 'a', sort_order: 10 },
    { id: 1, name: 'b', sort_order: 10 },
  ]

  // When: sort_order順に並べる。
  const sorted = sortMasterItemsBySortOrder(items).map((item) => item.name)

  // Then: idの昇順になる。
  assert.deepEqual(sorted, ['b', 'a'])
})

test('sort_orderとidが同じ場合は名称順に並べる', () => {
  // Given: sort_orderとidが同じで入力順と名称順が逆の項目。
  const items: MasterItemDTO[] = [
    { id: 1, name: 'b', sort_order: 10 },
    { id: 1, name: 'a', sort_order: 10 },
  ]

  // When: sort_order順に並べる。
  const sorted = sortMasterItemsBySortOrder(items).map((item) => item.name)

  // Then: 名称の昇順になる。
  assert.deepEqual(sorted, ['a', 'b'])
})

test('マスタにない項目は昇順・降順とも末尾へ固定する', () => {
  const orderMap = createMasterItemOrderMap(genres)

  const ascending = ['VARIETY', '東方Project', 'POPS & ANIME'].sort((left, right) =>
    compareMasterItemNamesKeepingUnknownLast(left, right, orderMap, 'asc')
  )
  const descending = ['VARIETY', '東方Project', 'POPS & ANIME'].sort((left, right) =>
    compareMasterItemNamesKeepingUnknownLast(left, right, orderMap, 'desc')
  )

  assert.deepEqual(ascending, ['POPS & ANIME', '東方Project', 'VARIETY'])
  assert.deepEqual(descending, ['東方Project', 'POPS & ANIME', 'VARIETY'])
})
