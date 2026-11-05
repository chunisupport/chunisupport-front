import { initializeApp } from 'firebase/app'
import {
  type Auth,
  type AuthProvider,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  TwitterAuthProvider,
} from 'firebase/auth'

import type { AuthProviderKind } from '../constants/authProviders'
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

/** 既定の Firebase App。Analytics は初期バンドルから外すため `lib/analytics` で遅延初期化する。 */
export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

/** 認証プロバイダ作成時の追加指定 */
type AuthProviderOptions = {
  /** Google のアカウント選択画面で事前選択するメールアドレス */
  loginHint?: string
}

/**
 * 認証プロバイダの種類から Firebase のプロバイダを作成する。
 *
 * @param kind - 認証プロバイダの種類。
 * @param options - Google のアカウント選択画面への追加指定。
 * @returns ポップアップ認証に渡す Firebase のプロバイダ。
 */
export const createAuthProvider = (
  kind: AuthProviderKind,
  options: AuthProviderOptions = {}
): AuthProvider => {
  switch (kind) {
    case 'google': {
      const provider = new GoogleAuthProvider()
      if (options.loginHint) provider.setCustomParameters({ login_hint: options.loginHint })
      return provider
    }
    case 'x':
      return new TwitterAuthProvider()
  }
}

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
