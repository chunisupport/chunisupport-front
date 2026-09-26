import { formatMessage, localizedCopy } from '../../i18n'
import { SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_PHRASE } from '../../constants/songBatch'
import type { SongBatchJobStatus, SongBatchMode, SongBatchTrigger } from '../../types/api'

/** 楽曲バッチ画面の表示文言 */
const ADMIN_SONG_BATCH_TEXT = localizedCopy('admin.songBatch')

/** 楽曲バッチ管理画面に表示する文言 */
export const ADMIN_SONG_BATCH_COPY = {
  heading: ADMIN_SONG_BATCH_TEXT.heading,
  runSection: ADMIN_SONG_BATCH_TEXT.runSection,
  modeLabel: ADMIN_SONG_BATCH_TEXT.modeLabel,
  fillMissingReleaseDateLabel: ADMIN_SONG_BATCH_TEXT.fillMissingReleaseDateLabel,
  runButton: ADMIN_SONG_BATCH_TEXT.runButton,
  runningButton: ADMIN_SONG_BATCH_TEXT.runningButton,
  historySection: ADMIN_SONG_BATCH_TEXT.historySection,
  loadingHistory: ADMIN_SONG_BATCH_TEXT.loadingHistory,
  historyLoadFailed: ADMIN_SONG_BATCH_TEXT.historyLoadFailed,
  historyRefreshFailed: ADMIN_SONG_BATCH_TEXT.historyRefreshFailed,
  retryButton: ADMIN_SONG_BATCH_TEXT.retryButton,
  emptyHistory: ADMIN_SONG_BATCH_TEXT.emptyHistory,
  cancelButton: ADMIN_SONG_BATCH_TEXT.cancelButton,
  submitting: ADMIN_SONG_BATCH_TEXT.submitting,
  confirmationInputLabel: formatMessage(ADMIN_SONG_BATCH_TEXT.confirmationInputLabel, {
    phrase: SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_PHRASE,
  }),
  startSuccess: ADMIN_SONG_BATCH_TEXT.startSuccess,
  startFailure: ADMIN_SONG_BATCH_TEXT.startFailure,
  startedAt: ADMIN_SONG_BATCH_TEXT.startedAt,
  startedAtUnknown: ADMIN_SONG_BATCH_TEXT.startedAtUnknown,
  duration: ADMIN_SONG_BATCH_TEXT.duration,
  warningCount: ADMIN_SONG_BATCH_TEXT.warningCount,
  fillMissingReleaseDateBadge: ADMIN_SONG_BATCH_TEXT.fillMissingReleaseDateBadge,
  deletedRequester: ADMIN_SONG_BATCH_TEXT.deletedRequester,
} as const

/** 実行モードの表示名 */
export const SONG_BATCH_MODE_LABELS: Record<SongBatchMode, string> = localizedCopy('admin.songBatch.songBatchModeLabels')

/** 実行モードの選択肢 */
export const SONG_BATCH_MODE_OPTIONS: readonly {
  /** APIへ送信する実行モード */
  value: SongBatchMode
  /** 選択肢の表示名 */
  label: string
  /** 使用するデータソースの概要 */
  description: string
}[] = [
  { value: 'NORMAL', label: SONG_BATCH_MODE_LABELS.NORMAL, description: ADMIN_SONG_BATCH_TEXT.normalDescription },
  {
    value: 'MAJOR_UPDATE',
    label: SONG_BATCH_MODE_LABELS.MAJOR_UPDATE,
    description: ADMIN_SONG_BATCH_TEXT.majorUpdateDescription,
  },
]

/** ジョブ状態の表示名 */
export const SONG_BATCH_STATUS_LABELS: Record<SongBatchJobStatus, string> = localizedCopy('admin.songBatch.songBatchStatusLabels')

/** 起動元の表示名。管理画面からの実行は要求者名を併せて表示する */
export const SONG_BATCH_TRIGGER_LABELS: Record<SongBatchTrigger, string> = localizedCopy('admin.songBatch.songBatchTriggerLabels')

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
> = localizedCopy('admin.songBatch.songBatchConfirmationCopy')
