import { A, useSearchParams } from '@solidjs/router'
import { ArrowRight } from 'lucide-solid'
import { createSignal, Match, onMount, Switch } from 'solid-js'

import { postPlayerDataCommit } from '../../api/register-data'
import { fetchMe } from '../../api/users'
import { Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import type { PlayerDataRecordChange, PlayerDataResult } from '../../types/api'
import { commitRegisterScore } from '../../usecases/registerScoreCommit'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { REGISTER_SCORE_MESSAGES, RegisterScoreResultView } from './RegisterScoreResultView'
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
 * `/register-score` でアップロードトークンを確定保存する画面を表示する。
 *
 * @returns スコア登録画面。
 */
const RegisterScorePage = () => {
  const [searchParams] = useSearchParams<{ token: string | string[] }>()
  const songsData = useSongsData()
  const [viewState, setViewState] = createSignal<RegisterScoreViewState>({ type: 'committing' })
  const [username, setUsername] = createSignal(authSession.user?.username ?? null)

  useDocumentTitle(REGISTER_SCORE_MESSAGES.title)

  /**
   * 差分に含まれる楽曲idxから表示用の楽曲名を解決する。
   *
   * @param change - APIから返却された1譜面分の差分。
   * @returns 楽曲名。未取得の場合はプレースホルダー。
   */
  const songTitleByIdx = (change: PlayerDataRecordChange) => {
    const fullSongs = songsData.songsResponse()?.songs ?? []
    const worldsendSongs = songsData.worldsendSongsResponse()?.songs ?? []

    return (
      findSongTitleByOfficialIdx(
        change.record_type === 'worldsend' ? worldsendSongs : fullSongs,
        change.idx
      ) ?? REGISTER_SCORE_MESSAGES.unknownSongTitle
    )
  }

  onMount(async () => {
    const uploadToken = normalizeUploadTokenParam(searchParams.token)
    if (!uploadToken || !isValidUploadToken(uploadToken)) {
      setViewState({ type: 'error', message: REGISTER_SCORE_MESSAGES.invalidToken })
      return
    }

    try {
      const { result, usernamePromise } = await commitRegisterScore(
        { uploadToken, currentUsername: username() },
        {
          commitPlayerData: postPlayerDataCommit,
          fetchUsername: async () => {
            const me = await fetchMe({ redirectOnUnauthorized: false })
            return me.username
          },
          ensureSongsLoaded: songsData.ensureSongsLoaded,
          ensureWorldsendSongsLoaded: songsData.ensureWorldsendSongsLoaded,
        }
      )
      setViewState({ type: 'success', result })
      usernamePromise?.then(setUsername)
    } catch (error) {
      setViewState({ type: 'error', message: resolveRegisterScoreErrorMessage(error) })
    }
  })

  /**
   * ログインユーザーのマイページパスを作成する。
   *
   * @returns ユーザー名がある場合はマイページパス、ない場合はnull。
   */
  const userPagePath = () => {
    const currentUsername = username()
    return currentUsername ? `/users/${encodeURIComponent(currentUsername)}` : null
  }

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
                action={
                  <Switch>
                    <Match when={userPagePath()}>
                      {(path) => (
                        <A
                          href={path()}
                          class="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        >
                          {REGISTER_SCORE_MESSAGES.myPageLink}
                          <ArrowRight class="h-4 w-4" aria-hidden="true" />
                        </A>
                      )}
                    </Match>
                    <Match when={true}>
                      <p class="text-sm text-red-600" aria-live="polite">
                        {REGISTER_SCORE_MESSAGES.missingUser}
                      </p>
                    </Match>
                  </Switch>
                }
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
