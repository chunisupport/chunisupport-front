import { A, useSearchParams } from '@solidjs/router'
import { CheckCircle } from 'lucide-solid'
import { createSignal, Match, onMount, Switch } from 'solid-js'

import { postPlayerDataCommit } from '../../api/register-data'
import { fetchMe } from '../../api/users'
import { Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { isValidUploadToken, normalizeUploadTokenParam } from './registerScoreToken'

type RegisterScoreState = 'committing' | 'success' | 'error'

const REGISTER_SCORE_MESSAGES = {
  invalidToken: 'tokenが不正です。登録用URLを確認してください。',
  missingUser: 'ログインユーザー情報を取得できませんでした。ページを再読み込みしてください。',
  fallbackError: '登録に失敗しました。',
  success: '登録しました！',
  title: 'スコア登録',
  processing: 'スコアデータを登録しています。',
  myPageLink: 'マイページへ移動',
} as const

/**
 * エラー表示に利用するメッセージへ変換する。
 *
 * @param error - API呼び出しで発生したエラー。
 * @returns 画面表示用のエラーメッセージ。
 */
const resolveRegisterScoreErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return REGISTER_SCORE_MESSAGES.fallbackError
}

/**
 * `/register-score` でアップロードトークンを確定保存する画面を表示する。
 *
 * @returns スコア登録画面。
 */
const RegisterScorePage = () => {
  const [searchParams] = useSearchParams<{ token: string | string[] }>()
  const [state, setState] = createSignal<RegisterScoreState>('committing')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [username, setUsername] = createSignal(authSession.user?.username ?? null)

  useDocumentTitle(REGISTER_SCORE_MESSAGES.title)

  onMount(async () => {
    const uploadToken = normalizeUploadTokenParam(searchParams.token)
    if (!uploadToken || !isValidUploadToken(uploadToken)) {
      setErrorMessage(REGISTER_SCORE_MESSAGES.invalidToken)
      setState('error')
      return
    }

    try {
      await postPlayerDataCommit(uploadToken)
      if (!username()) {
        try {
          const me = await fetchMe({ redirectOnUnauthorized: false })
          setUsername(me.username)
        } catch {
          setUsername(null)
        }
      }
      setState('success')
    } catch (error) {
      setErrorMessage(resolveRegisterScoreErrorMessage(error))
      setState('error')
    }
  })

  const userPagePath = () => {
    const currentUsername = username()
    return currentUsername ? `/users/${encodeURIComponent(currentUsername)}` : null
  }

  return (
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 class="text-2xl font-semibold">{REGISTER_SCORE_MESSAGES.title}</h1>

      <Switch>
        <Match when={state() === 'committing'}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <Loading />
            <p class="mt-4 text-center text-sm text-text-muted" aria-live="polite">
              {REGISTER_SCORE_MESSAGES.processing}
            </p>
          </section>
        </Match>

        <Match when={state() === 'success'}>
          <section class="rounded-lg border border-border bg-surface p-6">
            <div class="flex items-center gap-3">
              <CheckCircle class="h-6 w-6 text-action-primary" aria-hidden="true" />
              <p class="text-lg font-semibold text-text">{REGISTER_SCORE_MESSAGES.success}</p>
            </div>
            <Switch>
              <Match when={userPagePath()}>
                {(path) => (
                  <A
                    href={path()}
                    class="mt-4 inline-flex rounded-md bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {REGISTER_SCORE_MESSAGES.myPageLink}
                  </A>
                )}
              </Match>
              <Match when={true}>
                <p class="mt-4 text-sm text-danger" aria-live="polite">
                  {REGISTER_SCORE_MESSAGES.missingUser}
                </p>
              </Match>
            </Switch>
          </section>
        </Match>

        <Match when={state() === 'error'}>
          <p class="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
            {errorMessage()}
          </p>
        </Match>
      </Switch>
    </main>
  )
}

export default RegisterScorePage
