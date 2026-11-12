import assert from 'node:assert/strict'
import test from 'node:test'
import { paginateImageBlocks } from './imagePagination'

/**
 * 先頭ページの集計とページ余白を含む高さを算出する。
 *
 * @param blocks - カードの高さ。
 * @param pageIndex - 0から始まるページ番号。
 * @returns 集計・カード・余白を含む高さ。
 */
const measureHeight = (blocks: readonly number[], pageIndex: number): number =>
  40 + (pageIndex === 0 ? 500 : 0) + blocks.reduce((sum, height) => sum + height, 0)

test('短い差分は集計を含む1枚に収まる', () => {
  // Given: 集計と2枚のカードが高さ上限内に収まる。
  const blocks = [100, 100]
  // When: 画像のページを決める。
  const pages = paginateImageBlocks(blocks, 1_200, measureHeight)
  // Then: 順序を維持して1枚へ配置される。
  assert.deepEqual(pages, [[100, 100]])
})

test('高さ上限と等しいカードはそのページに含め、次のカードから改ページする', () => {
  // Given: 最初の3枚と集計の合計が上限に等しい。
  const blocks = [200, 200, 260, 100, 300, 400, 500]
  // When: ページ番号領域を含めて改ページする。
  const pages = paginateImageBlocks(blocks, 1_200, measureHeight)
  // Then: カードを切らず、集計は1枚目のみとして順番に振り分ける。
  assert.deepEqual(pages, [[200, 200, 260], [100, 300, 400], [500]])
  assert.deepEqual(pages.flat(), blocks)
})

test('見出しと最初のカードのまとまりが入らなければ集計だけを先頭ページに残す', () => {
  // Given: 見出し込みのカードは後続ページには収まる。
  const blocks = [800]
  // When: 集計とは分けて改ページする。
  const pages = paginateImageBlocks(blocks, 1_200, measureHeight)
  // Then: 見出しとカードは一緒に次ページへ移る。
  assert.deepEqual(pages, [[], [800]])
})

test('集計の高さが上限と等しい場合は先頭ページを生成できること', () => {
  // Given: 空ページの高さが上限と等しい。
  const exactHeight = (): number => 1200

  // When
  const pages = paginateImageBlocks([], 1200, exactHeight)

  // Then: 等しい場合も上限内として扱う。
  assert.deepEqual(pages, [[]])
})

test('高さが上限と等しいカードは同じページに含めること', () => {
  // Given: 合計が上限と等しくなるカード。
  const totalHeight = (blocks: readonly number[]): number =>
    blocks.reduce((sum, height) => sum + height, 0)

  // When
  const pages = paginateImageBlocks([60, 40], 100, totalHeight)

  // Then: 等しい場合も上限内として同じページに残る。
  assert.deepEqual(pages, [[60, 40]])
})

test('カードがなくても集計のページを1枚生成する', () => {
  // Given: 画像に含めるカードがない。
  // When: ページ分割する。
  const pages = paginateImageBlocks([], 1_200, measureHeight)
  // Then: 空の追加ページを作らない。
  assert.deepEqual(pages, [[]])
})

test('集計やカード単体が高さ上限を超える場合は巨大な画像を生成しない', () => {
  // Given: 上限を超える単体要素。
  // When & Then: 集計やカードを縮小せず生成エラーにする。
  assert.throws(() => paginateImageBlocks([], 500, measureHeight), /introduction exceeds/)
  assert.throws(() => paginateImageBlocks([1_200], 1_200, measureHeight), /block exceeds/)
})
