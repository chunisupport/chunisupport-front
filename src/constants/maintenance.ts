/** メンテナンスコメントに許可するUnicodeコードポイント数 */
export const MAINTENANCE_COMMENT_MAX_CODE_POINTS = 1_000

/** メンテナンス中の状態確認間隔（ミリ秒） */
export const MAINTENANCE_POLL_INTERVAL_MS = 60_000

/** Retry-Afterが利用できない場合の再確認間隔（秒） */
export const MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS = MAINTENANCE_POLL_INTERVAL_MS / 1_000

/** API接続不能時に順番に使用する再試行間隔（ミリ秒） */
export const API_UNAVAILABLE_RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000] as const

/** メンテナンス状態の日時表示に使用するIANAタイムゾーン */
export const MAINTENANCE_TIME_ZONE = 'Asia/Tokyo'

/** メンテナンスコメントの検証エラー文言 */
export const MAINTENANCE_COMMENT_ERROR_MESSAGES = {
  required: 'メンテナンスコメントを入力してください',
  too_long: 'メンテナンスコメントは1,000文字以内で入力してください',
  control_character: '改行以外の制御文字は使用できません',
} as const

/** システム状態の表示文言 */
export const SYSTEM_STATUS_LABELS = {
  operational: '通常稼働中',
  maintenance: 'メンテナンス中',
} as const

/** メンテナンス状態を手動で再確認するボタンの文言 */
export const MAINTENANCE_RECHECK_BUTTON_LABEL = '状態を再確認'

/** API接続を手動で再試行するボタンの文言 */
export const API_UNAVAILABLE_RETRY_BUTTON_LABEL = '再試行'

/** API接続不能画面に表示する案内文 */
export const API_UNAVAILABLE_MESSAGE =
  'ネットワーク接続を確認し、時間を置いてから再試行してください'

/** スタッフ用ログイン画面で非スタッフへ表示するエラー文言 */
export const MAINTENANCE_STAFF_ONLY_ERROR_MESSAGE = 'このログイン画面は管理者・編集者専用です'

/** 可用性確認中のスクリーンリーダー向け文言 */
export const AVAILABILITY_CHECKING_LABEL = 'サービスの状態を確認しています'

/** 一般利用者向けメンテナンス画面の文言 */
export const MAINTENANCE_PAGE_COPY = {
  heading: 'メンテナンス中です',
  defaultComment: '現在、サービスのメンテナンスを実施しています。',
  updatedAtLabel: '状態更新',
  timeZoneLabel: 'JST',
} as const

/** API接続不能画面の文言 */
export const API_UNAVAILABLE_PAGE_COPY = {
  heading: 'サービスに接続できません',
  retrying: '接続を確認しています',
  unchanged: 'まだサービスに接続できません',
  recovered: 'サービスへの接続を確認しました',
} as const
