const symbolOrSpaceRegex = /[\p{P}\p{S}\p{Z}\p{Cf}]/gu

/**
 * 検索用に文字列を正規化する。
 * - Unicode正規化（NFKC）
 * - 大文字を小文字に変換
 * - カタカナをひらがなに変換
 * - 記号・空白類を除去
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(symbolOrSpaceRegex, '')
}

/**
 * タイトルとアーティスト名のどちらかが検索クエリに部分一致するか判定する。
 */
export function matchesSearchQuery(title: string, artist: string, query: string): boolean {
  const normalizedQuery = normalizeForSearch(query)
  if (!normalizedQuery) return true

  const normalizedTitle = normalizeForSearch(title)
  const normalizedArtist = normalizeForSearch(artist)

  return normalizedTitle.includes(normalizedQuery) || normalizedArtist.includes(normalizedQuery)
}
