import { localizedCopy, withLocalizedLabels } from '../../i18n'
import type { DataTransferBlocker, DataTransferCountsResponse } from '../../types/api'

/** データ移行画面で使用する文言 */
export const DATA_TRANSFER_COPY = localizedCopy('settings.dataTransfer')

/** APIが受け付ける移行ファイルの最大サイズ */
export const DATA_TRANSFER_MAX_FILE_SIZE_BYTES = 32 * 1024 * 1024

/** Kobalte FileFieldへ渡す移行ファイル形式 */
export const DATA_TRANSFER_ACCEPT = ['application/json', '.json'] as const

/** 検証結果に表示するセクション別件数 */
export const DATA_TRANSFER_COUNT_ITEMS: readonly {
  key: keyof DataTransferCountsResponse
  label: string
}[] = withLocalizedLabels(
  [
    { key: 'records' },
    { key: 'record_histories' },
    { key: 'worldsend_records' },
    { key: 'worldsend_record_histories' },
    { key: 'metric_histories' },
    { key: 'course_records' },
    { key: 'honors' },
    { key: 'favorite_songs' },
    { key: 'locked_songs' },
    { key: 'goal_groups' },
    { key: 'goals' },
    { key: 'record_filters' },
  ],
  DATA_TRANSFER_COPY.counts,
  'label',
  'key'
)

/** APIの移行阻害理由に対応する表示文言 */
export const DATA_TRANSFER_BLOCKER_MESSAGES: Record<DataTransferBlocker, string> = localizedCopy(
  'settings.dataTransfer.blockers'
)
