import { localizedCopy } from '../../i18n'
/** 楽曲詳細のマスタ編集UIで使用する表示文言 */
export const SONG_EDIT_COPY = localizedCopy('songs.edit')

/** 楽曲詳細のマスタ編集フォームで使うテキスト入力の共通スタイル */
export const SONG_EDIT_TEXT_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-muted'

/** 楽曲詳細のマスタ編集フォームで使う数値入力の共通スタイル */
export const SONG_EDIT_NUMBER_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-3 py-2 hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
