import { localizedCopy } from '../i18n'
/** メンテナンスコメントに許可するUnicodeコードポイント数 */
export const MAINTENANCE_COMMENT_MAX_CODE_POINTS = 1_000

/** メンテナンス中の状態確認間隔（ミリ秒） */
export const MAINTENANCE_POLL_INTERVAL_MS = 60_000

/** Retry-Afterが利用できない場合の再確認間隔（秒） */
export const MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS = MAINTENANCE_POLL_INTERVAL_MS / 1_000

/** API接続不能時に順番に使用する再試行間隔（ミリ秒） */
export const API_UNAVAILABLE_RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000] as const

/** メンテナンスコメントの検証エラー文言 */
export const MAINTENANCE_COMMENT_ERROR_MESSAGES = localizedCopy('maintenance.commentErrors')

/** システム状態の表示文言 */
export const SYSTEM_STATUS_LABELS = localizedCopy('maintenance.systemStatus')

/** メンテナンス・接続不能時の表示文言 */
export const MAINTENANCE_COPY = localizedCopy('maintenance')
/** 一般利用者向けメンテナンス画面の文言 */
export const MAINTENANCE_PAGE_COPY = localizedCopy('maintenance.page')

/** API接続不能画面の文言 */
export const API_UNAVAILABLE_PAGE_COPY = localizedCopy('maintenance.apiUnavailablePage')
