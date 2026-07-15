import { useSearchParams } from '@solidjs/router'
import { createSignal, Match, onMount, Switch } from 'solid-js'

import { postPlayerDataCommit } from '../../api/register-data'
import { Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { clearCachedUserApiResponses } from '../../repositories/userApiCacheRepository'
import { useSongsData } from '../../stores/songsData'
import type {
  CourseDTO,
  PlayerDataCourseRecordChange,
  PlayerDataRecordChange,
  PlayerDataResult,
} from '../../types/api'
import { fetchCoursesWithCache } from '../../usecases/cache/fetchCoursesWithCache'
import { commitRegisterScore } from '../../usecases/registerScoreCommit'
import { toChartLevelLabel } from '../../utils/chartLevel'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { REGISTER_SCORE_MESSAGES, RegisterScoreResultView } from './RegisterScoreResultView'
import { formatWorldsendChartLevel } from './registerScoreDisplay'
import { isValidUploadToken, normalizeUploadTokenParam } from './registerScoreToken'

/**
 * スコア登録画面の表示状態と、成功時に表示する登録結果をまとめて保持する。
 */
type RegisterScoreViewState =
  | { type: 'committing' }
  | { type: 'success'; result: PlayerDataResult }
  | { type: 'error'; message: string }

type SongLookupItem = {
  official_idx?: string
  title: string
}

/** コースタイトル検索に必要なコースマスタ項目。 */
type CourseLookupItem = Pick<CourseDTO, 'idx' | 'name'>

/**
 * エラー表示に利用するメッセージへ変換する。
 *
 * @param error - API呼び出しで発生したエラー。
 * @returns 画面表示用のエラーメッセージ。
 */
const resolveRegisterScoreErrorMessage = (error: unknown): string => {
  return toUserFriendlyErrorMessage(error, REGISTER_SCORE_MESSAGES.fallbackError)
}

/**
 * 楽曲一覧から公式idxに対応するタイトルを検索する。
 *
 * @param songs - 検索対象の楽曲一覧。
 * @param idx - API差分に含まれる公式idx。
 * @returns 見つかった楽曲タイトル。見つからない場合はundefined。
 */
const findSongTitleByOfficialIdx = (songs: SongLookupItem[], idx: string): string | undefined => {
  return songs.find((song) => song.official_idx === idx)?.title
}

/**
 * コース一覧から公式idxに対応するタイトルを検索する。
 *
 * @param courses - 検索対象のコース一覧。
 * @param idx - API差分に含まれる公式idx。
 * @returns 見つかったコースタイトル。見つからない場合はundefined。
 */
const findCourseTitleByIdx = (courses: CourseLookupItem[], idx: string): string | undefined => {
  return courses.find((course) => course.idx === idx)?.name
}

/**
 * `/register-score` でアップロードトークンを確定保存する画面を表示する。
 *
 * @returns スコア登録画面。
 */
const RegisterScorePage = () => {
  const [searchParams] = useSearchParams<{ token: string | string[] }>()
  const songsData = useSongsData()
  const [viewState, setViewState] = createSignal<RegisterScoreViewState>({ type: 'committing' })
  let courses: CourseLookupItem[] = []

  useDocumentTitle(REGISTER_SCORE_MESSAGES.title)

  /**
   * 差分に含まれる楽曲idxから表示用の楽曲名を解決する。
   *
   * @param change - APIから返却された1譜面分の差分。
   * @returns 楽曲名。未取得の場合はプレースホルダー。
   */
  const songTitleByIdx = (change: PlayerDataRecordChange) => {
    if (change.record_type === 'course') {
      return REGISTER_SCORE_MESSAGES.unknownSongTitle
    }

    const standardSongs = songsData.songsResponse.latest?.songs ?? []
    const worldsendSongs = songsData.worldsendSongsResponse.latest?.songs ?? []

    return (
      findSongTitleByOfficialIdx(
        change.record_type === 'worldsend' ? worldsendSongs : standardSongs,
        change.idx
      ) ?? REGISTER_SCORE_MESSAGES.unknownSongTitle
    )
  }

  /**
   * 差分に含まれる楽曲idxと難易度から譜面レベル文字列を解決する。
   *
   * @param change - APIから返却された1譜面分の差分。
   * @returns 譜面レベル文字列（例: "15+"、"★5"）。譜面情報がない場合はundefined。
   */
  const chartLevelByIdx = (change: PlayerDataRecordChange) => {
    if (change.record_type === 'worldsend') {
      const worldsendSongs = songsData.worldsendSongsResponse.latest?.songs ?? []
      const song = worldsendSongs.find((item) => item.official_idx === change.idx)
      const levelStar = song?.charts.WORLDSEND?.level_star

      return formatWorldsendChartLevel(levelStar)
    }

    if (change.record_type !== 'standard') {
      return undefined
    }

    const standardSongs = songsData.songsResponse.latest?.songs ?? []
    const song = standardSongs.find((s) => s.official_idx === change.idx)
    const chart = song?.charts?.[change.diff as keyof typeof song.charts]

    if (!chart) {
      return undefined
    }

    return toChartLevelLabel(chart.const)
  }

  /**
   * 差分に含まれるコースidxから表示用のコースタイトルを解決する。
   *
   * @param change - APIから返却されたコース差分。
   * @param courses - 取得済みコース一覧。
   * @returns コースタイトル。未取得の場合はプレースホルダー。
   */
  const courseTitleByIdx = (change: PlayerDataCourseRecordChange, courses: CourseLookupItem[]) => {
    return findCourseTitleByIdx(courses, change.idx) ?? REGISTER_SCORE_MESSAGES.unknownSongTitle
  }

  onMount(async () => {
    const uploadToken = normalizeUploadTokenParam(searchParams.token)
    if (!uploadToken || !isValidUploadToken(uploadToken)) {
      setViewState({ type: 'error', message: REGISTER_SCORE_MESSAGES.invalidToken })
      return
    }

    try {
      const { result } = await commitRegisterScore(
        { uploadToken },
        {
          commitPlayerData: postPlayerDataCommit,
          clearUserApiCache: clearCachedUserApiResponses,
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
      <h1 class="text-2xl font-semibold">{REGISTER_SCORE_MESSAGES.title}</h1>

      <Switch>
        <Match when={viewState().type === 'committing'}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <Loading />
            <p class="mt-4 text-center text-sm text-text-muted" aria-live="polite">
              {REGISTER_SCORE_MESSAGES.processing}
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
                result={successState.result}
                resolveSongTitle={songTitleByIdx}
                resolveChartLevel={chartLevelByIdx}
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
