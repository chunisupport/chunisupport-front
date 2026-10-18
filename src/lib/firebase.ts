import { getAnalytics } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import {
  type Auth,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth'

import { getEnv, getRequiredEnv } from './env'

const env = getEnv()

const firebaseConfig = {
  apiKey: getRequiredEnv('PUBLIC_FB_API_KEY'),
  authDomain: getRequiredEnv('PUBLIC_FB_AUTH_DOMAIN'),
  projectId: getRequiredEnv('PUBLIC_FB_PROJECT_ID'),
  storageBucket: getRequiredEnv('PUBLIC_FB_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnv('PUBLIC_FB_MESSAGING_SENDER_ID'),
  appId: getRequiredEnv('PUBLIC_FB_APP_ID'),
  measurementId: env.PUBLIC_FB_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

/** ブラウザ環境で初期化されたFirebase Analytics */
export const analytics = typeof window === 'undefined' ? undefined : getAnalytics(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

/** ログイン用アカウント変更で変更先のサインインに使う Firebase App 名 */
const ACCOUNT_CHANGE_APP_NAME = 'account-change'

let accountChangeAuth: Auth | undefined

/**
 * ログイン中のセッションを切り替えずに変更先アカウントへサインインするための Auth を取得する。
 * 別の Firebase App としてメモリ上だけに保持し、ページを離れたら変更先のサインイン状態を破棄する。
 *
 * @returns 変更先アカウント用の Auth インスタンス。
 */
export const getAccountChangeAuth = (): Auth => {
  accountChangeAuth ??= initializeAuth(initializeApp(firebaseConfig, ACCOUNT_CHANGE_APP_NAME), {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  })
  return accountChangeAuth
}

/** 変更先アカウントの選択用プロバイダ。ブラウザでログイン済みのアカウントを自動選択させない。 */
export const accountChangeGoogleProvider = new GoogleAuthProvider()
accountChangeGoogleProvider.setCustomParameters({ prompt: 'select_account' })
