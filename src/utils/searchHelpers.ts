import {
  matchesNormalizedSearchQuery,
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from './searchUtils'

/** 検索用に正規化した文字列を持つ要素 */
type SearchableItem<T> = {
  item: T
  normalizedTitle: string
  normalizedArtist: string
  normalizedReading: string
}

/**
 * 曲名・アーティスト名・読みを正規化し、検索用の要素一覧を作る。
 * 読みが未設定なら曲名を読みとして扱う。
 *
 * @param items 検索対象の要素
 * @returns 正規化済み文字列を付けた要素一覧
 */
export const buildSearchableItems = <
  T extends { title: string; artist: string; reading?: string | null },
>(
  items: T[]
): SearchableItem<T>[] => {
  return items.map((item) => ({
    item,
    normalizedTitle: normalizeForSearch(item.title),
    normalizedArtist: normalizeForSearch(item.artist),
    normalizedReading: normalizeForReadingSearch(item.reading?.trim() ? item.reading : item.title),
  }))
}

/**
 * 検索文字列に一致する要素だけを返す。
 *
 * @param searchableItems 正規化済みの検索対象
 * @param query 入力された検索文字列
 * @returns 一致した要素
 */
export const filterSearchableItems = <T>(
  searchableItems: SearchableItem<T>[],
  query: string
): T[] => {
  const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(query)
  return searchableItems
    .filter(({ normalizedTitle, normalizedArtist, normalizedReading }) =>
      matchesNormalizedSearchQuery(
        normalizedTitle,
        normalizedArtist,
        normalizedReading,
        normalizedQuery,
        normalizedReadingQuery
      )
    )
    .map(({ item }) => item)
}
