import type { UserProfileDTO } from '../../types/api.ts'
import type { AuthResolution } from './resolveAuthSession.ts'

/**
 * 自分のプレイヤーデータを使う機能の利用可否。
 *
 * - `unauthenticated`: 未ログイン
 * - `unregistered`: ログイン済みだがプレイヤーデータ未登録
 * - `registered`: プレイヤーデータ登録済み
 */
export type PlayerDataStatus = 'unauthenticated' | 'unregistered' | 'registered'

/** 認証情報を解決できなかった場合のエラーメッセージ */
export const AUTH_SESSION_ERROR_MESSAGE =
  '認証情報の取得に失敗しました。ページを再読み込みしてください。'

/** 認証状態の解決とプロフィール取得の依存関係 */
type Dependencies = {
  /** 認証セッションを解決する */
  resolveAuth: () => Promise<AuthResolution>
  /** 認証済みユーザーのユーザー名を返す */
  getUsername: () => string | null
  /** ユーザーのプロフィール概要を取得する */
  fetchProfile: (username: string) => Promise<UserProfileDTO>
}

/**
 * ログイン状態とプレイヤーデータ登録状態を解決する。
 *
 * @param dependencies - 認証セッション解決、ユーザー名取得、プロフィール取得の処理。
 * @returns 自分のプレイヤーデータの利用可否。
 * @throws 認証情報やプロフィールの取得に失敗した場合。
 */
export const resolvePlayerDataStatus = async (
  dependencies: Dependencies
): Promise<PlayerDataStatus> => {
  const authResolution = await dependencies.resolveAuth()
  if (authResolution === 'unauthenticated') return 'unauthenticated'

  const username = dependencies.getUsername()
  if (authResolution === 'error' || username === null) {
    throw new Error(AUTH_SESSION_ERROR_MESSAGE)
  }

  const profile = await dependencies.fetchProfile(username)
  return profile.player === null ? 'unregistered' : 'registered'
}
