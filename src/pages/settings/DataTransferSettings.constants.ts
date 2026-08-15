import type { DataTransferBlocker, DataTransferCountsResponse } from '../../types/api'

/** APIが受け付ける移行ファイルの最大サイズ。 */
export const DATA_TRANSFER_MAX_FILE_SIZE_BYTES = 32 * 1024 * 1024

/** Kobalte FileFieldへ渡す移行ファイル形式。 */
export const DATA_TRANSFER_ACCEPT = ['application/json', '.json'] as const

/** データ移行画面で使用する文言。 */
export const DATA_TRANSFER_COPY = {
  title: 'データ移行',
  description: 'ユーザーデータを別のChuniSupport環境へ移行します。',
  exportTitle: 'エクスポート',
  exportDescription: '現在のプレイヤーデータ、履歴、目標、保存設定をJSONで保存します。',
  exportButton: 'データをエクスポート',
  exportingButton: 'エクスポート中',
  exportSuccess: '移行ファイルを保存しました。',
  exportFailure: 'データのエクスポートに失敗しました。',
  importTitle: 'インポート',
  importDescription: 'エクスポートしたJSONを検証し、空のアカウントへ移行します。',
  fileLabel: '移行ファイル',
  dropzone: 'JSONファイルをドロップ',
  chooseFile: 'ファイルを選択',
  fileDescription: 'JSON形式・最大32 MiB',
  invalidFile: 'JSON形式の移行ファイルを1件選択してください。',
  fileTooLarge: '移行ファイルは32 MiB以下にしてください。',
  validateButton: '内容を確認',
  validatingButton: '確認中',
  validationFailure: '移行ファイルの確認に失敗しました。',
  previewTitle: 'インポート内容',
  playerLabel: 'プレイヤー名',
  importable: 'インポートできます',
  notImportable: 'インポートできません',
  importButton: 'この内容をインポート',
  importingButton: 'インポート中',
  importSuccess: 'ユーザーデータをインポートしました。',
  importFailure: 'データのインポートに失敗しました。',
  unresolvedReferencesTitle: '移行先で参照できないデータ',
  removeFileSuffix: 'の選択を解除',
  countUnit: '件',
} as const

/** 検証結果に表示するセクション別件数。 */
export const DATA_TRANSFER_COUNT_ITEMS: readonly {
  key: keyof DataTransferCountsResponse
  label: string
}[] = [
  { key: 'records', label: '通常レコード' },
  { key: 'record_histories', label: '通常スコア履歴' },
  { key: 'worldsend_records', label: "WORLD'S ENDレコード" },
  { key: 'worldsend_record_histories', label: "WORLD'S END履歴" },
  { key: 'metric_histories', label: 'RATING・OP履歴' },
  { key: 'course_records', label: 'コースレコード' },
  { key: 'honors', label: '称号' },
  { key: 'favorite_songs', label: 'お気に入り楽曲' },
  { key: 'locked_songs', label: '未解禁曲' },
  { key: 'goal_groups', label: '目標グループ' },
  { key: 'goals', label: '目標' },
  { key: 'record_filters', label: '保存済みフィルター' },
]

/** APIの移行阻害理由に対応する表示文言。 */
export const DATA_TRANSFER_BLOCKER_MESSAGES: Record<DataTransferBlocker, string> = {
  destination_not_empty: 'このアカウントには既に移行対象データがあります。',
  unresolved_references: '移行先で参照できないデータが含まれています。',
}
