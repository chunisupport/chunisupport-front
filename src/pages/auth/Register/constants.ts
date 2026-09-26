import { DOCUMENTATION_BASE_URL } from '../../../config'
import { localizedCopy } from '../../../i18n'

const DOCUMENTATION_URL = DOCUMENTATION_BASE_URL.replace(/\/$/, '')

/** 利用規約の公開URL */
export const TERMS_URL = `${DOCUMENTATION_URL}/legal/terms/`
/** プライバシーポリシーの公開URL */
export const PRIVACY_POLICY_URL = `${DOCUMENTATION_URL}/legal/privacy/`

/** 新規登録画面の表示文言 */
export const REGISTER_COPY = localizedCopy('auth.register')
