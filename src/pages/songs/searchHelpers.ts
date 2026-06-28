import {
  matchesNormalizedSearchQuery,
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../utils/searchUtils.ts'

type SearchableItem<T> = {
  item: T
  normalizedTitle: string
  normalizedArtist: string
  normalizedReading: string
}

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
