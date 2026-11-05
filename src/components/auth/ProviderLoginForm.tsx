import { VISIBLE_AUTH_PROVIDERS } from '../../lib/authProviders'
import { loginWithProvider } from '../../usecases/auth/loginWithProvider'
import { AuthenticationForm, type AuthenticationFormProps } from './AuthenticationForm'
import { AuthProviderIcon } from './AuthProviderIcon'
import {
  PROVIDER_LOGIN_ERROR_MESSAGE,
  PROVIDER_LOGIN_SUBMITTING_LABEL,
  providerLoginButtonLabel,
} from './providerLoginForm.constants'

/** ログイン成功・失敗時のページ固有処理を指定する。 */
export type ProviderLoginFormProps = Pick<AuthenticationFormProps, 'onSuccess' | 'onFailure'>

/**
 * 現在の環境で表示する認証プロバイダのポップアップ認証とTurnstileを使うログインフォームを表示する。
 *
 * @param props - ログイン成功・失敗後のページ固有コールバック。
 * @returns 認証プロバイダごとのログインボタンを並べたフォーム要素。
 */
export const ProviderLoginForm = (props: ProviderLoginFormProps) => {
  // アイコンのDOMを画面ごとに作るため、ログイン方法はコンポーネント内で組み立てる。
  const methods = VISIBLE_AUTH_PROVIDERS.map((provider) => ({
    id: provider.kind,
    label: providerLoginButtonLabel(provider.label),
    icon: <AuthProviderIcon kind={provider.kind} />,
    login: (turnstileToken: string) => loginWithProvider(provider.kind, turnstileToken),
  }))

  return (
    <AuthenticationForm
      methods={methods}
      onSuccess={props.onSuccess}
      onFailure={props.onFailure}
      submittingLabel={PROVIDER_LOGIN_SUBMITTING_LABEL}
      fallbackErrorMessage={PROVIDER_LOGIN_ERROR_MESSAGE}
    />
  )
}
