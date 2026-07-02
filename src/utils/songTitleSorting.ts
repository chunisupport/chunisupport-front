/** 読み順ソートに必要な楽曲情報。 */
export type SongTitleSortItem = {
  title: string
  reading?: string | null
}

const jaCollator = new Intl.Collator('ja')

const READING_CATEGORY = {
  KATAKANA: 0,
  ALPHABET: 1,
  NUMBER: 2,
  OTHER: 3,
} as const

/**
 * 楽曲の読みをソート用に正規化する。
 *
 * @param song - 読み順の比較対象となる楽曲。
 * @returns 前後の空白を除去してNFKC正規化した読み。未設定の場合は空文字。
 */
const getNormalizedReading = (song: SongTitleSortItem): string =>
  song.reading?.trim().normalize('NFKC') ?? ''

/**
 * reading の先頭文字からソート分類を取得する。
 *
 * @param reading - 正規化済みの読み。
 * @returns カタカナ、英字、数字、その他・未設定の順序値。
 */
const getReadingCategory = (reading: string): number => {
  if (/^[\u30a0-\u30ff]/u.test(reading)) return READING_CATEGORY.KATAKANA
  if (/^[A-Za-z]/u.test(reading)) return READING_CATEGORY.ALPHABET
  if (/^[0-9]/u.test(reading)) return READING_CATEGORY.NUMBER
  return READING_CATEGORY.OTHER
}

/**
 * 楽曲を reading の日本語辞書順で比較する。
 *
 * reading が未設定の場合は title を使用し、読みが同じ場合は title で順序を確定する。
 *
 * @param left - 左側の楽曲。
 * @param right - 右側の楽曲。
 * @returns 左が先なら負、右が先なら正、同順なら0。
 */
export const compareSongsByReading = (
  left: SongTitleSortItem,
  right: SongTitleSortItem
): number => {
  const leftReading = getNormalizedReading(left)
  const rightReading = getNormalizedReading(right)
  const categoryComparison = getReadingCategory(leftReading) - getReadingCategory(rightReading)
  if (categoryComparison !== 0) return categoryComparison

  const readingComparison = jaCollator.compare(leftReading, rightReading)
  return readingComparison || jaCollator.compare(left.title, right.title)
}
