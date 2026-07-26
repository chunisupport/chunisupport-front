import { useNavigate, useSearchParams } from '@solidjs/router'
import { signOut } from 'firebase/auth'

import { GoogleLoginForm } from '../../components/auth/GoogleLoginForm'
import { MAINTENANCE_STAFF_ONLY_ERROR_MESSAGE } from '../../constants/maintenance'
import { MAINTENANCE_LOGIN_PAGE_TITLE } from '../../constants/pageTitles'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { auth } from '../../lib/firebase'
import { clearAuthenticatedUser, setAuthenticatedUser } from '../../stores/authSession'
import type { UserDTO } from '../../types/api'
import {
  createMaintenanceStaffRequiredError,
  isInvalidTokenLoginError,
  isMaintenanceModeLoginError,
  isMaintenanceStaffRequiredError,
  isUnregisteredLoginError,
  normalizeRedirectParam,
  resolveMaintenanceLoginDestination,
} from '../../usecases/auth/loginFlow'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  MAINTENANCE_LOGIN_DESCRIPTION,
  MAINTENANCE_LOGIN_ERROR_MESSAGE,
  MAINTENANCE_LOGIN_INVALID_TOKEN_MESSAGE,
  MAINTENANCE_LOGIN_SITE_NAME,
} from './maintenanceLogin.constants'

/**
 * スタッフとして許可できなかったFirebase認証とアプリ内セッションを破棄する。
 *
 * @returns セッション破棄の試行が完了した後に解決されるPromise。
 */
const clearRejectedStaffSession = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch {
    // Firebase側の破棄に失敗しても、画面上のスタッフ権限は必ず破棄する。
  } finally {
    clearAuthenticatedUser()
  }
}

/**
 * ADMINとEDITORだけが利用できる非公開導線のGoogleログイン画面を表示する。
 *
 * @returns スタッフログインフォームを含むページ要素。
 */
const MaintenanceLoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectParam = () => normalizeRedirectParam(searchParams.redirect)

  /**
   * APIが返したロールを検証し、許可されたスタッフの遷移先へ移動する。
   *
   * @param user - バックエンドのログイン検証に成功したユーザー情報。
   * @returns ロール検証と遷移処理の完了後に解決されるPromise。
   */
  const handleLoginSuccess = async (user: UserDTO): Promise<void> => {
    const destination = resolveMaintenanceLoginDestination(user.account_type, redirectParam())
    if (destination.kind === 'forbidden') {
      await clearRejectedStaffSession()
      throw createMaintenanceStaffRequiredError()
    }

    setAuthenticatedUser(user)
    navigate(destination.path)
  }

  /**
   * スタッフログイン固有の失敗を処理し、フォームに表示する文言を返す。
   *
   * @param error - 共通ログインフォームから受け取った不明なエラー値。
   * @returns フォーム付近に表示するスタッフログイン用エラーメッセージ。
   */
  const handleLoginFailure = async (error: unknown): Promise<string> => {
    if (isMaintenanceStaffRequiredError(error)) {
      return MAINTENANCE_STAFF_ONLY_ERROR_MESSAGE
    }

    if (isInvalidTokenLoginError(error)) {
      await clearRejectedStaffSession()
      return MAINTENANCE_LOGIN_INVALID_TOKEN_MESSAGE
    }

    if (isMaintenanceModeLoginError(error) || isUnregisteredLoginError(error)) {
      await clearRejectedStaffSession()
      return MAINTENANCE_STAFF_ONLY_ERROR_MESSAGE
    }

    return toUserFriendlyErrorMessage(error, MAINTENANCE_LOGIN_ERROR_MESSAGE)
  }

  useDocumentTitle(MAINTENANCE_LOGIN_PAGE_TITLE)

  return (
    <main class="min-h-dvh flex justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <p class="mb-2 text-text-muted">{MAINTENANCE_LOGIN_SITE_NAME}</p>
          <h1 class="text-2xl font-semibold">{MAINTENANCE_LOGIN_PAGE_TITLE}</h1>
          <p class="mt-2 text-sm text-text-muted">{MAINTENANCE_LOGIN_DESCRIPTION}</p>
        </div>

        <GoogleLoginForm onSuccess={handleLoginSuccess} onFailure={handleLoginFailure} />
      </div>
    </main>
  )
}

export default MaintenanceLoginPage
