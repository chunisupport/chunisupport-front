import { resolvePostLoginRedirectPath } from './redirectPath'

/**
 * 認証確認後の遷移先を決める。プロフィールの読み込みとエラー処理は遷移先が担当する。
 * @param username - 確認済みのユーザー名。
 * @param redirectPath - URL の戻り先候補。
 * @returns 安全な戻り先、または本人のページ。
 */
export const resolveAuthenticatedRedirect = (username: string, redirectPath?: string): string =>
  resolvePostLoginRedirectPath(redirectPath) ?? `/users/${encodeURIComponent(username)}`
