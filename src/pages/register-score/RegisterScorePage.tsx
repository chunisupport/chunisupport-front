import { useSearchParams } from '@solidjs/router'
import { createSignal, Match, onMount, Switch } from 'solid-js'

import { postPlayerDataCommit } from '../../api/register-data.ts'
import { Loading } from '../../components/index.ts'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts'
import { clearCachedUserApiResponses } from '../../repositories/userApiCacheRepository.ts'
import { useSongsData } from '../../stores/songsData.ts'
import type { PlayerDataRecordChange, PlayerDataResult } from '../../types/api.ts'
import { commitRegisterScore } from '../../usecases/registerScoreCommit.ts'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage.ts'
import { REGISTER_SCORE_MESSAGES, RegisterScoreResultView } from './RegisterScoreResultView.tsx'
import { isValidUploadToken, normalizeUploadTokenParam } from './registerScoreToken.ts'

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

  useDocumentTitle(REGISTER_SCORE_MESSAGES.title)

  /**
   * 差分に含まれる楽曲idxから表示用の楽曲名を解決する。
   *
   * @param change - APIから返却された1譜面分の差分。
   * @returns 楽曲名。未取得の場合はプレースホルダー。
   */
  const songTitleByIdx = (change: PlayerDataRecordChange) => {
    const standardSongs = songsData.songsResponse.latest?.songs ?? []
    const worldsendSongs = songsData.worldsendSongsResponse.latest?.songs ?? []

    return (
      findSongTitleByOfficialIdx(
        change.record_type === 'worldsend' ? worldsendSongs : standardSongs,
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
      const { result } = await commitRegisterScore(
        { uploadToken },
        {
          commitPlayerData: postPlayerDataCommit,
          clearUserApiCache: clearCachedUserApiResponses,
          ensureSongsLoaded: songsData.ensureSongsLoaded,
          ensureWorldsendSongsLoaded: songsData.ensureWorldsendSongsLoaded,
        }
      )
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
