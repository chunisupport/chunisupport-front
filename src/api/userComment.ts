import { API_BASE_URL } from '../config'
import type { UserCommentResponse } from '../types/api'
import { fetchWithAuth } from './fetchWithAuth'

/**
 * 指定したユーザーのプロフィールコメントを取得する。
 * コメントは `/updated-at` で判定するプロフィール・レコードのキャッシュには含まれないため、この関数で別途取得する。
 *
 * @param username - 取得対象のユーザー名。
 * @param signal - リクエストを中断するためのシグナル。
 * @returns 保存済みのコメント。未設定の場合は null。
 */
export const fetchUserComment = async (
  username: string,
  signal?: AbortSignal
): Promise<string | null> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/internal/users/${encodeURIComponent(username)}/comment`,
    { method: 'GET', signal }
  )
  const data = (await response.json()) as UserCommentResponse
  return data.comment
}

/**
 * ログイン中のユーザーのプロフィールコメントを保存する。
 * 前後の空白は API 側で取り除かれ、結果が空になる場合は未設定に戻る。
 *
 * @param comment - 保存するコメント。空文字を渡すと未設定に戻す。
 * @returns API が保存したコメント。未設定に戻した場合は null。
 */
export const updateMyComment = async (comment: string): Promise<string | null> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/internal/me/comment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
    requireAuthentication: true,
  })
  const data = (await response.json()) as UserCommentResponse
  return data.comment
}
