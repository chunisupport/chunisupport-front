import assert from 'node:assert/strict'
import test from 'node:test'
import type { AdminHonorDTO } from '../types/api'
import {
  buildAdminHonorImageHref,
  filterAndSortAdminHonors,
  formatAdminHonorCreatedAt,
  nextAdminHonorSort,
} from './adminHonorsList'

const honors: AdminHonorDTO[] = [
  { id: 2, name: '東方の称号', type_name: 'gold', image_url: '', created_at: null },
  { id: 5, name: '東方達人', type_name: 'normal', image_url: '', created_at: null },
  { id: 3, name: '別の称号', type_name: 'gold', image_url: '', created_at: null },
]

test('画像名とフルURLから公式画像リンクを作る', () => {
  assert.equal(
    buildAdminHonorImageHref('honor image.png'),
    'https://new.chunithm-net.com/chuni-mobile/html/mobile/img/honor%20image.png'
  )
  assert.equal(
    buildAdminHonorImageHref('https://example.com/honors/sample.png?size=1'),
    'https://new.chunithm-net.com/chuni-mobile/html/mobile/img/sample.png'
  )
})

test('称号名の部分一致検索とクラス絞り込みを組み合わせられる', () => {
  const result = filterAndSortAdminHonors(honors, '東方', 'gold', 'id-desc')

  assert.deepEqual(
    result.map((honor) => honor.id),
    [2]
  )
})

test('検索は全角半角と前後の空白を正規化する', () => {
  const result = filterAndSortAdminHonors(
    [{ ...honors[0], name: 'ＡＢＣ称号' }],
    '  abc  ',
    null,
    'id-desc'
  )

  assert.deepEqual(
    result.map((honor) => honor.id),
    [2]
  )
})

test('4種類の並べ替えを適用し、元配列は変更しない', () => {
  const originalIds = honors.map((honor) => honor.id)

  const idDesc = filterAndSortAdminHonors(honors, '', null, 'id-desc')
  const idAsc = filterAndSortAdminHonors(honors, '', null, 'id-asc')
  const nameAsc = filterAndSortAdminHonors(honors, '', null, 'name-asc')
  const nameDesc = filterAndSortAdminHonors(honors, '', null, 'name-desc')

  assert.deepEqual(
    idDesc.map((honor) => honor.id),
    [5, 3, 2]
  )
  assert.deepEqual(
    idAsc.map((honor) => honor.id),
    [2, 3, 5]
  )
  assert.deepEqual(
    nameAsc.map((honor) => honor.id),
    [2, 5, 3]
  )
  assert.deepEqual(
    nameDesc.map((honor) => honor.id),
    [3, 5, 2]
  )
  assert.deepEqual(
    honors.map((honor) => honor.id),
    originalIds
  )
})

test('登録日時を日本時間で表示し、日時がない場合はハイフンを返す', () => {
  assert.equal(formatAdminHonorCreatedAt('2026-09-22T03:04:00Z'), '2026/09/22 12:04')
  assert.equal(formatAdminHonorCreatedAt(null), '-')
  assert.equal(formatAdminHonorCreatedAt('invalid'), '-')
})

test('登録日時順はタイムゾーンを考慮し、日時がない称号を末尾に置く', () => {
  const datedHonors: AdminHonorDTO[] = [
    { ...honors[0], created_at: '2026-09-22T12:00:00+09:00' },
    { ...honors[1], created_at: '2026-09-22T02:00:00Z' },
    { ...honors[2], created_at: null },
  ]

  assert.deepEqual(
    filterAndSortAdminHonors(datedHonors, '', null, 'created-at-desc').map((honor) => honor.id),
    [2, 5, 3]
  )
  assert.deepEqual(
    filterAndSortAdminHonors(datedHonors, '', null, 'created-at-asc').map((honor) => honor.id),
    [5, 2, 3]
  )
})

test('見出しをクリックすると列の初期方向を選び、同じ列では方向を切り替える', () => {
  assert.equal(nextAdminHonorSort('id-desc', 'name'), 'name-asc')
  assert.equal(nextAdminHonorSort('name-asc', 'name'), 'name-desc')
  assert.equal(nextAdminHonorSort('name-desc', 'name'), 'name-asc')
  assert.equal(nextAdminHonorSort('name-asc', 'created-at'), 'created-at-desc')
  assert.equal(nextAdminHonorSort('name-asc', 'id'), 'id-desc')
})

test('クラスと画像URLでも昇順・降順に並べ替えられる', () => {
  const values: AdminHonorDTO[] = [
    { ...honors[0], type_name: 'silver', image_url: 'z.png' },
    { ...honors[1], type_name: 'gold', image_url: 'a.png' },
    { ...honors[2], type_name: 'normal', image_url: 'm.png' },
  ]

  assert.deepEqual(
    filterAndSortAdminHonors(values, '', null, 'type-asc').map((honor) => honor.id),
    [5, 3, 2]
  )
  assert.deepEqual(
    filterAndSortAdminHonors(values, '', null, 'type-desc').map((honor) => honor.id),
    [2, 3, 5]
  )
  assert.deepEqual(
    filterAndSortAdminHonors(values, '', null, 'image-url-asc').map((honor) => honor.id),
    [5, 3, 2]
  )
  assert.deepEqual(
    filterAndSortAdminHonors(values, '', null, 'image-url-desc').map((honor) => honor.id),
    [2, 3, 5]
  )
})
