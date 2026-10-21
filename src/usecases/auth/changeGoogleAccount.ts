import {
  GoogleAuthProvider,
  type OAuthCredential,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth'

import { reauthenticateAndGetToken } from '../../api/reauthenticate'
import { changeFirebaseAccount } from '../../api/settings'
import { fetchMe } from '../../api/users'
import { accountChangeGoogleProvider, auth, getAccountChangeAuth } from '../../lib/firebase'
import { errorMessages } from '../../types/api'
import { resolveGoogleRegistrationEligibility } from './registrationEligibility'

/** 変更先として選択されたGoogleアカウント */
export type GoogleAccountChangeTarget = {
  /** 確認表示用のメールアドレス */
  email: string
  /** 変更後にログイン中のセッションを切り替えるための認証情報 */
  credential: OAuthCredential | null
}

/**
 * ログイン中のアカウントがGoogleアカウント変更を利用できるかを判定する。
 * 再認証をGoogleで行うため、メール／パスワード専用アカウントでは利用できない。
 *
 * @returns Googleでログインしている場合は true。
 */
export const canChangeGoogleAccount = (): boolean =>
  auth.currentUser?.providerData.some(
    (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
  ) ?? false

/**
 * エラーコード付きのエラーを作成する。
 *
 * @param code - 画面側で判定に使うエラーコード。
 * @returns エラーコードに対応する文言を持つエラー。
 */
const createCodedError = (code: 'firebase_account_unchanged' | 'firebase_uid_already_linked') =>
  Object.assign(new Error(errorMessages[code]), { code })

/**
 * ログイン中のセッションを維持したまま、変更先のGoogleアカウントを選択してサインインする。
 * 変更できないアカウントは本人確認へ進む前に弾き、選択をなかったことにする。
 *
 * @returns 選択された変更先アカウント。
 * @throws 現在と同じアカウントが選ばれた場合は `firebase_account_unchanged`、
 *   すでにユーザー登録済みのアカウントが選ばれた場合は `firebase_uid_already_linked` コードのエラー。
 */
export const selectGoogleAccountChangeTarget = async (): Promise<GoogleAccountChangeTarget> => {
  const accountChangeAuth = getAccountChangeAuth()
  const result = await signInWithPopup(accountChangeAuth, accountChangeGoogleProvider)
  try {
    if (result.user.uid === auth.currentUser?.uid) {
      throw createCodedError('firebase_account_unchanged')
    }
    // 変更先のトークンで照会し、ログイン中のセッションには影響させない。
    const eligibility = await resolveGoogleRegistrationEligibility(async () =>
      fetchMe({ redirectOnUnauthorized: false, idToken: await result.user.getIdToken() })
    )
    if (eligibility === 'registered') {
      throw createCodedError('firebase_uid_already_linked')
    }
  } catch (error) {
    // サインアウトに失敗しても、画面にはアカウントを弾いた理由を伝える。
    await signOut(accountChangeAuth).catch(() => undefined)
    throw error
  }

  return {
    email: result.user.email ?? '',
    credential: GoogleAuthProvider.credentialFromResult(result),
  }
}

/**
 * 選択済みの変更先アカウントの選択を取り消す。
 *
 * @returns サインアウト完了後に解決されるPromise。
 */
export const cancelGoogleAccountChange = (): Promise<void> => signOut(getAccountChangeAuth())

/**
 * 現在のアカウントで再認証し、ログインに使うGoogleアカウントを変更先へ差し替える。
 * 変更後は旧アカウントが削除されるため、ログイン中のセッションを変更先アカウントへ切り替える。
 *
 * @param target - 選択済みの変更先アカウント。
 * @returns ログイン中のセッションを変更先へ切り替えられた場合は true。
 */
export const changeGoogleAccount = async (target: GoogleAccountChangeTarget): Promise<boolean> => {
  const newAccount = getAccountChangeAuth().currentUser
  if (!newAccount) {
    throw Object.assign(new Error(errorMessages.recent_sign_in_required), {
      code: 'recent_sign_in_required',
    })
  }

  // クリック直後にポップアップを開かないとブロックされるため、ほかの await より先に再認証する。
  const reauthToken = await reauthenticateAndGetToken()
  const newAccountIdToken = await newAccount.getIdToken()
  await changeFirebaseAccount(newAccountIdToken, reauthToken)
  // 差し替えは完了しているため、変更先のサインイン状態の破棄に失敗しても成功として扱う。
  await cancelGoogleAccountChange().catch(() => undefined)

  if (!target.credential) return false
  try {
    await signInWithCredential(auth, target.credential)
    return true
  } catch {
    return false
  }
}
