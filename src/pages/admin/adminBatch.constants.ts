import type { AppTabOption } from '../../components/common/AppTabs'
import type { BatchJobStatus, BatchJobTrigger, SongBatchMode } from '../../types/api'
import type { AdminBatchTabValue } from './adminBatchTab'

/** バッチ管理画面のタブ選択肢 */
export const ADMIN_BATCH_TAB_OPTIONS: readonly AppTabOption<AdminBatchTabValue>[] = [
  { value: 'song', label: '楽曲バッチ' },
  { value: 'chartStats', label: '譜面統計バッチ' },
]

/** 各バッチの実行フォームと実行履歴で共通して表示する文言 */
export const BATCH_JOB_COPY = {
  runSection: '実行',
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
  startedAt: '開始 (JST)',
  startedAtUnknown: '未記録',
  duration: '所要時間',
  deletedRequester: '削除済みユーザー',
} as const

/** ジョブ状態の表示名 */
export const BATCH_JOB_STATUS_LABELS: Record<BatchJobStatus, string> = {
  RUNNING: '実行中',
  SUCCEEDED: '成功',
  SUCCEEDED_WITH_WARNINGS: '警告付き成功',
  FAILED: '失敗',
  INTERRUPTED: '中断',
}

/** 起動元の表示名。管理画面からの実行は要求者名を併せて表示する */
export const BATCH_JOB_TRIGGER_LABELS: Record<BatchJobTrigger, string> = {
  CLI: 'CLI',
  ADMIN: '管理画面',
}

/** 楽曲バッチタブに表示する文言 */
export const SONG_BATCH_COPY = {
  modeLabel: '実行モード',
  fillMissingReleaseDateLabel: 'リリース日を補完',
  maintenanceOnly: 'メンテナンス中のみ選択可能',
  startSuccess: '楽曲バッチを開始しました。',
  startFailure: '楽曲バッチを開始できませんでした。',
  warningCount: '除外したデータソース',
  fillMissingReleaseDateBadge: 'リリース日補完',
} as const

/**
 * 確認ダイアログの実行ボタンに、有効化までの残り秒数を付けた文言を返す。
 *
 * @param label - 実行ボタンの文言。
 * @param remainingSeconds - 有効化までの残り秒数。
 * @returns 残り秒数がある場合は「文言 (秒数)」、ない場合は文言のみ。
 */
export const formatSongBatchConfirmLabel = (label: string, remainingSeconds: number): string =>
  remainingSeconds > 0 ? `${label} (${remainingSeconds})` : label

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

/** 譜面統計バッチタブに表示する文言 */
export const CHART_STATS_BATCH_COPY = {
  startSuccess: '譜面統計バッチを開始しました。',
  startFailure: '譜面統計バッチを開始できませんでした。',
  confirmTitle: '譜面統計を再集計しますか？',
  confirmDescription:
    '全プレイヤーの記録から譜面統計とベスト枠採用率を再集計します。公開用の統計JSONは次回の定期更新で反映されます。',
  confirmButton: '再集計する',
} as const
