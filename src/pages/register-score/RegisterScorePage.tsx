import { useSearchParams } from '@solidjs/router'
import { useQueryClient } from '@tanstack/solid-query'
import { createSignal, Match, onMount, Show, Switch } from 'solid-js'

import { postPlayerDataCommit } from '../../api/register-data'
import { Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { invalidateFriendRankings } from '../../queries/friendRankings'
import { clearCachedUserApiResponses } from '../../repositories/userApiCacheRepository'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import type { CourseDTO } from '../../types/api'
import { fetchCoursesWithCache } from '../../usecases/cache/fetchCoursesWithCache'
import {
  commitRegisterScore,
  type NormalizedPlayerDataResult,
} from '../../usecases/registerScoreCommit'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { REGISTER_SCORE_COPY } from './constants'
import { RegisterScoreResultView } from './RegisterScoreResultView'
import {
  resolveRegisterScoreChartLevel,
  resolveRegisterScoreCourseTitle,
  resolveRegisterScoreSongSortValues,
  resolveRegisterScoreSongTitle,
} from './registerScoreResolvers'
import { isValidUploadToken, normalizeUploadTokenParam } from './registerScoreToken'

/**
 * スコア登録画面の表示状態と、成功時に表示する登録結果をまとめて保持する。
 */
type RegisterScoreViewState =
  | { type: 'committing' }
  | { type: 'success'; result: NormalizedPlayerDataResult }
  | { type: 'error'; message: string }

/** コースタイトル検索に必要なコースマスタ項目 */
type CourseLookupItem = Pick<CourseDTO, 'idx' | 'name'>

/**
 * エラー表示に利用するメッセージへ変換する。
 *
 * @param error - API呼び出しで発生したエラー。
 * @returns 画面表示用のエラーメッセージ。
 */
const resolveRegisterScoreErrorMessage = (error: unknown): string => {
  return toUserFriendlyErrorMessage(error, REGISTER_SCORE_COPY.fallbackError)
}

/**
 * `/register-score` でアップロードトークンを確定保存する画面を表示する。
 *
 * @returns スコア登録画面。
 */
const RegisterScorePage = () => {
  const [searchParams] = useSearchParams<{ token: string | string[] }>()
  const songsData = useSongsData()
  const queryClient = useQueryClient()
  const [viewState, setViewState] = createSignal<RegisterScoreViewState>({ type: 'committing' })
  let courses: CourseLookupItem[] = []

  /**
   * ログイン中ユーザーのフレンドランキングキャッシュを無効化する。
   *
   * @returns 表示中ランキングの再取得完了時に解決されるPromise。
   */
  const invalidateCurrentUserFriendRankings = (): Promise<void> => {
    const username = authSession.user?.username
    return username ? invalidateFriendRankings(queryClient, username) : Promise.resolve()
  }

  useDocumentTitle(REGISTER_SCORE_COPY.title)

  /**
   * 差分に含まれる楽曲idxから表示用の楽曲名を解決する。
   *
   * @param change - APIから返却された1譜面分の差分。
   * @returns 楽曲名。未取得の場合はプレースホルダー。
   */
  const songTitleByIdx = (change: Parameters<typeof resolveRegisterScoreSongTitle>[0]) => {
    const standardSongs = songsData.songsResponse.latest?.songs ?? []
    const worldsendSongs = songsData.worldsendSongsResponse.latest?.songs ?? []
    return resolveRegisterScoreSongTitle(change, standardSongs, worldsendSongs)
  }

  /**
   * 差分に含まれる楽曲idxと難易度から譜面レベル文字列を解決する。
   *
   * @param change - APIから返却された1譜面分の差分。
   * @returns 譜面レベル文字列（例: "15+"、"★5"）。譜面情報がない場合はundefined。
   */
  const chartLevelByIdx = (change: Parameters<typeof resolveRegisterScoreChartLevel>[0]) => {
    const standardSongs = songsData.songsResponse.latest?.songs ?? []
    const worldsendSongs = songsData.worldsendSongsResponse.latest?.songs ?? []
    return resolveRegisterScoreChartLevel(change, standardSongs, worldsendSongs)
  }

  /**
   * 差分に含まれる楽曲idxと難易度からソート用の値を解決する。
   *
   * @param change - APIから返却された1譜面分の差分。
   * @returns ソート用のレベルと単曲レーティング。解決できない値はnull。
   */
  const songSortValuesByIdx = (
    change: Parameters<typeof resolveRegisterScoreSongSortValues>[0]
  ) => {
    const standardSongs = songsData.songsResponse.latest?.songs ?? []
    return resolveRegisterScoreSongSortValues(change, standardSongs)
  }

  /**
   * 差分に含まれるコースidxから表示用のコースタイトルを解決する。
   *
   * @param change - APIから返却されたコース差分。
   * @param courses - 取得済みコース一覧。
   * @returns コースタイトル。未取得の場合はプレースホルダー。
   */
  const courseTitleByIdx = (
    change: Parameters<typeof resolveRegisterScoreCourseTitle>[0],
    courses: CourseLookupItem[]
  ) => resolveRegisterScoreCourseTitle(change, courses)

  onMount(async () => {
    const uploadToken = normalizeUploadTokenParam(searchParams.token)
    if (!uploadToken || !isValidUploadToken(uploadToken)) {
      setViewState({ type: 'error', message: REGISTER_SCORE_COPY.invalidToken })
      return
    }

    try {
      const { result } = await commitRegisterScore(
        { uploadToken },
        {
          commitPlayerData: postPlayerDataCommit,
          clearUserApiCache: clearCachedUserApiResponses,
          invalidateFriendRankings: invalidateCurrentUserFriendRankings,
          ensureSongsLoaded: songsData.ensureSongsLoaded,
          ensureWorldsendSongsLoaded: songsData.ensureWorldsendSongsLoaded,
        }
      )
      courses = result.changes.some((change) => change.record_type === 'course')
        ? await fetchCoursesWithCache()
            .then((response) => response.courses)
            .catch(() => [])
        : []

      setViewState({ type: 'success', result })
    } catch (error) {
      setViewState({ type: 'error', message: resolveRegisterScoreErrorMessage(error) })
    }
  })

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <Show when={viewState().type !== 'success'}>
        <h1 class="text-2xl font-semibold">{REGISTER_SCORE_COPY.title}</h1>
      </Show>

      <Switch>
        <Match when={viewState().type === 'committing'}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <Loading />
            <p class="mt-4 text-center text-sm text-text-muted" aria-live="polite">
              {REGISTER_SCORE_COPY.processing}
            </p>
          </section>
        </Match>

        <Match when={viewState().type === 'success' && viewState()}>
          {(currentViewState) => {
            const successState = currentViewState() as Extract<
              RegisterScoreViewState,
              { type: 'success' }
            >

            return (
              <RegisterScoreResultView
                pageTitle={REGISTER_SCORE_COPY.title}
                result={successState.result}
                resolveSongTitle={songTitleByIdx}
                resolveChartLevel={chartLevelByIdx}
                resolveSongSortValues={songSortValuesByIdx}
                resolveCourseTitle={(change) => courseTitleByIdx(change, courses)}
              />
            )
          }}
        </Match>

        <Match when={viewState().type === 'error' && viewState()}>
          {(currentViewState) => {
            const errorState = currentViewState() as Extract<
              RegisterScoreViewState,
              { type: 'error' }
            >

            return (
              <p class="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
                {errorState.message}
              </p>
            )
          }}
        </Match>
      </Switch>
    </main>
  )
}

export default RegisterScorePage
