import { queryOptions } from '@tanstack/solid-query'
import { requestGenres } from '../api/genres'
import {
  requestCoursesUpdatedAt,
  requestMasterData,
  requestSongsUpdatedAt,
  requestVersions,
} from '../api/songs'
import { SONGS_UPDATED_AT_CACHE_TTL_MS } from '../constants/songMaster'
import { appQueryClient } from '../lib/queryClient'
import type { MasterDataDTO } from '../types/api'
import { fetchQueryWithRestartOnRemoval } from './fetchQueryWithRestartOnRemoval'

/** マスタ関連queryのkey factory。 */
export const masterDataQueryKeys = {
  /** @returns 公開バージョン一覧のqueryキー。 */
  versions: () => ['master', 'versions'] as const,
  /** @returns 全マスタのqueryキー。 */
  masterData: () => ['master', 'all'] as const,
  /** @returns ジャンル一覧のqueryキー。 */
  genres: () => ['master', 'genres'] as const,
  /** @returns 楽曲更新日時のqueryキー。 */
  songsUpdatedAt: () => ['songs', 'updated-at'] as const,
  /** @returns コース更新日時のqueryキー。 */
  coursesUpdatedAt: () => ['courses', 'updated-at'] as const,
}

/**
 * バージョン一覧のquery optionsを生成する。
 * @returns オフライン時も一時停止・自動再試行せず、セッション中に再利用するquery options。
 */
export const versionsQueryOptions = () =>
  queryOptions({
    queryKey: masterDataQueryKeys.versions(),
    queryFn: requestVersions,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: 'always',
  })

/**
 * バージョン一覧を共通QueryClient経由で取得する。
 * @returns キャッシュ済み、またはAPIから取得したバージョン一覧。
 */
export const fetchVersions = () => fetchQueryWithRestartOnRemoval(versionsQueryOptions())

/**
 * 全マスタのquery optionsを生成する。
 * @returns オフライン時も一時停止・自動再試行せず、セッション中に再利用するquery options。
 */
export const masterDataQueryOptions = () =>
  queryOptions({
    queryKey: masterDataQueryKeys.masterData(),
    queryFn: requestMasterData,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: 'always',
  })

/**
 * 全マスタを共通QueryClient経由で取得する。
 * @returns キャッシュ済み、またはAPIから取得した全マスタ。
 */
export const fetchMasterData = () => fetchQueryWithRestartOnRemoval(masterDataQueryOptions())

/**
 * ジャンル一覧のquery optionsを生成する。
 * @returns オフライン時も一時停止・自動再試行せず、セッション中に再利用するquery options。
 */
export const genresQueryOptions = () =>
  queryOptions({
    queryKey: masterDataQueryKeys.genres(),
    queryFn: requestGenres,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    networkMode: 'always',
  })

/**
 * ジャンル一覧を共通QueryClient経由で取得する。
 * @returns キャッシュ済み、またはAPIから取得したジャンル一覧。
 */
export const fetchGenres = () => appQueryClient.fetchQuery(genresQueryOptions())

/**
 * 楽曲更新日時のquery optionsを生成する。
 * @returns オフライン時も一時停止・自動再試行せず、同時取得を共有するquery options。
 */
export const songsUpdatedAtQueryOptions = () =>
  queryOptions({
    queryKey: masterDataQueryKeys.songsUpdatedAt(),
    queryFn: requestSongsUpdatedAt,
    staleTime: SONGS_UPDATED_AT_CACHE_TTL_MS,
    retry: false,
    networkMode: 'always',
  })

/**
 * 楽曲更新日時を共通QueryClient経由で取得する。
 * @returns キャッシュ済み、またはAPIから取得した楽曲更新日時。
 */
export const fetchSongsUpdatedAt = () =>
  fetchQueryWithRestartOnRemoval(songsUpdatedAtQueryOptions())

/**
 * コース更新日時のquery optionsを生成する。
 * @returns オフライン時も一時停止・自動再試行せず、同時取得を共有するquery options。
 */
export const coursesUpdatedAtQueryOptions = () =>
  queryOptions({
    queryKey: masterDataQueryKeys.coursesUpdatedAt(),
    queryFn: requestCoursesUpdatedAt,
    staleTime: 0,
    retry: false,
    networkMode: 'always',
  })

/**
 * コース更新日時を共通QueryClient経由で取得する。
 * @returns APIから取得した最新のコース更新日時。
 */
export const fetchCoursesUpdatedAt = () => appQueryClient.fetchQuery(coursesUpdatedAtQueryOptions())

/**
 * 楽曲更新日時queryを進行中の取得ごと破棄する。
 * 無効化前の応答は以後のキャッシュに採用せず、進行中の呼び出しは最大1回再取得する。
 * @returns なし。
 */
export const invalidateSongsUpdatedAtCache = (): void => {
  appQueryClient.removeQueries({ queryKey: masterDataQueryKeys.songsUpdatedAt(), exact: true })
}

/**
 * バージョン一覧と全マスタqueryを進行中の取得ごと破棄する。
 * 無効化前の応答は以後のキャッシュに採用せず、進行中の呼び出しは最大1回再取得する。
 * @returns なし。
 */
export const invalidateVersionCaches = (): void => {
  appQueryClient.removeQueries({ queryKey: masterDataQueryKeys.versions(), exact: true })
  appQueryClient.removeQueries({ queryKey: masterDataQueryKeys.masterData(), exact: true })
}

/** 目標の対象条件を解決するための難易度・ジャンル情報。 */
export type GoalFilterOptions = Pick<MasterDataDTO, 'difficulties' | 'genres'>

/**
 * 目標フィルターに必要な難易度とジャンルだけを取得する。
 *
 * @returns 目標属性IDの解決に使う選択肢。
 */
export const fetchGoalFilterOptions = async (): Promise<GoalFilterOptions> => {
  const { difficulties, genres } = await fetchMasterData()
  return { difficulties, genres }
}
