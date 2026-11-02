import {
  matchesNormalizedSearchQuery,
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from './searchUtils'
import { normalizeSongReading } from './songReading'

/** 検索対象の曲名・アーティスト名・読みを持つ要素 */
type SearchTextSource = { title: string; artist: string; reading?: string | null }

/** 検索用に正規化した曲名・アーティスト名・読み */
export type NormalizedSearchText = {
  normalizedTitle: string
  normalizedArtist: string
  normalizedReading: string
}

/** 検索用に正規化した文字列を持つ要素 */
type SearchableItem<T> = NormalizedSearchText & { item: T }

/**
 * 曲名・アーティスト名・読みを検索用に正規化する。
 * 読みが未設定または空欄なら曲名を読みとして扱う。
 *
 * @param item 検索対象の要素
 * @returns 正規化済みの検索用文字列
 */
export const normalizeSearchText = (item: SearchTextSource): NormalizedSearchText => ({
  normalizedTitle: normalizeForSearch(item.title),
  normalizedArtist: normalizeForSearch(item.artist),
  normalizedReading: normalizeForReadingSearch(normalizeSongReading(item)),
})

/**
 * 要素ごとの正規化結果を WeakMap に保持し、同じ要素の再正規化を避ける取得関数を作る。
 * 要素オブジェクトが差し替わった場合は新しい要素として正規化し直す。
 *
 * @returns 要素から正規化済みの検索用文字列を返す関数
 */
export const createSearchTextCache = <T extends SearchTextSource>(): ((
  item: T
) => NormalizedSearchText) => {
  const cache = new WeakMap<T, NormalizedSearchText>()
  return (item) => {
    const cached = cache.get(item)
    if (cached) return cached
    const searchText = normalizeSearchText(item)
    cache.set(item, searchText)
    return searchText
  }
}

/**
 * 検索文字列に一致する正規化済み文字列かを判定する関数を作る。
 *
 * @param query 入力された検索文字列
 * @returns 判定関数。検索文字列が空なら常に true を返す
 */
export const createSearchTextMatcher = (
  query: string
): ((searchText: NormalizedSearchText) => boolean) => {
  const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(query)
  return ({ normalizedTitle, normalizedArtist, normalizedReading }) =>
    matchesNormalizedSearchQuery(
      normalizedTitle,
      normalizedArtist,
      normalizedReading,
      normalizedQuery,
      normalizedReadingQuery
    )
}

/**
 * 曲名・アーティスト名・読みを正規化し、検索用の要素一覧を作る。
 * 読みが未設定または空欄なら曲名を読みとして扱う。
 *
 * @param items 検索対象の要素
 * @returns 正規化済み文字列を付けた要素一覧
 */
export const buildSearchableItems = <T extends SearchTextSource>(
  items: T[]
): SearchableItem<T>[] => {
  return items.map((item) => ({ item, ...normalizeSearchText(item) }))
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
  const matches = createSearchTextMatcher(query)
  return searchableItems.filter(matches).map(({ item }) => item)
}
