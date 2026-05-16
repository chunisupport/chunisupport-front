const symbolOrSpaceRegex = /[\p{P}\p{S}\p{Z}\p{Cf}]/gu
const voicedMarkRegex = /[\u3099\u309A]/gu
const prolongedSoundMarkRegex = /ー/g

/**
 * 検索用に文字列を正規化する。
 * - Unicode正規化（NFKC）
 * - 大文字を小文字に変換
 * - カタカナをひらがなに変換
 * - 記号・空白類を除去
 */
export function normalizeForSearch(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(symbolOrSpaceRegex, '')
}

export function normalizeForReadingSearch(value: string | null | undefined): string {
  if (!value) return ''
  return normalizeForSearch(
    value.normalize('NFD').replace(voicedMarkRegex, '').replace(prolongedSoundMarkRegex, 'ウ')
  )
}

export function matchesNormalizedSearchQuery(
  normalizedTitle: string,
  normalizedArtist: string,
  normalizedReading: string,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true
  return (
    normalizedTitle.includes(normalizedQuery) ||
    normalizedArtist.includes(normalizedQuery) ||
    normalizedReading.includes(normalizedQuery)
  )
}

/**
 * タイトルとアーティスト名のどちらかが検索クエリに部分一致するか判定する。
 */
export function matchesSearchQuery(
  title: string,
  artist: string,
  query: string,
  reading?: string | null
): boolean {
  const normalizedQuery = normalizeForSearch(query)
  const normalizedReadingQuery = normalizeForReadingSearch(query)
  const normalizedTitle = normalizeForSearch(title)
  const normalizedArtist = normalizeForSearch(artist)
  const normalizedReading = normalizeForReadingSearch(reading ?? title)
  return (
    matchesNormalizedSearchQuery(
      normalizedTitle,
      normalizedArtist,
      normalizedReading,
      normalizedQuery
    ) || normalizedReading.includes(normalizedReadingQuery)
  )
}
