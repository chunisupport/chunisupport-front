/** 未解禁楽曲設定ダイアログで要解禁楽曲だけを表示する初期状態 */
export const DEFAULT_LOCKED_SONGS_UNLOCK_REQUIRED_ONLY = true

/** 未解禁楽曲設定ダイアログの要解禁楽曲表示操作のラベル */
export const LOCKED_SONGS_UNLOCK_REQUIRED_ONLY_LABEL = '要解禁楽曲のみ表示'

/** 未解禁楽曲設定ダイアログのプレイ状況フィルター */
export type LockedSongsPlayStatus = 'played' | 'unplayed'

/** 未解禁楽曲設定ダイアログのプレイ状況フィルター選択肢 */
export const LOCKED_SONG_PLAY_STATUS_OPTIONS = [
  { value: 'unplayed', label: '未プレイ' },
  { value: 'played', label: 'プレイ済み' },
] as const

/** 未解禁楽曲設定ダイアログのプレイ状況フィルター表示文言 */
export const LOCKED_SONG_PLAY_STATUS_FILTER_COPY = {
  label: 'プレイ状況',
  suffix: 'のみ表示',
  ariaLabel: 'プレイ状況フィルターを有効にする',
} as const
