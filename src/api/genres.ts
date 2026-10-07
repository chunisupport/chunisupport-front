import { API_BASE_URL } from '../config'
import type { GenreDTO } from '../types/api'
import { sortMasterItemsBySortOrder } from '../utils/masterData'
import { fetchWithAuth } from './fetchWithAuth'

let cachedGenres: GenreDTO[] | undefined
let genresPromise: Promise<GenreDTO[]> | undefined

/**
 * API からジャンル一覧を取得する。
 *
 * @returns 全マスタ取得時と同じ順序に並べたジャンル一覧。
 */
const fetchGenresFromApi = async (): Promise<GenreDTO[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/master/genres`)
  const { genres } = (await response.json()) as { genres?: GenreDTO[] }

  return sortMasterItemsBySortOrder(genres ?? [])
}

/**
 * セッション中にジャンル一覧を一度だけ取得し、メモリ上に保持する。
 * 同時呼び出しは同一リクエストにまとめ、失敗時は次回呼び出しで再取得する。
 *
 * @returns キャッシュ済み、または API から取得したジャンル一覧。
 */
export const fetchGenres = async (): Promise<GenreDTO[]> => {
  if (cachedGenres) {
    return cachedGenres
  }

  const responsePromise = genresPromise ?? fetchGenresFromApi()
  genresPromise = responsePromise

  try {
    const genres = await responsePromise
    if (genresPromise === responsePromise) {
      cachedGenres = genres
      genresPromise = undefined
    }
    return genres
  } catch (error) {
    if (genresPromise === responsePromise) {
      genresPromise = undefined
    }
    throw error
  }
}
