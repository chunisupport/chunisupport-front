import { TwitterAuthProvider, type UserCredential } from 'firebase/auth'

import { syncXAccount } from '../../api/xAccount'
import { AUTH_PROVIDER_BY_KIND } from '../../constants/authProviders'
import type { XAccountDTO } from '../../types/api'

/**
 * 未登録のままログイン画面から新規登録へ進んだときの X 認証結果。
 * @ID は登録後にしか保存できず、X のトークンは認証直後にしか得られないため、登録完了まで画面をまたいで保持する。
 * メモリ上だけに置き、ページを離れたら破棄する。
 */
let heldXAuthResult: UserCredential | undefined

/**
 * X での認証結果を、新規登録の完了まで保持する。X 以外の認証結果を渡した場合は保持していた結果を破棄する。
 *
 * @param result - ポップアップ認証の結果。
 * @returns なし。
 */
export const holdXAuthResultForSignup = (result: UserCredential): void => {
  heldXAuthResult = result.providerId === AUTH_PROVIDER_BY_KIND.x.providerId ? result : undefined
}

/**
 * 保持していた X の認証結果を取り出す。別の Firebase ユーザーの結果は使わずに破棄する。
 *
 * @param firebaseUid - ログイン中の Firebase ユーザーの UID。
 * @returns 同じユーザーの X 認証結果。保持していない場合は undefined。
 */
export const takeHeldXAuthResult = (firebaseUid: string): UserCredential | undefined => {
  const result = heldXAuthResult
  heldXAuthResult = undefined
  return result?.user.uid === firebaseUid ? result : undefined
}

/**
 * X でのポップアップ認証の結果から、X の @ID を API に取得し直させる。
 * Firebase の連携情報には @ID が含まれず、X のアクセストークンは認証直後にしか得られないため、
 * ログイン・新規登録・連携のたびに呼ぶ。
 * @ID は表示を補うだけなので、取得できなくても認証の処理は止めない。
 *
 * @param result - `signInWithPopup` などが返したポップアップ認証の結果。
 * @returns API が保存した X アカウント。X 以外の認証、または取得に失敗した場合は undefined。
 */
export const syncXAccountFromResult = async (
  result: UserCredential
): Promise<XAccountDTO | undefined> => {
  if (result.providerId !== AUTH_PROVIDER_BY_KIND.x.providerId) return undefined

  const credential = TwitterAuthProvider.credentialFromResult(result)
  if (!credential?.accessToken || !credential.secret) return undefined

  try {
    return await syncXAccount({
      access_token: credential.accessToken,
      access_token_secret: credential.secret,
    })
  } catch {
    return undefined
  }
}
