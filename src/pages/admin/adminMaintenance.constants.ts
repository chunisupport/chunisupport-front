import type { MaintenanceAction } from './maintenanceAction'

/** メンテナンス管理画面に表示する文言。 */
export const ADMIN_MAINTENANCE_COPY = {
  heading: 'メンテナンス管理',
  loadingStatus: 'メンテナンス状態を確認しています',
  statusLoadFailed: 'メンテナンス状態を確認できませんでした。',
  currentStatus: '現在の状態',
  updatedAt: '最終更新 (JST)',
  updatedAtUnknown: '未記録',
  commentLabel: 'メンテナンスコメント',
  commentPlaceholder: '一般利用者へ表示する内容を入力してください',
  startButton: 'メンテナンスを開始',
  updateButton: 'コメントを更新',
  endButton: 'メンテナンスを終了',
  cancelButton: 'キャンセル',
  commentPreview: '表示予定のコメント',
  submitting: '処理中...',
} as const

/** メンテナンス変更操作ごとの確認・完了文言。 */
export const ADMIN_MAINTENANCE_ACTION_COPY: Record<
  MaintenanceAction,
  {
    /** 確認ダイアログの見出し。 */
    title: string
    /** 確認ダイアログで操作の影響を示す文言。 */
    description: string
    /** 確定ボタンの文言。 */
    confirmButton: string
    /** 成功時に操作位置の近くへ表示する文言。 */
    success: string
    /** 失敗理由を特定できない場合の文言。 */
    failure: string
  }
> = {
  start: {
    title: 'メンテナンスを開始しますか？',
    description: '開始すると、一般利用者のAPI利用を停止します。',
    confirmButton: '開始する',
    success: 'メンテナンスを開始しました。',
    failure: 'メンテナンスの開始に失敗しました。',
  },
  update: {
    title: 'メンテナンスコメントを更新しますか？',
    description: '変更したコメントを一般利用者の画面へ反映します。',
    confirmButton: '更新する',
    success: 'メンテナンスコメントを更新しました。',
    failure: 'メンテナンスコメントの更新に失敗しました。',
  },
  end: {
    title: 'メンテナンスを終了しますか？',
    description: '一般利用者のAPI利用を再開します。',
    confirmButton: '終了する',
    success: 'メンテナンスを終了しました。',
    failure: 'メンテナンスの終了に失敗しました。',
  },
}

/** メンテナンスコメント入力欄の表示行数。 */
export const ADMIN_MAINTENANCE_COMMENT_ROWS = 8
