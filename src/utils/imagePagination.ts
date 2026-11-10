/**
 * 要素の順序を維持し、測定した高さが上限内になるページへ振り分ける。
 *
 * @param blocks - 途中で分割しない表示要素。
 * @param maxHeight - 余白とページ番号を含む高さ上限。
 * @param measureHeight - 指定した要素を並べたページの高さを返す処理。
 * @returns 先頭ページを含むページごとの要素配列。
 */
export const paginateImageBlocks = <T>(
  blocks: readonly T[],
  maxHeight: number,
  measureHeight: (blocks: readonly T[], pageIndex: number) => number
): T[][] => {
  const pages: T[][] = [[]]
  if (measureHeight([], 0) > maxHeight) throw new Error('Image introduction exceeds page height')

  for (const block of blocks) {
    let pageIndex = pages.length - 1
    let page = pages[pageIndex]
    if (measureHeight([...page, block], pageIndex) > maxHeight) {
      pageIndex += 1
      page = []
      pages.push(page)
      if (measureHeight([block], pageIndex) > maxHeight) {
        throw new Error('Image block exceeds page height')
      }
    }
    page.push(block)
  }
  return pages
}
