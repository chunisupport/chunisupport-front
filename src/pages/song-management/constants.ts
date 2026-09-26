import { localizedCopy } from '../../i18n'
/** 楽曲管理画面の操作ボタン文言 */
export const SONG_MANAGEMENT_ACTION_COPY = localizedCopy('songManagement.songManagementActionCopy')

/** 楽曲管理画面の見出し・説明文言 */
export const SONG_MANAGEMENT_SECTION_COPY = localizedCopy(
  'songManagement.songManagementSectionCopy'
)

/** 楽曲管理画面の入力項目文言 */
export const SONG_MANAGEMENT_FIELD_COPY = localizedCopy('songManagement.songManagementFieldCopy')

/** 楽曲管理画面の入力上限 */
export const SONG_MANAGEMENT_INPUT_LIMITS = {
  officialIdx: 10,
  reading: 300,
} as const

/** 楽曲管理画面の操作結果・検証エラー文言 */
export const SONG_MANAGEMENT_MESSAGES = localizedCopy('songManagement.songManagementMessages')
