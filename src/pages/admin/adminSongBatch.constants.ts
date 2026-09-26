import { SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_PHRASE } from '../../constants/songBatch'
import type { SongBatchJobStatus, SongBatchMode, SongBatchTrigger } from '../../types/api'

/** 楽曲バッチ管理画面に表示する文言 */
export const ADMIN_SONG_BATCH_COPY = {
  heading: '楽曲バッチ',
  runSection: '実行',
  modeLabel: '実行モード',
  fillMissingReleaseDateLabel: 'リリース日を補完',
  fillMissingReleaseDateDescription: '日付が得られない新規楽曲に実行日を設定',
  runButton: '実行',
  runningButton: '実行中',
  historySection: '実行履歴',
  loadingHistory: '実行履歴を読み込んでいます',
  historyLoadFailed: '実行履歴を取得できませんでした。',
  historyRefreshFailed: '最新の実行履歴を取得できませんでした。',
  retryButton: '再読み込み',
  emptyHistory: '実行履歴はありません',
  cancelButton: 'キャンセル',
  submitting: '送信中...',
  confirmationInputLabel: `確認のため「${SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_PHRASE}」と入力`,
  startSuccess: '楽曲バッチを開始しました。',
  startFailure: '楽曲バッチを開始できませんでした。',
  startedAt: '開始 (JST)',
  startedAtUnknown: '未記録',
  duration: '所要時間',
  warningCount: '除外したデータソース',
  fillMissingReleaseDateBadge: 'リリース日補完',
  deletedRequester: '削除済みユーザー',
} as const

/** 実行モードの表示名 */
export const SONG_BATCH_MODE_LABELS: Record<SongBatchMode, string> = {
  NORMAL: '通常実行',
  MAJOR_UPDATE: '大型アップデート',
}

/** 実行モードの選択肢 */
export const SONG_BATCH_MODE_OPTIONS: readonly {
  /** APIへ送信する実行モード */
  value: SongBatchMode
  /** 選択肢の表示名 */
  label: string
  /** 使用するデータソースの概要 */
  description: string
}[] = [
  { value: 'NORMAL', label: SONG_BATCH_MODE_LABELS.NORMAL, description: '全データソース' },
  {
    value: 'MAJOR_UPDATE',
    label: SONG_BATCH_MODE_LABELS.MAJOR_UPDATE,
    description: '公式データと追加楽曲のみ',
  },
]

/** ジョブ状態の表示名 */
export const SONG_BATCH_STATUS_LABELS: Record<SongBatchJobStatus, string> = {
  RUNNING: '実行中',
  SUCCEEDED: '成功',
  SUCCEEDED_WITH_WARNINGS: '警告付き成功',
  FAILED: '失敗',
  INTERRUPTED: '中断',
}

/** 起動元の表示名。管理画面からの実行は要求者名を併せて表示する */
export const SONG_BATCH_TRIGGER_LABELS: Record<SongBatchTrigger, string> = {
  CLI: 'CLI',
  ADMIN: '管理画面',
}

/** 実行モードごとの確認ダイアログ文言 */
export const SONG_BATCH_CONFIRMATION_COPY: Record<
  SongBatchMode,
  {
    /** 確認ダイアログの見出し */
    title: string
    /** 操作の影響を示す文言 */
    description: string
    /** 確定ボタンの文言 */
    confirmButton: string
  }
> = {
  NORMAL: {
    title: '楽曲バッチを実行しますか？',
    description: '全データソースを取得し、楽曲・譜面データを更新します。',
    confirmButton: '実行する',
  },
  MAJOR_UPDATE: {
    title: '大型アップデートを実行しますか？',
    description:
      '公式データと追加楽曲だけで楽曲・譜面データを更新し、公式レベルに応じて譜面定数を不明化します。',
    confirmButton: '大型アップデートを実行する',
  },
}
