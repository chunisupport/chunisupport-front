/**
 * 検索用に文字列を正規化する。
 * - 大文字を小文字に変換
 * - カタカナをひらがなに変換
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

/**
 * タイトルが検索クエリに部分一致するか判定する。
 */
export function matchesSearchQuery(title: string, query: string): boolean {
  if (!query.trim()) return true
  const normalizedTitle = normalizeForSearch(title)
  const normalizedQuery = normalizeForSearch(query.trim())
  return normalizedTitle.includes(normalizedQuery)
}
