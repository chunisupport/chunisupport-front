import {
  matchesNormalizedSearchQuery,
  normalizeForReadingSearch,
  normalizeForSearch,
} from '../../utils/searchUtils'

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
    normalizedReading: normalizeForReadingSearch(item.reading ?? item.title),
  }))
}

export const filterSearchableItems = <T>(
  searchableItems: SearchableItem<T>[],
  query: string
): T[] => {
  const normalizedQuery = normalizeForSearch(query)
  const normalizedReadingQuery = normalizeForReadingSearch(query)
  return searchableItems
    .filter(
      ({ normalizedTitle, normalizedArtist, normalizedReading }) =>
        matchesNormalizedSearchQuery(
          normalizedTitle,
          normalizedArtist,
          normalizedReading,
          normalizedQuery
        ) || normalizedReading.includes(normalizedReadingQuery)
    )
    .map(({ item }) => item)
}
