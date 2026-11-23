import {
  type QueryKey,
  QueryObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from '@tanstack/solid-query'
import { createRoot, createSignal } from 'solid-js'
import { appQueryClient } from '../lib/queryClient'
import { invalidateSongsUpdatedAtCache } from '../queries/masterData'
import { standardSongsQueryOptions, worldsendSongsQueryOptions } from '../queries/songs'
import { clearCachedSongData } from '../repositories/songCacheRepository'
import { compareSongsByReading } from '../utils/songTitleSorting'

/**
 * 楽曲 CRUD 後にメモリと IndexedDB の楽曲キャッシュを無効化する。
 *
 * @returns 無効化処理完了後に解決される Promise。
 */
const invalidateSongsDataCache = async (): Promise<void> => {
  invalidateSongsUpdatedAtCache()
  try {
    await clearCachedSongData()
  } catch {
    // IndexedDB の削除失敗時も、更新日時の再検証で最新の楽曲を取得できる。
  }
}

/** Solid の resource と同じ読み方で query の状態を参照するアクセサ。 */
export type SongsQueryResource<T> = (() => T | undefined) & {
  /** 要求前は unresolved、取得失敗時は errored。 */
  readonly state: 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored'
  /** 取得または再取得の通信中は true。 */
  readonly loading: boolean
  /** 取得に失敗した場合のエラー。 */
  readonly error: unknown
  /** 直近に取得できたデータ。 */
  readonly latest: T | undefined
}

/**
 * 共有 QueryClient の query を監視し、要求されるまで取得しないアクセサを作成する。
 *
 * @param options - 監視する query の options。
 * @returns query の状態を読むアクセサと、要求済みかどうか・observer。
 */
const createSongsQueryResource = <T, TQueryKey extends QueryKey>(
  options: QueryObserverOptions<T, Error, T, T, TQueryKey>
) => {
  const observer = new QueryObserver(appQueryClient, { ...options, enabled: false })
  const [result, setResult] = createSignal<QueryObserverResult<T>>(observer.getCurrentResult(), {
    equals: false,
  })
  observer.subscribe(setResult)
  const [requested, setRequested] = createSignal(false)

  const error = (): unknown => (result().status === 'error' ? result().error : undefined)
  const resource = (() => result().data) as SongsQueryResource<T>
  Object.defineProperties(resource, {
    state: {
      get: () => {
        if (!requested()) return 'unresolved'
        const current = result()
        if (current.status === 'error') return 'errored'
        if (current.data === undefined) return 'pending'
        return current.fetchStatus === 'fetching' ? 'refreshing' : 'ready'
      },
    },
    loading: { get: () => requested() && result().fetchStatus === 'fetching' },
    error: { get: error },
    latest: { get: () => result().data },
  })

  /**
   * 初回は取得を有効にし、失敗していれば再取得する。
   * 他画面の query が先に取得していた場合、有効化だけでは再取得されないため、初回も失敗状態を確認する。
   */
  const request = (shouldRetry: (current: QueryObserverResult<T>) => boolean): void => {
    if (!requested()) {
      setRequested(true)
      observer.setOptions({ ...options, enabled: true })
    }
    const current = observer.getCurrentResult()
    if (current.fetchStatus === 'idle' && (current.status === 'error' || shouldRetry(current))) {
      void observer.refetch()
    }
  }

  /**
   * 進行中の取得を打ち切り、共有 query を無効化する。
   * 初回取得中は TanStack Query が既存の取得を再利用するため、先に明示的に中断する。
   * store 経由で要求していなくても他画面の query が保持する一覧を古いまま残さず、
   * 監視中の画面があれば再取得し、なければ次回の利用時に再取得させる。
   */
  const refetch = async (): Promise<void> => {
    const filters = { queryKey: options.queryKey, exact: true }
    await appQueryClient.cancelQueries(filters)
    await appQueryClient.invalidateQueries(filters, { throwOnError: true })
  }

  return { resource, result, requested, request, refetch }
}

/**
 * 共有楽曲データの遅延ロード・再取得状態を作成する。
 * 取得とキャッシュは TanStack Query の楽曲一覧 query が担い、ここでは既存画面向けの参照方法を提供する。
 *
 * @returns 通常楽曲と WORLD'S END 楽曲の共有 resource と操作関数。
 */
const createSongsStore = () => {
  const standard = createSongsQueryResource(standardSongsQueryOptions())
  const worldsend = createSongsQueryResource(worldsendSongsQueryOptions())

  /** @returns キャッシュを表示したまま背景の再検証に失敗した場合は true */
  const songsRevalidationFailed = (): boolean => standard.result().data?.revalidationFailed ?? false

  /** 通常楽曲の初回ロードを開始し、取得または背景再検証が失敗していれば再試行する */
  const ensureSongsLoaded = (): void =>
    standard.request((current) => current.data?.revalidationFailed === true)

  /** WORLD'S END 楽曲が未要求の場合に初回ロードを開始し、前回の取得が失敗していれば再試行する */
  const ensureWorldsendSongsLoaded = (): void => worldsend.request(() => false)

  /** @returns 通常楽曲の表示可能なデータがまだない場合は true */
  const isSongsLoading = (): boolean =>
    !standard.requested() || (standard.result().data === undefined && !standard.resource.error)

  /** @returns WORLD'S END 楽曲の初回要求前または取得中の場合は true */
  const isWorldsendSongsLoading = (): boolean =>
    !worldsend.requested() || worldsend.resource.loading || worldsend.result().status === 'pending'

  /**
   * 楽曲 CRUD 後に通常楽曲キャッシュを無効化し、利用済みならサーバーから再取得する。
   *
   * @returns 再取得または無効化完了後に解決される Promise。
   */
  const refreshSongs = async (): Promise<void> => {
    await invalidateSongsDataCache()
    await standard.refetch()
  }

  /**
   * 楽曲 CRUD 後に WORLD'S END 楽曲キャッシュを無効化し、利用済みなら再取得する。
   *
   * @returns 再取得または無効化完了後に解決される Promise。
   */
  const refreshWorldsendSongs = async (): Promise<void> => {
    await invalidateSongsDataCache()
    await worldsend.refetch()
  }

  /**
   * 取得済みの有効な通常楽曲数を返す。
   * @returns 収録曲数。取得前または取得失敗時はundefined。
   */
  const songCount = (): number | undefined =>
    standard.resource.error ? undefined : standard.result().data?.songs.length

  return {
    songCount,
    songsRevalidationFailed,
    songsResponse: standard.resource,
    worldsendSongsResponse: worldsend.resource,
    ensureSongsLoaded,
    ensureWorldsendSongsLoaded,
    refreshSongs,
    refreshWorldsendSongs,
    isSongsLoading,
    isWorldsendSongsLoading,
  }
}

/**
 * 楽曲一覧のデフォルト表示用に、楽曲配列をリリース日降順 + official_idx の数値降順でソートする。
 *
 * - リリース日が新しい順（降順）。リリース日が無効/未設定の曲は先頭へ寄せる。
 * - 同一リリース日内では official_idx を数値として降順。非数値の idx は数値より後ろ（末尾寄せ）。
 * - 最終タイブレークはタイトルの辞書順（昇順）。
 *
 * @param songs - ソート対象の楽曲配列（SongDTO など、official_idx/release/title を持つオブジェクト）
 * @returns ソート済みの新しい配列（元の配列は変更しない）
 */
export const sortSongsByReleaseDescAndIdxDesc = <
  T extends { official_idx?: string; title: string; release?: string | null },
>(
  songs: T[]
): T[] => {
  const keyed = songs.map((song) => {
    const parsedIdx = song.official_idx?.trim() ? Number(song.official_idx) : NaN
    const parsedRelease = Date.parse(song.release ?? '')

    // 降順ソートのため、無効な idx は「最小値」相当の sentinel として扱い末尾へ、
    // 無効なリリース日は「最大値」相当の sentinel として扱い先頭へ寄せる
    return {
      song,
      idx: Number.isFinite(parsedIdx) ? parsedIdx : -1,
      releaseTime: Number.isFinite(parsedRelease) ? parsedRelease : Number.POSITIVE_INFINITY,
    }
  })

  keyed.sort((left, right) => {
    // リリース日 降順（新しい順）
    // Infinity 同士の減算は NaN になるため、等値判定を先に行う
    if (left.releaseTime !== right.releaseTime) {
      return right.releaseTime > left.releaseTime ? 1 : -1
    }

    // idx 数値降順（大きい順）。-1（無効）は数値より後ろ
    if (left.idx !== right.idx) {
      return right.idx - left.idx
    }

    // 最終タイブレーク: 読み昇順
    return compareSongsByReading(left.song, right.song)
  })

  return keyed.map(({ song }) => song)
}

let songsStore: ReturnType<typeof createSongsStore> | undefined

export const useSongsData = () => {
  songsStore ??= createRoot(createSongsStore)
  return songsStore
}
