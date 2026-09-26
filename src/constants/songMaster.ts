import { localizedCopy } from '../i18n'
/** 楽曲マスタ編集フォームの入力上限 */
export const SONG_EDIT_INPUT_LIMITS = {
  notesDesigner: 100,
  wikiPageTitle: 300,
} as const

/** 楽曲マスタ操作の表示文言 */
export const SONG_MASTER_COPY = localizedCopy('songMaster')
