import { localizedCopy } from '../../i18n'

/** 理論値チェッカーの表示文言 */
const NEW_SONG_SSS_PLUS_TEXT = localizedCopy('tools.newSongSssPlus')
/** ベスト枠・新曲枠理論値チェッカーで使用する文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const NEW_SONG_SSS_PLUS_COPY = localizedCopy('tools.newSongSssPlus.newSongSssPlusCopy')

/** 理論値チェッカーの表示枠タブ */
export const RATING_THEORETICAL_TAB_OPTIONS = [
  { value: 'best', label: NEW_SONG_SSS_PLUS_TEXT.bestLabel },
  { value: 'new', label: NEW_SONG_SSS_PLUS_TEXT.newLabel },
] as const
