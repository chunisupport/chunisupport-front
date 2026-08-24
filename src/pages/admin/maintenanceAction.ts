import type { UpdateMaintenanceRequest } from '../../types/api'
import { normalizeMaintenanceComment } from '../../utils/maintenanceComment'

/** 管理画面から実行できるメンテナンス状態の変更操作 */
export type MaintenanceAction = 'start' | 'update' | 'end'

/**
 * 管理画面の操作内容からAPIへ送るメンテナンス更新リクエストを生成する。
 *
 * @param action - 開始、コメント更新、終了のいずれか。
 * @param comment - 管理画面へ入力されたコメント。
 * @returns APIの正規化規則を適用したメンテナンス更新リクエスト。
 */
export const buildMaintenanceUpdateRequest = (
  action: MaintenanceAction,
  comment: string
): UpdateMaintenanceRequest => ({
  enabled: action !== 'end',
  comment: action === 'end' ? '' : normalizeMaintenanceComment(comment),
})

/**
 * 入力中と現在公開中のメンテナンスコメントが実質的に同じか判定する。
 *
 * @param draftComment - 入力中のコメント。
 * @param currentComment - 現在公開されているコメント。
 * @returns APIの正規化後に同じ内容となる場合はtrue。
 */
export const isMaintenanceCommentUnchanged = (
  draftComment: string,
  currentComment: string
): boolean =>
  normalizeMaintenanceComment(draftComment) === normalizeMaintenanceComment(currentComment)
