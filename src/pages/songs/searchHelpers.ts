import { matchesNormalizedSearchQuery, normalizeForSearch } from '../../utils/searchUtils'

type SearchableItem<T> = {
  item: T
  normalizedTitle: string
  normalizedArtist: string
}

export const buildSearchableItems = <T extends { title: string; artist: string }>(
  items: T[]
): SearchableItem<T>[] => {
  return items.map((item) => ({
    item,
    normalizedTitle: normalizeForSearch(item.title),
    normalizedArtist: normalizeForSearch(item.artist),
  }))
}

export const filterSearchableItems = <T>(
  searchableItems: SearchableItem<T>[],
  query: string
): T[] => {
  const normalizedQuery = normalizeForSearch(query)
  return searchableItems
    .filter(({ normalizedTitle, normalizedArtist }) =>
      matchesNormalizedSearchQuery(normalizedTitle, normalizedArtist, normalizedQuery)
    )
    .map(({ item }) => item)
}
