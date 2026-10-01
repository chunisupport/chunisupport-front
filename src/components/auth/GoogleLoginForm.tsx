import { loginWithGoogle } from '../../usecases/auth/loginWithGoogle'
import { AuthenticationForm, type AuthenticationFormProps } from './AuthenticationForm'
import {
  GOOGLE_LOGIN_BUTTON_LABEL,
  GOOGLE_LOGIN_ERROR_MESSAGE,
  GOOGLE_LOGIN_SUBMITTING_LABEL,
} from './googleLoginForm.constants'

/** Googleログイン成功・失敗時のページ固有処理を指定する。 */
export type GoogleLoginFormProps = Pick<AuthenticationFormProps, 'onSuccess' | 'onFailure'>

/**
 * Googleポップアップ認証とTurnstileを使うログインフォームを表示する。
 *
 * @param props - ログイン成功・失敗後のページ固有コールバック。
 * @returns Googleログイン用のフォーム要素。
 */
export const GoogleLoginForm = (props: GoogleLoginFormProps) => (
  <AuthenticationForm
    login={loginWithGoogle}
    onSuccess={props.onSuccess}
    onFailure={props.onFailure}
    submitLabel={GOOGLE_LOGIN_BUTTON_LABEL}
    submittingLabel={GOOGLE_LOGIN_SUBMITTING_LABEL}
    fallbackErrorMessage={GOOGLE_LOGIN_ERROR_MESSAGE}
    icon={
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        class="h-5 w-5"
        aria-hidden="true"
      >
        <path
          fill="#4285F4"
          d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.9 14.8 48 24 48z"
        />
        <path
          fill="#FBBC05"
          d="M10.8 28.8A14.4 14.4 0 0 1 10 24c0-1.7.3-3.3.8-4.8v-6.2H2.7A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.8l8.1-6z"
        />
        <path
          fill="#EA4335"
          d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.2 30.4 0 24 0 14.8 0 6.7 5.1 2.7 13.2l8.1 6.2C12.7 13.6 17.9 9.5 24 9.5z"
        />
      </svg>
    }
  />
)
